"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const clients_1 = __importDefault(require("./routes/clients"));
const proposals_1 = __importDefault(require("./routes/proposals"));
const contracts_1 = __importDefault(require("./routes/contracts"));
const invoices_1 = __importDefault(require("./routes/invoices"));
const payments_1 = __importDefault(require("./routes/payments"));
const products_1 = __importDefault(require("./routes/products"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const customers_1 = __importDefault(require("./routes/customers"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
const pos_1 = __importDefault(require("./routes/pos"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const settings_1 = __importDefault(require("./routes/settings"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const tenants_1 = __importDefault(require("./routes/tenants"));
const documents_1 = __importDefault(require("./routes/documents"));
const ai_1 = __importDefault(require("./routes/ai"));
const gst_1 = __importDefault(require("./routes/gst"));
const hsn_1 = __importDefault(require("./routes/hsn"));
const subscription_1 = __importDefault(require("./routes/subscription"));
const otp_1 = __importDefault(require("./routes/otp"));
const admin_1 = __importDefault(require("./routes/admin"));
const delivery_challans_1 = __importDefault(require("./routes/delivery-challans"));
const purchases_1 = __importDefault(require("./routes/purchases"));
const staff_1 = __importDefault(require("./routes/staff"));
const stock_transfers_1 = __importDefault(require("./routes/stock-transfers"));
const barcodes_1 = __importDefault(require("./routes/barcodes"));
const expenses_1 = __importDefault(require("./routes/expenses"));
const credit_notes_1 = __importDefault(require("./routes/credit-notes"));
const recurring_invoices_1 = __importDefault(require("./routes/recurring-invoices"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// ─── Middleware ─────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['*'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Security headers
app.use((0, helmet_1.default)({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
// Rate limiting — 200 requests per minute per IP
const apiLimiter = (0, express_rate_limit_1.default)({
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
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
});
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth', auth_1.default);
app.use('/clients', clients_1.default);
app.use('/proposals', proposals_1.default);
app.use('/contracts', contracts_1.default);
app.use('/invoices', invoices_1.default);
app.use('/payments', payments_1.default);
app.use('/products', products_1.default);
app.use('/inventory', inventory_1.default);
app.use('/customers', customers_1.default);
app.use('/suppliers', suppliers_1.default);
app.use('/pos', pos_1.default);
app.use('/dashboard', dashboard_1.default);
app.use('/analytics', dashboard_1.default); // analytics shares dashboard router
app.use('/settings', settings_1.default);
app.use('/notifications', notifications_1.default);
app.use('/tenants', tenants_1.default);
app.use('/docs', documents_1.default);
app.use('/ai', ai_1.default);
app.use('/gst', gst_1.default);
app.use('/hsn', hsn_1.default);
app.use('/subscription', subscription_1.default);
app.use('/otp', otp_1.default);
app.use('/admin', admin_1.default);
app.use('/delivery-challans', delivery_challans_1.default);
app.use('/purchases', purchases_1.default);
app.use('/staff', staff_1.default);
app.use('/stock-transfers', stock_transfers_1.default);
app.use('/barcodes', barcodes_1.default);
app.use('/expenses', expenses_1.default);
app.use('/credit-notes', credit_notes_1.default);
app.use('/recurring-invoices', recurring_invoices_1.default);
// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});
// ─── Error Handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
});
// ─── Start (skip when imported by tests) ────────────────────
if (!process.env.VITEST) {
    app.listen(PORT, () => {
        console.log(`🚀 OkeBill API running on http://localhost:${PORT}`);
        console.log(`📋 Health check: http://localhost:${PORT}/health`);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map