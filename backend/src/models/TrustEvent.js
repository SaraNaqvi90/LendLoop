import mongoose from 'mongoose';
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, booking: mongoose.Schema.Types.ObjectId, type: { type: String, required: true }, delta: Number, scoreAfter: Number, reason: String }, { timestamps: { createdAt: true, updatedAt: false } });
export default mongoose.model('TrustEvent', schema);
