import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import proposalRoutes from './routes/proposals';
import contractRoutes from './routes/contracts';
import invoiceRoutes from './routes/invoices';
import paymentRoutes from './routes/payments';
import productRoutes from './routes/products';
import inventoryRoutes from './routes/inventory';
import customerRoutes from './routes/customers';
import supplierRoutes from './routes/suppliers';
import posRoutes from './routes/pos';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';
import notificationRoutes from './routes/notifications';
import tenantRoutes from './routes/tenants';
import documentRoutes from './routes/documents';
import aiRoutes from './routes/ai';
import gstRoutes from './routes/gst';
import hsnRoutes from './routes/hsn';
import subscriptionRoutes from './routes/subscription';
import otpRoutes from './routes/otp';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ─────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['*'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Rate limiting — 200 requests per minute per IP
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(apiLimiter);

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'okebill-api', timestamp: new Date().toISOString() });
});

// ─── Routes ─────────────────────────────────────────────────

// Auth-specific strict rate limiter: 10 login/register attempts per 15 min per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
});
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

app.use('/auth', authRoutes);
app.use('/clients', clientRoutes);
app.use('/proposals', proposalRoutes);
app.use('/contracts', contractRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/payments', paymentRoutes);
app.use('/products', productRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/customers', customerRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/pos', posRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/analytics', dashboardRoutes); // analytics shares dashboard router
app.use('/settings', settingsRoutes);
app.use('/notifications', notificationRoutes);
app.use('/tenants', tenantRoutes);
app.use('/docs', documentRoutes);
app.use('/ai', aiRoutes);
app.use('/gst', gstRoutes);
app.use('/hsn', hsnRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/otp', otpRoutes);

// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// ─── Error Handler ──────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
});

// ─── Start (skip when imported by tests) ────────────────────
if (!process.env.VITEST) {
    app.listen(PORT, () => {
        console.log(`🚀 OkBill API running on http://localhost:${PORT}`);
        console.log(`📋 Health check: http://localhost:${PORT}/health`);
    });
}

export default app;
