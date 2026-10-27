import express from 'express'; import cors from 'cors'; import helmet from 'helmet'; import cookieParser from 'cookie-parser'; import morgan from 'morgan'; import rateLimit from 'express-rate-limit'; import routes from './routes/index.js'; import AppError from './utils/AppError.js';
const app = express(); app.use(helmet()); app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true })); app.use(express.json({ limit: '1mb' })); app.use(cookieParser()); app.use(morgan('dev'));
app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 })); app.use('/api/v1', routes);
app.use((req, res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found')));
app.use((err, req, res, next) => { const status = err.status || (err.name === 'ValidationError' ? 400 : 500); const code = err.code && typeof err.code === 'string' ? err.code : err.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR'; if (status >= 500) console.error(err); res.status(status).json({ success: false, error: { code, message: status === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message, details: err.details || [] } }); });
export default app;
