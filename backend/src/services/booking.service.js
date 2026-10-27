import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Item from '../models/Item.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { moveDeposit, creditWallet, consumeHeld } from './wallet.service.js';
import { notify } from './notify.service.js';
const ACTIVE = ['approved','picked_up','overdue'];
const overlaps = (s, e) => ({ startDate: { $lt: e }, endDate: { $gt: s }, status: { $in: ACTIVE } });
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');
const code = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
export async function requestBooking(borrowerId, data) {
  const session = await mongoose.startSession(); let booking;
  try { await session.withTransaction(async () => {
    const item = await Item.findById(data.itemId).session(session);
    const borrower = await User.findById(borrowerId).session(session);
    if (!item || !item.isActive) throw new AppError(404, 'ITEM_UNAVAILABLE', 'Item is unavailable');
    if (String(item.owner) === String(borrowerId)) throw new AppError(400, 'OWN_ITEM', 'You cannot borrow your own item');
    if (borrower.trust.score < item.minTrust) throw new AppError(403, 'TRUST_TOO_LOW', 'Your trust score is below this item’s minimum');
    const start = new Date(data.startDate), end = new Date(data.endDate), days = (end - start) / 86400000;
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end || days > item.maxLoanDays || start < new Date(new Date().setHours(0,0,0,0))) throw new AppError(400, 'INVALID_DATES', 'Dates must be valid, in the future, and within the item loan limit');
    await Item.updateOne({ _id: item._id }, { $inc: { bookingSeq: 1 } }, { session });
    if (await Booking.exists({ item: item._id, ...overlaps(start, end) }).session(session)) throw new AppError(409, 'BOOKING_CONFLICT', 'Item is booked for these dates');
    const activeLoans = await Booking.countDocuments({ borrower: borrowerId, status: { $in: ['approved','picked_up','overdue'] } }).session(session);
    if (activeLoans >= 3) throw new AppError(400, 'ACTIVE_LOAN_LIMIT', 'You already have three active loans');
    if (await Booking.exists({ item: item._id, borrower: borrowerId, startDate: start, endDate: end, status: 'requested' }).session(session)) throw new AppError(409, 'DUPLICATE_REQUEST', 'A request already exists for these dates');
    [booking] = await Booking.create([{ item: item._id, owner: item.owner, borrower: borrowerId, startDate: start, endDate: end, depositHeld: item.depositAmount, message: data.message || '', statusHistory: [{ status: 'requested', by: borrowerId }] }], { session });
    await moveDeposit(borrowerId, item.depositAmount, 'deposit_hold', booking._id, session);
    await notify(item.owner, 'booking_requested', 'A borrower requested your item.', booking._id, session);
  }); return booking; } finally { await session.endSession(); }
}
export async function transition(id, actor, action, input = {}) {
  const session = await mongoose.startSession(); let result;
  try { await session.withTransaction(async () => {
    const b = await Booking.findById(id).session(session); if (!b) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    const borrower = String(b.borrower) === String(actor._id), owner = String(b.owner) === String(actor._id);
    if (!borrower && !owner && actor.role !== 'admin') throw new AppError(403, 'FORBIDDEN', 'You are not part of this booking');
    const setStatus = (status, note) => { b.status = status; b.statusHistory.push({ status, by: actor._id, note }); };
    if (action === 'approve') {
      if (!owner || b.status !== 'requested') throw new AppError(400, 'INVALID_TRANSITION', 'Only the owner can approve a pending request');
      await Item.updateOne({ _id: b.item }, { $inc: { bookingSeq: 1 } }, { session });
      if (await Booking.exists({ _id: { $ne: b._id }, item: b.item, ...overlaps(b.startDate, b.endDate) }).session(session)) throw new AppError(409, 'BOOKING_CONFLICT', 'Item is booked for these dates');
      const pending = await Booking.find({ _id: { $ne: b._id }, item: b.item, borrower: { $ne: b.borrower }, status: 'requested', startDate: { $lt: b.endDate }, endDate: { $gt: b.startDate } }).session(session);
      for (const other of pending) { await moveDeposit(other.borrower, other.depositHeld, 'deposit_release', other._id, session); other.depositHeld = 0; other.status = 'rejected'; other.statusHistory.push({ status: 'rejected', by: actor._id, note: 'Another request for overlapping dates was approved' }); await other.save({ session }); await notify(other.borrower, 'booking_rejected', 'Another overlapping request was approved.', other._id, session); }
      const pc = code(), rc = code(); b.pickupCodeHash = hashCode(pc); b.returnCodeHash = hashCode(rc); setStatus('approved'); result = { pickupCode: borrower ? pc : undefined, returnCode: owner ? rc : undefined };
      await notify(b.borrower, 'booking_approved', `Booking approved. Pickup code: ${pc}`, b._id, session);
    } else if (action === 'pickup' || action === 'return') {
      const pickup = action === 'pickup';
      if ((pickup && (!owner || b.status !== 'approved')) || (!pickup && (!borrower || !['picked_up','overdue'].includes(b.status)))) throw new AppError(400, 'INVALID_TRANSITION', 'This action is not allowed in the current booking state');
      const expected = pickup ? b.pickupCodeHash : b.returnCodeHash;
      if (b.codeAttempts >= 5) throw new AppError(429, 'CODE_LOCKED', 'Code entry is locked');
      if (hashCode(String(input.code || '')) !== expected) { b.codeAttempts += 1; await b.save({ session }); result = { invalidCode: true }; return; }
      b.codeAttempts = 0;
      if (pickup) { b.pickedUpAt = new Date(); setStatus('picked_up'); }
      else { b.returnedAt = new Date(); b.disputeWindowEndsAt = new Date(Date.now() + Number(process.env.DISPUTE_WINDOW_HOURS || 24) * 3600000); setStatus('returned'); }
    } else if (action === 'cancel' || action === 'reject') {
      if (action === 'cancel' && (!borrower || !['requested','approved'].includes(b.status))) throw new AppError(400, 'INVALID_TRANSITION', 'Only the borrower can cancel a pending or approved booking');
      if (action === 'reject' && (!owner || b.status !== 'requested')) throw new AppError(400, 'INVALID_TRANSITION', 'Only the owner can reject a pending request');
      setStatus(action === 'cancel' ? 'cancelled' : 'rejected'); await moveDeposit(b.borrower, b.depositHeld, 'deposit_release', b._id, session); b.depositHeld = 0;
    } else if (action === 'dispute') {
      if (!owner || b.status !== 'returned' || b.disputeWindowEndsAt < new Date()) throw new AppError(400, 'INVALID_TRANSITION', 'A dispute can only be raised by the owner during the dispute window');
      b.dispute = { raisedBy: actor._id, reason: input.reason, evidence: input.evidence || [], status: 'open' }; setStatus('disputed');
    } else if (action === 'resolve') {
      if (actor.role !== 'admin' || b.status !== 'disputed' || !['owner_favour','borrower_favour','split'].includes(input.outcome)) throw new AppError(400, 'INVALID_TRANSITION', 'Invalid dispute resolution');
      const ownerAmount = input.outcome === 'owner_favour' ? b.depositHeld : input.outcome === 'split' ? Math.floor(b.depositHeld / 2) : 0;
      const borrowerAmount = b.depositHeld - ownerAmount;
      if (ownerAmount) await consumeHeld(b.borrower, ownerAmount, b._id, session);
      if (borrowerAmount) await moveDeposit(b.borrower, borrowerAmount, 'deposit_release', b._id, session);
      if (ownerAmount) await creditWallet(b.owner, ownerAmount, 'damage_payout', b._id, session);
      b.depositHeld = 0; b.dispute.status = 'resolved'; b.dispute.outcome = input.outcome; b.dispute.resolvedBy = actor._id; b.dispute.resolvedAt = new Date(); b.closedAt = new Date(); setStatus('closed');
      if (ownerAmount) { const u = await User.findById(b.borrower).session(session); u.trust.score = Math.max(0, u.trust.score - (input.outcome === 'owner_favour' ? 10 : 4)); if (input.outcome === 'owner_favour') u.trust.disputesLost += 1; await u.save({ session }); const { default: TrustEvent } = await import('../models/TrustEvent.js'); await TrustEvent.create([{ user: u._id, booking: b._id, type: 'dispute_lost', delta: input.outcome === 'owner_favour' ? -10 : -4, scoreAfter: u.trust.score, reason: `Dispute resolved: ${input.outcome}` }], { session }); }
    } else throw new AppError(400, 'INVALID_ACTION', 'Unknown booking action');
    await b.save({ session }); result = result || b;
  }); if (result?.invalidCode) throw new AppError(400, 'INVALID_CODE', 'Handover code is incorrect'); return result; } finally { await session.endSession(); }
}
