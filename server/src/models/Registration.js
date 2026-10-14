import mongoose from 'mongoose';

const auditEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  reason: { type: String, default: null },
  upiReference: { type: String, default: null },
}, { _id: false });

const registrationSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  packageId: { type: String, required: true },
  packageCount: { type: Number, required: true },
  packageLabel: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  studentName: { type: String, required: true, trim: true },
  studentPhone: { type: String, required: true, trim: true },
  studentEmail: { type: String, required: true, lowercase: true, trim: true },
  courseDetails: { type: String, required: true, trim: true },
  courseraId: { type: String, default: '', trim: true },
  courseraPassword: { type: String, default: '' },
  consent: { type: Boolean, required: true },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'PAID', 'REJECTED'],
    default: 'PENDING',
    index: true,
  },
  upiReference: { type: String, default: null, trim: true, index: true },
  referenceSubmittedAt: { type: Date, default: null },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: String, default: null },
  rejectionReason: { type: String, default: null },
  adminNotes: { type: String, default: null },
  auditTrail: [auditEntrySchema],
}, { timestamps: true });

export default mongoose.model('Registration', registrationSchema);
