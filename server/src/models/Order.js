import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  packageId: { type: String, required: true },
  packageCount: { type: Number, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true, lowercase: true },
  customerPhone: { type: String, required: true },
  status: { type: String, enum: ['CREATED', 'PAID', 'FAILED', 'PENDING'], default: 'CREATED' },
  cashfreeOrderStatus: { type: String, default: 'ACTIVE' },
  paymentId: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
