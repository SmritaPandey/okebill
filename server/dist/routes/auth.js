"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
// ─── Validation helpers ──────────────────────────────────
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]$/; // e.g. MUMH12345E
const CIN_REGEX = /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/; // e.g. U74110MH2017PTC123456
const LLPIN_REGEX = /^[A-Z]{3}-[0-9]{4}$/; // e.g. AAA-1234
const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/; // e.g. UDYAM-MH-02-1234567
const FSSAI_REGEX = /^\d{14}$/; // 14-digit number
const IEC_REGEX = /^[A-Z0-9]{10}$/; // 10-char alphanumeric (same as PAN)
function cleanPhone(phone) {
    return phone.replace(/[\s\-+]/g, '').replace(/^91/, '');
}
/**
 * Generate the next sequential user code.
 * Format: OKB-00001, OKB-00002, etc.
 */
async function generateUserCode() {
    const prefix = 'OKB-';
    const lastUser = await prisma_1.default.user.findFirst({
        where: { userCode: { startsWith: prefix } },
        orderBy: { userCode: 'desc' },
        select: { userCode: true },
    });
    let nextNum = 1;
    if (lastUser?.userCode) {
        const numPart = lastUser.userCode.replace(prefix, '');
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed))
            nextNum = parsed + 1;
    }
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
}
// POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, companyName, phone, panNumber } = req.body;
        // Validate email
        if (!email || !password || !firstName || !lastName || !companyName) {
            res.status(400).json({ message: 'All fields are required: email, password, firstName, lastName, companyName' });
            return;
        }
        // Validate phone if provided
        if (phone) {
            const cleaned = cleanPhone(phone);
            if (!INDIAN_PHONE_REGEX.test(cleaned)) {
                res.status(400).json({ message: 'Invalid phone number. Must be 10 digits starting with 6-9.' });
                return;
            }
        }
        // Validate PAN if provided
        if (panNumber) {
            const pan = panNumber.toUpperCase().trim();
            if (!PAN_REGEX.test(pan)) {
                res.status(400).json({ message: 'Invalid PAN format. Must be like ABCDE1234F.' });
                return;
            }
        }
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const userCode = await generateUserCode();
        const user = await prisma_1.default.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                companyName,
                userCode,
                phone: phone ? cleanPhone(phone) : undefined,
                panNumber: panNumber ? panNumber.toUpperCase().trim() : undefined,
            },
        });
        // Auto-create 14-day free trial subscription
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        await prisma_1.default.subscription.create({
            data: {
                userId: user.id,
                plan: 'free_trial',
                status: 'active',
                trialEndsAt: trialEnd,
                endDate: trialEnd,
                amount: 0,
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, companyName: user.companyName }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id, userCode: user.userCode, email: user.email, firstName: user.firstName, lastName: user.lastName,
                companyName: user.companyName, role: user.role, phone: user.phone,
                onboardingComplete: user.onboardingComplete,
                subscription: { plan: 'free_trial', status: 'active', trialEndsAt: trialEnd },
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        // Get subscription
        const subscription = await prisma_1.default.subscription.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, companyName: user.companyName }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id, userCode: user.userCode, email: user.email, firstName: user.firstName, lastName: user.lastName,
                companyName: user.companyName, role: user.role, phone: user.phone, phoneVerified: user.phoneVerified,
                panNumber: user.panNumber, gstin: user.gstin, onboardingComplete: user.onboardingComplete,
                subscription: subscription ? { plan: subscription.plan, status: subscription.status, trialEndsAt: subscription.trialEndsAt, endDate: subscription.endDate } : null,
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /auth/me
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const subscription = await prisma_1.default.subscription.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            user: {
                id: user.id, userCode: user.userCode, email: user.email, firstName: user.firstName, lastName: user.lastName,
                companyName: user.companyName, role: user.role,
                phone: user.phone, phoneVerified: user.phoneVerified, emailVerified: user.emailVerified,
                panNumber: user.panNumber, gstin: user.gstin, onboardingComplete: user.onboardingComplete,
                bankAccountNo: user.bankAccountNo, bankIfsc: user.bankIfsc, bankName: user.bankName, bankBranch: user.bankBranch,
                subscription: subscription ? { plan: subscription.plan, status: subscription.status, trialEndsAt: subscription.trialEndsAt, endDate: subscription.endDate } : null,
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /auth/logout
router.post('/logout', auth_1.authMiddleware, (_req, res) => {
    res.json({ success: true });
});
// ─── POST /auth/oauth ────────────────────────────────────
// Social login: verify Google/Microsoft ID token, find or create user, return JWT
router.post('/oauth', async (req, res) => {
    try {
        const { provider, idToken, accessToken } = req.body;
        if (!provider || (!idToken && !accessToken)) {
            res.status(400).json({ message: 'provider and idToken/accessToken are required' });
            return;
        }
        let email = '', firstName = '', lastName = '', avatar = '';
        if (provider === 'google') {
            // Verify Google ID token
            const { OAuth2Client } = await Promise.resolve().then(() => __importStar(require('google-auth-library')));
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                res.status(401).json({ message: 'Invalid Google token' });
                return;
            }
            email = payload.email;
            firstName = payload.given_name || '';
            lastName = payload.family_name || '';
            avatar = payload.picture || '';
        }
        else if (provider === 'microsoft') {
            // For Microsoft, use the access token to fetch user profile
            const msResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!msResponse.ok) {
                res.status(401).json({ message: 'Invalid Microsoft token' });
                return;
            }
            const msUser = await msResponse.json();
            email = msUser.mail || msUser.userPrincipalName || '';
            firstName = msUser.givenName || '';
            lastName = msUser.surname || '';
            if (!email) {
                res.status(401).json({ message: 'Could not retrieve email from Microsoft account' });
                return;
            }
        }
        else {
            res.status(400).json({ message: 'Unsupported provider. Use "google" or "microsoft".' });
            return;
        }
        // Find or create user
        let user = await prisma_1.default.user.findUnique({ where: { email } });
        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            // Create user with a random password hash (they'll use OAuth only)
            const randomPass = await bcryptjs_1.default.hash(Math.random().toString(36) + Date.now(), 10);
            const userCode = await generateUserCode();
            user = await prisma_1.default.user.create({
                data: {
                    email,
                    passwordHash: randomPass,
                    firstName: firstName || email.split('@')[0],
                    lastName: lastName || '',
                    companyName: '',
                    userCode,
                    onboardingComplete: false,
                },
            });
            // Auto-create 14-day free trial subscription
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 14);
            await prisma_1.default.subscription.create({
                data: {
                    userId: user.id,
                    plan: 'free_trial',
                    status: 'active',
                    trialEndsAt: trialEnd,
                    endDate: trialEnd,
                    amount: 0,
                },
            });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, companyName: user.companyName }, JWT_SECRET, { expiresIn: '24h' });
        // Get subscription
        const subscription = await prisma_1.default.subscription.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            token,
            isNewUser,
            user: {
                id: user.id, userCode: user.userCode, email: user.email, firstName: user.firstName, lastName: user.lastName,
                companyName: user.companyName, role: user.role, phone: user.phone,
                onboardingComplete: user.onboardingComplete,
                subscription: subscription ? { plan: subscription.plan, status: subscription.status, trialEndsAt: subscription.trialEndsAt, endDate: subscription.endDate } : null,
            },
        });
    }
    catch (err) {
        console.error('OAuth error:', err);
        res.status(401).json({ message: err.message || 'OAuth authentication failed' });
    }
});
// ─── POST /auth/refresh ──────────────────────────────────
// Silent token refresh — accepts a still-valid or recently-expired JWT (within 7-day window)
router.post('/refresh', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const subscription = await prisma_1.default.subscription.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, companyName: user.companyName }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id, userCode: user.userCode, email: user.email, firstName: user.firstName, lastName: user.lastName,
                companyName: user.companyName, role: user.role, phone: user.phone,
                onboardingComplete: user.onboardingComplete,
                subscription: subscription ? { plan: subscription.plan, status: subscription.status, trialEndsAt: subscription.trialEndsAt, endDate: subscription.endDate } : null,
            },
        });
    }
    catch (err) {
        res.status(401).json({ message: 'Token refresh failed' });
    }
});
// ─── POST /auth/change-password ──────────────────────────
router.post('/change-password', auth_1.authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'Current password and new password are required' });
            return;
        }
        if (newPassword.length < 8) {
            res.status(400).json({ message: 'New password must be at least 8 characters' });
            return;
        }
        if (currentPassword === newPassword) {
            res.status(400).json({ message: 'New password must be different from current password' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const valid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!valid) {
            res.status(401).json({ message: 'Current password is incorrect' });
            return;
        }
        const newHash = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.default.user.update({
            where: { id: req.userId },
            data: { passwordHash: newHash },
        });
        // Issue a new token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, companyName: user.companyName }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, message: 'Password changed successfully', token });
    }
    catch (err) {
        res.status(500).json({ message: err.message || 'Failed to change password' });
    }
});
// ─── GET /auth/export-data ───────────────────────────────
// DPDP Act 2023 / GDPR — data portability: export all user data as JSON
router.get('/export-data', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.userId },
            include: {
                clients: true,
                proposals: true,
                contracts: true,
                invoices: true,
                payments: true,
                notifications: true,
                settings: true,
                files: true,
                subscriptions: true,
            },
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Remove sensitive fields
        const { passwordHash, ...safeUser } = user;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="okbill-data-export-${Date.now()}.json"`);
        res.json({
            exportedAt: new Date().toISOString(),
            platform: 'OkeBill',
            dataProtection: 'DPDP Act 2023 / GDPR Data Portability',
            user: safeUser,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message || 'Failed to export data' });
    }
});
// ─── POST /auth/forgot-password ──────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            // Return 200 for security, but indicate request went through
            res.json({ message: 'If the email exists in our system, a reset OTP has been sent.' });
            return;
        }
        // Generate a 6-digit OTP code
        const otpCode = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        // Store OTP in OtpVerification table
        await prisma_1.default.otpVerification.create({
            data: {
                userId: user.id,
                target: user.email,
                targetType: 'password_reset',
                otpCode,
                expiresAt,
            },
        });
        console.log(`[Password Reset] OTP for ${user.email} is ${otpCode}`);
        try {
            await (0, email_1.sendPasswordResetEmail)(user.email, otpCode, user.firstName || 'User');
            res.json({ message: 'If the email exists in our system, a reset OTP has been sent.' });
        }
        catch (mailErr) {
            console.error('Failed to send password reset email:', mailErr.message);
            // If email fails (e.g. SMTP config missing), return a warning in response
            // so local debugging or log checking can still proceed.
            res.json({
                message: 'Password reset request initiated.',
                warning: 'Email delivery failed. Please check server logs for the OTP or configure SMTP variables.'
            });
        }
    }
    catch (err) {
        res.status(500).json({ message: err.message || 'Failed to initiate password reset' });
    }
});
// ─── POST /auth/reset-password ────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            res.status(400).json({ message: 'Email, OTP, and newPassword are required' });
            return;
        }
        if (newPassword.length < 8) {
            res.status(400).json({ message: 'Password must be at least 8 characters long' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            res.status(400).json({ message: 'Invalid request' });
            return;
        }
        // Find latest valid OTP
        const verification = await prisma_1.default.otpVerification.findFirst({
            where: {
                userId: user.id,
                target: user.email,
                targetType: 'password_reset',
                otpCode: otp,
                expiresAt: { gte: new Date() },
                verified: false,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!verification) {
            res.status(400).json({ message: 'Invalid or expired OTP' });
            return;
        }
        // Mark OTP as verified
        await prisma_1.default.otpVerification.update({
            where: { id: verification.id },
            data: { verified: true },
        });
        // Hash new password
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        // Update user password
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });
        res.json({ success: true, message: 'Password has been reset successfully.' });
    }
    catch (err) {
        res.status(500).json({ message: err.message || 'Failed to reset password' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map