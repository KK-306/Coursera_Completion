import { Router } from 'express';
import Registration from '../models/Registration.js';
import { generateAdminToken, requireAdminAuth } from '../middleware/authAdmin.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many admin login attempts. Please try again after 15 minutes.',
});

// POST /api/admin/login
router.post('/login', adminLoginLimiter, (req, res) => {
  const { username, password } = req.body ?? {};
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'Admin@CoursePilot2025';

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  if (username.trim() !== expectedUser || password !== expectedPass) {
    return res.status(401).json({ success: false, message: 'Invalid admin username or password.' });
  }

  const token = generateAdminToken({ username: expectedUser, role: 'admin' });
  res.json({
    success: true,
    message: 'Admin authentication successful.',
    token,
    admin: { username: expectedUser, role: 'admin' },
  });
});

// GET /api/admin/me
router.get('/me', requireAdminAuth, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// GET /api/admin/stats
router.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    const [pending, underReview, paid, rejected, total] = await Promise.all([
      Registration.countDocuments({ paymentStatus: 'PENDING' }),
      Registration.countDocuments({ paymentStatus: 'UNDER_REVIEW' }),
      Registration.countDocuments({ paymentStatus: 'PAID' }),
      Registration.countDocuments({ paymentStatus: 'REJECTED' }),
      Registration.countDocuments(),
    ]);

    const revenueResult = await Registration.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    res.json({
      success: true,
      stats: { pending, underReview, paid, rejected, total, totalRevenue },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch admin stats.' });
  }
});

// GET /api/admin/registrations
router.get('/registrations', requireAdminAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && ['PENDING', 'UNDER_REVIEW', 'PAID', 'REJECTED'].includes(status)) {
      filter.paymentStatus = status;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim();
      filter.$or = [
        { registrationId: { $regex: term, $options: 'i' } },
        { studentName: { $regex: term, $options: 'i' } },
        { studentEmail: { $regex: term, $options: 'i' } },
        { studentPhone: { $regex: term, $options: 'i' } },
        { upiReference: { $regex: term, $options: 'i' } },
        { courseDetails: { $regex: term, $options: 'i' } },
      ];
    }

    const registrations = await Registration.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    console.error('Admin fetch registrations error:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch registrations.' });
  }
});

// POST /api/admin/registrations/:id/verify
router.post('/registrations/:id/verify', requireAdminAuth, async (req, res) => {
  try {
    const regId = req.params.id;
    const { action, notes, rejectionReason } = req.body ?? {};

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be either 'APPROVE' or 'REJECT'.",
      });
    }

    const reg = await Registration.findOne({ registrationId: regId.trim() });
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    const newStatus = action === 'APPROVE' ? 'PAID' : 'REJECTED';
    const adminUser = req.admin?.username || 'admin';

    reg.paymentStatus = newStatus;
    reg.verifiedAt = new Date();
    reg.verifiedBy = adminUser;
    reg.adminNotes = notes ? String(notes).trim() : reg.adminNotes;

    if (action === 'REJECT') {
      reg.rejectionReason = rejectionReason
        ? String(rejectionReason).trim()
        : 'UPI payment could not be verified against bank statements.';
    } else {
      reg.rejectionReason = null;
    }

    reg.auditTrail.push({
      status: newStatus,
      changedBy: `ADMIN_${adminUser}`,
      changedAt: new Date(),
      reason: action === 'APPROVE' ? (notes || 'Payment verified in bank account') : reg.rejectionReason,
      upiReference: reg.upiReference,
    });

    await reg.save();

    res.json({
      success: true,
      message: `Registration marked as ${newStatus} by admin ${adminUser}.`,
      registration: {
        registrationId: reg.registrationId,
        paymentStatus: reg.paymentStatus,
        verifiedAt: reg.verifiedAt,
        verifiedBy: reg.verifiedBy,
        rejectionReason: reg.rejectionReason,
        adminNotes: reg.adminNotes,
        auditTrail: reg.auditTrail,
      },
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ success: false, message: 'Unable to complete verification.' });
  }
});

export default router;
