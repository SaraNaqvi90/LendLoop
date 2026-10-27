import mongoose from 'mongoose';
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, type: { type: String, required: true }, message: { type: String, required: true }, booking: mongoose.Schema.Types.ObjectId, isRead: { type: Boolean, default: false } }, { timestamps: { createdAt: true, updatedAt: false } });
export default mongoose.model('Notification', schema);
