import Notification from '../models/Notification.js';
export const notify = (user, type, message, booking, session) => Notification.create([{ user, type, message, booking }], { session });
