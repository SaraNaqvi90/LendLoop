import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken'; import crypto from 'node:crypto';
import User from '../models/User.js'; import RefreshToken from '../models/RefreshToken.js'; import AppError from '../utils/AppError.js';
const access = (u) => jwt.sign({ sub: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
const cookie = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/v1/auth' };
const digest = (v) => crypto.createHash('sha256').update(v).digest('hex');
export async function register(req, res) {
  const { name, email, password, hostel, room } = req.body;
  if (!name || !email || !password || password.length < 8) throw new AppError(400, 'VALIDATION_ERROR', 'Name, email, and password (8+ characters) are required');
  const domain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (domain && email.toLowerCase().split('@')[1] !== domain.toLowerCase()) throw new AppError(400, 'EMAIL_DOMAIN_NOT_ALLOWED', 'Use an approved college email address');
  if (await User.exists({ email: email.toLowerCase() })) throw new AppError(409, 'EMAIL_IN_USE', 'An account with this email already exists');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), hostel, room });
  const raw = crypto.randomBytes(48).toString('hex');
  await RefreshToken.create({ user: user._id, tokenHash: digest(raw), expiresAt: new Date(Date.now() + 7 * 86400000), userAgent: req.get('user-agent') });
  res.cookie('refreshToken', raw, { ...cookie, maxAge: 7 * 86400000 });
  res.status(201).json({ success: true, data: { user: { id: user.id, name, email, wallet: user.wallet }, accessToken: access(user) } });
}
export async function login(req, res) {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  if (user.isBanned) throw new AppError(403, 'ACCOUNT_BANNED', 'This account is suspended');
  const raw = crypto.randomBytes(48).toString('hex');
  await RefreshToken.create({ user: user._id, tokenHash: digest(raw), expiresAt: new Date(Date.now() + 7 * 86400000), userAgent: req.get('user-agent') });
  res.cookie('refreshToken', raw, { ...cookie, maxAge: 7 * 86400000 });
  res.json({ success: true, data: { user: { id: user.id, name: user.name, email: user.email, role: user.role, wallet: user.wallet, trust: user.trust }, accessToken: access(user) } });
}
export async function refresh(req, res) {
  const raw = req.cookies.refreshToken; if (!raw) throw new AppError(401, 'REFRESH_REQUIRED', 'Refresh cookie required');
  const record = await RefreshToken.findOne({ tokenHash: digest(raw), expiresAt: { $gt: new Date() } });
  if (!record) throw new AppError(401, 'INVALID_REFRESH', 'Refresh token is invalid');
  if (record.revokedAt) { await RefreshToken.updateMany({ user: record.user }, { revokedAt: new Date() }); throw new AppError(401, 'REFRESH_REUSE', 'Refresh token reuse detected; sign in again'); }
  record.revokedAt = new Date(); const next = crypto.randomBytes(48).toString('hex'); record.replacedBy = digest(next); await record.save();
  await RefreshToken.create({ user: record.user, tokenHash: digest(next), expiresAt: new Date(Date.now() + 7 * 86400000), userAgent: req.get('user-agent') });
  const user = await User.findById(record.user);
  if (!user || user.isBanned) throw new AppError(401, 'UNAUTHORIZED', 'Account is unavailable');
  res.cookie('refreshToken', next, { ...cookie, maxAge: 7 * 86400000 }); res.json({ success: true, data: { accessToken: access(user) } });
}
export async function logout(req, res) {
  if (req.cookies.refreshToken) await RefreshToken.updateOne({ tokenHash: digest(req.cookies.refreshToken), revokedAt: null }, { revokedAt: new Date() });
  res.clearCookie('refreshToken', cookie); res.json({ success: true, data: null });
}
