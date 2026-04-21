import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /settings
router.get('/', async (req: AuthRequest, res) => {
    try {
        const settings = await prisma.userSettings.findMany({ where: { userId: req.userId } });
        // Flatten settings into a single object
        const merged: any = { userId: req.userId };
        for (const s of settings) {
            if (s.category === 'general') {
                const data = s.settings as any;
                merged.companyName = data.companyName;
                merged.companyEmail = data.companyEmail;
                merged.companyPhone = data.companyPhone;
                merged.companyAddress = data.companyAddress;
                merged.currency = data.currency;
                merged.invoicePrefix = data.invoicePrefix;
                merged.proposalPrefix = data.proposalPrefix;
                merged.paymentTerms = data.paymentTerms;
                merged.taxRate = data.taxRate;
            } else if (s.category === 'branding') {
                merged.branding = s.settings;
            }
        }
        res.json(merged);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// PUT /settings
router.put('/', async (req: AuthRequest, res) => {
    try {
        const { branding, ...general } = req.body;

        // Upsert general settings
        if (Object.keys(general).length > 0) {
            await prisma.userSettings.upsert({
                where: { userId_category: { userId: req.userId!, category: 'general' } },
                update: { settings: general },
                create: { userId: req.userId!, category: 'general', settings: general },
            });
        }

        // Upsert branding settings
        if (branding) {
            await prisma.userSettings.upsert({
                where: { userId_category: { userId: req.userId!, category: 'branding' } },
                update: { settings: branding },
                create: { userId: req.userId!, category: 'branding', settings: branding },
            });
        }

        // Return merged settings
        const settings = await prisma.userSettings.findMany({ where: { userId: req.userId } });
        const merged: any = { userId: req.userId };
        for (const s of settings) {
            if (s.category === 'general') Object.assign(merged, s.settings as any);
            else if (s.category === 'branding') merged.branding = s.settings;
        }
        res.json(merged);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST /settings/onboarding-complete — mark onboarding as done
router.post('/onboarding-complete', async (req: AuthRequest, res) => {
    try {
        await prisma.user.update({
            where: { id: req.userId! },
            data: { onboardingComplete: true },
        });
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// DELETE /settings/account — permanently delete user account and all data
router.delete('/account', async (req: AuthRequest, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            res.status(400).json({ message: 'Password is required to confirm account deletion' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: req.userId! } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Verify password
        const bcrypt = await import('bcryptjs');
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ message: 'Incorrect password' });
            return;
        }

        // Delete everything in a transaction
        // Many models cascade from User, but we handle non-cascading ones explicitly
        await prisma.$transaction(async (tx) => {
            // Delete records that may not cascade automatically
            await tx.payment.deleteMany({ where: { invoice: { userId: req.userId! } } });
            await tx.invoice.deleteMany({ where: { userId: req.userId! } });
            await tx.proposal.deleteMany({ where: { userId: req.userId! } });
            await tx.contract.deleteMany({ where: { userId: req.userId! } });
            await tx.client.deleteMany({ where: { userId: req.userId! } });
            await tx.subscription.deleteMany({ where: { userId: req.userId! } });
            await tx.paygTransaction.deleteMany({ where: { userId: req.userId! } });
            await tx.otpVerification.deleteMany({ where: { userId: req.userId! } });
            await tx.userSettings.deleteMany({ where: { userId: req.userId! } });
            await tx.notification.deleteMany({ where: { userId: req.userId! } });
            await tx.emailLog.deleteMany({ where: { userId: req.userId! } });
            await tx.aiChatMessage.deleteMany({ where: { userId: req.userId! } });
            await tx.recurringInvoice.deleteMany({ where: { userId: req.userId! } });
            await tx.file.deleteMany({ where: { userId: req.userId! } });
            // Delete the user record last
            await tx.user.delete({ where: { id: req.userId! } });
        });

        res.json({ success: true, message: 'Account permanently deleted' });
    } catch (err: any) {
        console.error('Account deletion error:', err);
        res.status(500).json({ message: 'Failed to delete account. Please try again.' });
    }
});

export default router;
