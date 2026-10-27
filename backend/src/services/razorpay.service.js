import crypto from 'node:crypto';
import mongoose from 'mongoose';
import PaymentOrder from '../models/PaymentOrder.js';
import User from '../models/User.js';
import LedgerEntry from '../models/LedgerEntry.js';
import AppError from '../utils/AppError.js';

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new AppError(503, 'PAYMENTS_NOT_CONFIGURED', 'Razorpay keys are missing from the backend environment');
  return { keyId, keySecret };
}

async function razorpayRequest(path, { method = 'GET', body, credentials: auth } = {}) {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Basic ${Buffer.from(`${auth.keyId}:${auth.keySecret}`).toString('base64')}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new AppError(502, 'RAZORPAY_REQUEST_FAILED', 'Razorpay could not process the payment request');
  return payload;
}

export async function createTopupOrder(userId, amountRupees) {
  const amountPaise = Math.round(amountRupees * 100);
  if (!Number.isInteger(amountRupees) || amountRupees < 1 || amountRupees > 10000) {
    throw new AppError(400, 'INVALID_AMOUNT', 'Top-up amount must be a whole number between ₹1 and ₹10,000');
  }
  const auth = credentials();
  const receipt = `ll_${crypto.randomUUID().replaceAll('-', '').slice(0, 32)}`;
  const order = await razorpayRequest('/orders', {
    method: 'POST', credentials: auth,
    body: { amount: amountPaise, currency: 'INR', receipt, notes: { userId: String(userId), purpose: 'wallet_topup' } }
  });
  await PaymentOrder.create({ user: userId, amountRupees, amountPaise, currency: 'INR', razorpayOrderId: order.id });
  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: auth.keyId, name: 'LendLoop', description: 'Wallet top-up' };
}

function signatureMatches(orderId, paymentId, signature, secret) {
  if (!/^[a-f\d]{64}$/i.test(signature || '')) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

export async function verifyTopupPayment(userId, { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature }) {
  const auth = credentials();
  const order = await PaymentOrder.findOne({ user: userId, razorpayOrderId: orderId });
  if (!order) throw new AppError(404, 'PAYMENT_ORDER_NOT_FOUND', 'Payment order was not found for this account');
  if (!signatureMatches(order.razorpayOrderId, paymentId, signature, auth.keySecret)) {
    throw new AppError(400, 'PAYMENT_SIGNATURE_INVALID', 'Razorpay payment signature could not be verified');
  }
  if (order.status === 'paid') return { wallet: (await User.findById(userId).select('wallet')).wallet, amount: order.amountRupees, alreadyCredited: true };

  let payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`, { credentials: auth });
  if (payment.order_id !== order.razorpayOrderId || payment.amount !== order.amountPaise || payment.currency !== 'INR') {
    throw new AppError(400, 'PAYMENT_DETAILS_MISMATCH', 'Payment details do not match the wallet order');
  }
  if (payment.status === 'authorized') {
    payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/capture`, {
      method: 'POST', credentials: auth,
      body: { amount: order.amountPaise, currency: 'INR' }
    });
  }
  if (payment.status !== 'captured') throw new AppError(402, 'PAYMENT_NOT_CAPTURED', 'Razorpay has not captured this payment');

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const freshOrder = await PaymentOrder.findById(order._id).session(session);
      if (freshOrder.status === 'paid') {
        const existingUser = await User.findById(userId).select('wallet').session(session);
        result = { wallet: existingUser.wallet, amount: freshOrder.amountRupees, alreadyCredited: true };
        return;
      }
      const user = await User.findById(userId).session(session);
      if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      user.wallet.available += freshOrder.amountRupees;
      await user.save({ session });
      await LedgerEntry.create([{ user: userId, type: 'topup', amount: freshOrder.amountRupees, balanceAfter: user.wallet.toObject() }], { session });
      freshOrder.status = 'paid';
      freshOrder.razorpayPaymentId = paymentId;
      await freshOrder.save({ session });
      result = { wallet: user.wallet, amount: freshOrder.amountRupees, alreadyCredited: false };
    });
  } finally { await session.endSession(); }
  return result;
}
