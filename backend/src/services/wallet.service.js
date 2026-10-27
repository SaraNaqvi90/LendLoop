import User from '../models/User.js';
import LedgerEntry from '../models/LedgerEntry.js';
import AppError from '../utils/AppError.js';
export async function moveDeposit(userId, amount, type, bookingId, session) {
  const user = await User.findById(userId).session(session);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  if (type === 'deposit_hold') {
    if (user.wallet.available < amount) throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Wallet balance is too low');
    user.wallet.available -= amount; user.wallet.held += amount;
  } else {
    user.wallet.held = Math.max(0, user.wallet.held - amount);
    user.wallet.available += amount;
  }
  await user.save({ session });
  await LedgerEntry.create([{ user: userId, booking: bookingId, type, amount, balanceAfter: user.wallet.toObject() }], { session });
}
export async function creditWallet(userId, amount, type, bookingId, session) {
  const user = await User.findById(userId).session(session);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  user.wallet.available += amount; await user.save({ session });
  await LedgerEntry.create([{ user: userId, booking: bookingId, type, amount, balanceAfter: user.wallet.toObject() }], { session });
}
export async function consumeHeld(userId, amount, bookingId, session) {
  const user = await User.findById(userId).session(session);
  if (!user || user.wallet.held < amount) throw new AppError(409, 'HELD_BALANCE_MISMATCH', 'Held wallet balance does not match this booking');
  user.wallet.held -= amount; await user.save({ session });
  await LedgerEntry.create([{ user: userId, booking: bookingId, type: 'damage_deduction', amount, balanceAfter: user.wallet.toObject() }], { session });
}
