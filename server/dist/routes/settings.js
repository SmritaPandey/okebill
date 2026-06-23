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
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// GET /settings
router.get('/', async (req, res) => {
    try {
        const settings = await prisma_1.default.userSettings.findMany({ where: { userId: req.userId } });
        // Flatten settings into a single object
        const merged = { userId: req.userId };
        for (const s of settings) {
            if (s.category === 'general') {
                const data = s.settings;
                merged.companyName = data.companyName;
                merged.companyEmail = data.companyEmail;
                merged.companyPhone = data.companyPhone;
                merged.companyAddress = data.companyAddress;
                merged.currency = data.currency;
                merged.invoicePrefix = data.invoicePrefix;
                merged.proposalPrefix = data.proposalPrefix;
                merged.paymentTerms = data.paymentTerms;
                merged.taxRate = data.taxRate;
            }
            else if (s.category === 'branding') {
                merged.branding = s.settings;
            }
        }
        res.json(merged);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PUT /settings
router.put('/', async (req, res) => {
    try {
        const { branding, ...general } = req.body;
        // Upsert general settings
        if (Object.keys(general).length > 0) {
            await prisma_1.default.userSettings.upsert({
                where: { userId_category: { userId: req.userId, category: 'general' } },
                update: { settings: general },
                create: { userId: req.userId, category: 'general', settings: general },
            });
        }
        // Upsert branding settings
        if (branding) {
            await prisma_1.default.userSettings.upsert({
                where: { userId_category: { userId: req.userId, category: 'branding' } },
                update: { settings: branding },
                create: { userId: req.userId, category: 'branding', settings: branding },
            });
        }
        // Return merged settings
        const settings = await prisma_1.default.userSettings.findMany({ where: { userId: req.userId } });
        const merged = { userId: req.userId };
        for (const s of settings) {
            if (s.category === 'general')
                Object.assign(merged, s.settings);
            else if (s.category === 'branding')
                merged.branding = s.settings;
        }
        res.json(merged);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /settings/onboarding-complete — mark onboarding as done
router.post('/onboarding-complete', async (req, res) => {
    try {
        await prisma_1.default.user.update({
            where: { id: req.userId },
            data: { onboardingComplete: true },
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// DELETE /settings/account — permanently delete user account and all data
router.delete('/account', async (req, res) => {
    try {
        const { password, confirmEmail } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Determine if this is an OAuth user (no password hash set)
        const isOAuthUser = !user.passwordHash || user.passwordHash === '';
        if (isOAuthUser) {
            // OAuth users: verify by confirming their email address
            if (!confirmEmail || confirmEmail !== user.email) {
                res.status(400).json({ message: 'Please confirm your email address to delete your account' });
                return;
            }
        }
        else {
            // Email/password users: verify password
            if (!password) {
                res.status(400).json({ message: 'Password is required to confirm account deletion' });
                return;
            }
            const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
            const valid = await bcrypt.compare(password, user.passwordHash);
            if (!valid) {
                res.status(401).json({ message: 'Incorrect password' });
                return;
            }
        }
        // Delete everything in a transaction
        // Many models cascade from User, but we handle non-cascading ones explicitly
        await prisma_1.default.$transaction(async (tx) => {
            // Delete records that may not cascade automatically
            await tx.payment.deleteMany({ where: { invoice: { userId: req.userId } } });
            await tx.invoice.deleteMany({ where: { userId: req.userId } });
            await tx.proposal.deleteMany({ where: { userId: req.userId } });
            await tx.contract.deleteMany({ where: { userId: req.userId } });
            await tx.client.deleteMany({ where: { userId: req.userId } });
            await tx.subscription.deleteMany({ where: { userId: req.userId } });
            await tx.paygTransaction.deleteMany({ where: { userId: req.userId } });
            await tx.otpVerification.deleteMany({ where: { userId: req.userId } });
            await tx.userSettings.deleteMany({ where: { userId: req.userId } });
            await tx.notification.deleteMany({ where: { userId: req.userId } });
            await tx.emailLog.deleteMany({ where: { userId: req.userId } });
            await tx.aiChatMessage.deleteMany({ where: { userId: req.userId } });
            await tx.recurringInvoice.deleteMany({ where: { userId: req.userId } });
            await tx.file.deleteMany({ where: { userId: req.userId } });
            // Delete the user record last
            await tx.user.delete({ where: { id: req.userId } });
        });
        res.json({ success: true, message: 'Account permanently deleted' });
    }
    catch (err) {
        console.error('Account deletion error:', err);
        res.status(500).json({ message: 'Failed to delete account. Please try again.' });
    }
});
exports.default = router;
//# sourceMappingURL=settings.js.map