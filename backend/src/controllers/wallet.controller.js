import AppError from '../utils/AppError.js';
import { createTopupOrder, verifyTopupPayment } from '../services/razorpay.service.js';

export async function createTopupOrderController(req, res) {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount)) throw new AppError(400, 'INVALID_AMOUNT', 'Enter a valid top-up amount');
  const order = await createTopupOrder(req.user._id, amount);
  res.status(201).json({ success: true, data: order });
}

export async function verifyTopupController(req, res) {
  const data = await verifyTopupPayment(req.user._id, req.body);
  res.json({ success: true, data });
}
