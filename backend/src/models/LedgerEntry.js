import mongoose from 'mongoose';
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, type: { type: String, enum: ['topup','deposit_hold','deposit_release','late_fee_paid','late_fee_received','damage_deduction','damage_payout'], required: true }, amount: { type: Number, required: true }, balanceAfter: { available: Number, held: Number } }, { timestamps: { createdAt: true, updatedAt: false } });
export default mongoose.model('LedgerEntry', schema);
