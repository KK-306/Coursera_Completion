import { Router } from 'express';
import Registration from '../models/Registration.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const referenceLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many reference submissions from this IP. Please wait a few minutes.',
});

// POST /api/payments/submit-reference
router.post('/submit-reference', referenceLimiter, async (req, res) => {
  try {
    const { registrationId, upiReference } = req.body ?? {};

    // 1. Validate registrationId
    if (!registrationId || typeof registrationId !== 'string' || registrationId.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A valid registration ID is required.',
      });
    }

    // 2. Validate UPI transaction reference
    // UPI UTRs in India are typically 12-digit numbers, but can sometimes be alphanumeric (8-24 chars).
    if (!upiReference || typeof upiReference !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide the 12-digit UPI transaction reference / UTR number.',
      });
    }

    const sanitizedRef = upiReference.trim().toUpperCase();
    if (sanitizedRef.length < 8 || sanitizedRef.length > 24 || !/^[A-Z0-9]+$/.test(sanitizedRef)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UPI reference format. It should be an 8–24 character alphanumeric transaction reference (e.g. 12-digit UTR).',
      });
    }

    // 3. Find registration
    const registration = await Registration.findOne({ registrationId: registrationId.trim() });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration ID not found. Please register first before submitting payment reference.',
      });
    }

    // 4. Check state transitions
    if (registration.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'This registration has already been verified and marked as PAID. No further action needed.',
        status: 'PAID',
      });
    }

    // If already under review with same reference
    if (registration.paymentStatus === 'UNDER_REVIEW' && registration.upiReference === sanitizedRef) {
      return res.status(200).json({
        success: true,
        status: 'UNDER_REVIEW',
        message: 'This UPI reference is already submitted and currently under manual verification against bank records.',
        registrationId: registration.registrationId,
        upiReference: sanitizedRef,
      });
    }

    // 5. Update status to UNDER_REVIEW (NEVER directly to PAID!)
    registration.paymentStatus = 'UNDER_REVIEW';
    registration.upiReference = sanitizedRef;
    registration.referenceSubmittedAt = new Date();
    registration.rejectionReason = null; // Clear previous rejection if resubmitted
    registration.auditTrail.push({
      status: 'UNDER_REVIEW',
      changedBy: 'STUDENT_SUBMISSION',
      changedAt: new Date(),
      reason: 'UPI transaction reference submitted by student',
      upiReference: sanitizedRef,
    });

    await registration.save();

    res.status(200).json({
      success: true,
      status: 'UNDER_REVIEW',
      message: 'UPI reference submitted successfully. Our team will verify it against bank records within 15–30 minutes.',
      registrationId: registration.registrationId,
      upiReference: sanitizedRef,
      updatedAt: registration.updatedAt,
    });
  } catch (error) {
    console.error('Submit reference error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to submit payment reference. Please try again.',
    });
  }
});

export default router;
