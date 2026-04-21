import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// ─── Validation helpers ──────────────────────────────────
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]$/;                              // e.g. MUMH12345E
const CIN_REGEX = /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;      // e.g. U74110MH2017PTC123456
const LLPIN_REGEX = /^[A-Z]{3}-[0-9]{4}$/;                                 // e.g. AAA-1234
const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;                       // e.g. UDYAM-MH-02-1234567
const FSSAI_REGEX = /^\d{14}$/;                                             // 14-digit number
const IEC_REGEX = /^[A-Z0-9]{10}$/;                                         // 10-char alphanumeric (same as PAN)

function cleanPhone(phone: string): string {
    return phone.replace(/[\s\-+]/g, '').replace(/^91/, '');
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

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                companyName,
                phone: phone ? cleanPhone(phone) : undefined,
                panNumber: panNumber ? panNumber.toUpperCase().trim() : undefined,
            },
        });

        // Auto-create 14-day free trial subscription
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        await prisma.subscription.create({
            data: {
                userId: user.id,
                plan: 'free_trial',
                status: 'active',
                trialEndsAt: trialEnd,
                endDate: trialEnd,
                amount: 0,
            },
        });

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, companyName: user.companyName },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
                companyName: user.companyName, role: user.role, phone: user.phone,
                onboardingComplete: user.onboardingComplete,
                subscription: { plan: 'free_trial', status: 'active', trialEndsAt: trialEnd },
            },
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        // Get subscription
        const subscription = await prisma.subscription.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, companyName: user.companyName },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
                companyName: user.companyName, role: user.role, phone: user.phone, phoneVerified: user.phoneVerified,
                panNumber: user.panNumber, gstin: user.gstin, onboardingComplete: user.onboardingComplete,
                subscription: subscription ? { plan: subscription.plan, status: subscription.status, trialEndsAt: subscription.trialEndsAt, endDate: subscription.endDate } : null,
            },
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// GET /auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const subscription = await prisma.subscription.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            user: {
                id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
                companyName: user.companyName, role: user.role,
                phone: user.phone, phoneVerified: user.phoneVerified, emailVerified: user.emailVerified,
                panNumber: user.panNumber, gstin: user.gstin, onboardingComplete: user.onboardingComplete,
                bankAccountNo: user.bankAccountNo, bankIfsc: user.bankIfsc, bankName: user.bankName, bankBranch: user.bankBranch,
                subscription: subscription ? { plan: subscription.plan, status: subscription.status, trialEndsAt: subscription.trialEndsAt, endDate: subscription.endDate } : null,
            },
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /auth/logout
router.post('/logout', authMiddleware, (_req, res) => {
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
            const { OAuth2Client } = await import('google-auth-library');
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
        } else if (provider === 'microsoft') {
            // For Microsoft, use the access token to fetch user profile
            const msResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!msResponse.ok) {
                res.status(401).json({ message: 'Invalid Microsoft token' });
                return;
            }
            const msUser = await msResponse.json() as any;
            email = msUser.mail || msUser.userPrincipalName || '';
            firstName = msUser.givenName || '';
            lastName = msUser.surname || '';
            if (!email) {
                res.status(401).json({ message: 'Could not retrieve email from Microsoft account' });
                return;
            }
        } else {
            res.status(400).json({ message: 'Unsupported provider. Use "google" or "microsoft".' });
            return;
        }

        // Find or create user
        let user = await prisma.user.findUnique({ where: { email } });
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            // Create user with a random password hash (they'll use OAuth only)
            const randomPass = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
            user = await prisma.user.create({
                data: {
                    email,
                    passwordHash: randomPass,
                    firstName: firstName || email.split('@')[0],
                    lastName: lastName || '',
                    companyName: '',
                    onboardingComplete: false,
                },
            });

            // Auto-create 14-day free trial subscription
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 14);
            await prisma.subscription.create({
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
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, companyName: user.companyName },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Get subscription
        const subscription = await prisma.subscription.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            token,
            isNewUser,
            user: {
                id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
                companyName: user.companyName, role: user.role, phone: user.phone,
                onboardingComplete: user.onboardingComplete,
                subscription: subscription ? { plan: subscription.plan, status: subscription.status, trialEndsAt: subscription.trialEndsAt, endDate: subscription.endDate } : null,
            },
        });
    } catch (err: any) {
        console.error('OAuth error:', err);
        res.status(401).json({ message: err.message || 'OAuth authentication failed' });
    }
});

// ─── POST /auth/refresh ──────────────────────────────────
// Silent token refresh — accepts a still-valid or recently-expired JWT (within 7-day window)
router.post('/refresh', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const subscription = await prisma.subscription.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, companyName: user.companyName },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
                companyName: user.companyName, role: user.role, phone: user.phone,
                onboardingComplete: user.onboardingComplete,
                subscription: subscription ? { plan: subscription.plan, status: subscription.status, trialEndsAt: subscription.trialEndsAt, endDate: subscription.endDate } : null,
            },
        });
    } catch (err: any) {
        res.status(401).json({ message: 'Token refresh failed' });
    }
});

// ─── POST /auth/change-password ──────────────────────────
router.post('/change-password', authMiddleware, async (req: AuthRequest, res) => {
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

        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) {
            res.status(401).json({ message: 'Current password is incorrect' });
            return;
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.userId },
            data: { passwordHash: newHash },
        });

        // Issue a new token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, companyName: user.companyName },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ success: true, message: 'Password changed successfully', token });
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Failed to change password' });
    }
});

// ─── GET /auth/export-data ───────────────────────────────
// DPDP Act 2023 / GDPR — data portability: export all user data as JSON
router.get('/export-data', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
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
            platform: 'OkBill',
            dataProtection: 'DPDP Act 2023 / GDPR Data Portability',
            user: safeUser,
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Failed to export data' });
    }
});

export default router;

