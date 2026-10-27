import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new Error('Missing token');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.isBanned) throw new Error('Unavailable account');
    req.user = user;
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'A valid access token is required'));
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  next(new AppError(403, 'FORBIDDEN', 'Admin access required'));
}
