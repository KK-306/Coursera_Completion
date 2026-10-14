import { Router } from 'express';
import crypto from 'node:crypto';
import Registration from '../models/Registration.js';
import { getPackageByIdOrCount } from '../config/packages.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const registrationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: 'Too many registrations from this IP. Please wait a few minutes before trying again.',
});

function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function validatePhone(phone) {
  return typeof phone === 'string' && /^[6-9]\d{9}$/.test(phone.trim());
}

// POST /api/registrations
router.post('/', registrationLimiter, async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      packageId,
      packageCount,
      courseDetails,
      courseraId,
      courseraPassword,
      consent,
    } = req.body ?? {};

    // 1. Validate student name
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid full name (2–100 characters).',
      });
    }

    // 2. Validate Indian mobile number
    if (!phone || !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
      });
    }

    // 3. Validate email
    if (!email || !validateEmail(email.trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // 4. Validate package identifier & calculate price strictly on server
    const chosenPackage = getPackageByIdOrCount(packageId || packageCount);
    if (!chosenPackage) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid package (1, 2, 3, or 4 courses).',
      });
    }

    // 5. Validate course details
    if (!courseDetails || typeof courseDetails !== 'string' || courseDetails.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the Coursera course title(s) or URL(s).',
      });
    }

    // 6. Validate consent
    if (consent !== true && consent !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'You must agree to the processing of submitted information to proceed.',
      });
    }

    // 7. Check for recent duplicate pending registration within 30 seconds
    const sanitizedPhone = phone.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const recentDuplicate = await Registration.findOne({
      studentEmail: sanitizedEmail,
      studentPhone: sanitizedPhone,
      createdAt: { $gte: thirtySecondsAgo },
    });

    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        registrationId: recentDuplicate.registrationId,
        orderSummary: {
          registrationId: recentDuplicate.registrationId,
          packageId: recentDuplicate.packageId,
          packageLabel: recentDuplicate.packageLabel,
          packageCount: recentDuplicate.packageCount,
          amount: recentDuplicate.amount,
          currency: recentDuplicate.currency,
          paymentStatus: recentDuplicate.paymentStatus,
          studentName: recentDuplicate.studentName,
          studentEmail: recentDuplicate.studentEmail,
          studentPhone: recentDuplicate.studentPhone,
        },
      });
    }

    // 8. Generate unique registration ID
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const timestampPart = Date.now().toString(36).toUpperCase();
    const registrationId = `CP-REG-${timestampPart}-${randomHex}`;

    // 9. Save registration record in MongoDB
    const newRecord = await Registration.create({
      registrationId,
      packageId: chosenPackage.id,
      packageCount: chosenPackage.count,
      packageLabel: chosenPackage.label,
      amount: chosenPackage.price, // Server-calculated amount. Never trust frontend amount!
      currency: 'INR',
      studentName: name.trim(),
      studentPhone: sanitizedPhone,
      studentEmail: sanitizedEmail,
      courseDetails: courseDetails.trim(),
      courseraId: typeof courseraId === 'string' ? courseraId.trim() : '',
      courseraPassword: typeof courseraPassword === 'string' ? courseraPassword : '',
      consent: true,
      paymentStatus: 'PENDING',
      auditTrail: [
        {
          status: 'PENDING',
          changedBy: 'SYSTEM_REGISTRATION',
          changedAt: new Date(),
          reason: 'Initial registration created',
        },
      ],
    });

    res.status(201).json({
      success: true,
      registrationId: newRecord.registrationId,
      orderSummary: {
        registrationId: newRecord.registrationId,
        packageId: newRecord.packageId,
        packageLabel: newRecord.packageLabel,
        packageCount: newRecord.packageCount,
        amount: newRecord.amount,
        currency: newRecord.currency,
        paymentStatus: newRecord.paymentStatus,
        studentName: newRecord.studentName,
        studentEmail: newRecord.studentEmail,
        studentPhone: newRecord.studentPhone,
      },
    });
  } catch (error) {
    console.error('Registration creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process registration at this time. Please try again.',
    });
  }
});

// GET /api/registrations/:id/status
router.get('/:id/status', async (req, res) => {
  try {
    const regId = req.params.id;
    if (!regId || typeof regId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid registration ID.' });
    }

    const reg = await Registration.findOne({ registrationId: regId.trim() });
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    // Return only minimum needed public fields. Never expose passwords or personal data!
    res.json({
      success: true,
      registrationId: reg.registrationId,
      paymentStatus: reg.paymentStatus,
      amount: reg.amount,
      currency: reg.currency,
      packageLabel: reg.packageLabel,
      packageCount: reg.packageCount,
      upiReference: reg.upiReference,
      referenceSubmittedAt: reg.referenceSubmittedAt,
      verifiedAt: reg.verifiedAt,
      rejectionReason: reg.rejectionReason,
      updatedAt: reg.updatedAt,
    });
  } catch (error) {
    console.error('Registration status lookup error:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch registration status.' });
  }
});

export default router;
