import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amountRupees: { type: Number, required: true, min: 1 },
  amountPaise: { type: Number, required: true, min: 100 },
  currency: { type: String, default: 'INR', enum: ['INR'] },
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['created', 'paid'], default: 'created', index: true }
}, { timestamps: true });
export default mongoose.model('PaymentOrder', schema);
