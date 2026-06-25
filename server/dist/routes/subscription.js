"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Subscription & Billing Routes ────────────────────────
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const payg_1 = require("../lib/payg");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
// Note: authMiddleware applied per-route, /plans is public
// ─── GET /subscription/plans ─────────────────────────────
// Returns available subscription plans
router.get('/plans', (_req, res) => {
    res.json({ plans: payg_1.SUBSCRIPTION_PLANS });
});
// ─── GET /subscription/status ────────────────────────────
// Get current user's subscription status
router.get('/status', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const subscription = await prisma_1.default.subscription.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        if (!subscription) {
            return res.json({
                hasSubscription: false,
                plan: null,
                status: 'none',
                message: 'No active subscription',
            });
        }
        // Check if trial has expired
        if (subscription.plan === 'free_trial' && subscription.trialEndsAt) {
            const now = new Date();
            if (now > subscription.trialEndsAt && subscription.status === 'active') {
                await prisma_1.default.subscription.update({
                    where: { id: subscription.id },
                    data: { status: 'expired' },
                });
                subscription.status = 'expired';
            }
        }
        const planDetails = payg_1.SUBSCRIPTION_PLANS.find(p => p.id === subscription.plan);
        res.json({
            hasSubscription: true,
            plan: subscription.plan,
            planDetails,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            trialEndsAt: subscription.trialEndsAt,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── POST /subscription/checkout ─────────────────────────
// Create a PayG order for subscription upgrade
router.post('/checkout', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { planId } = req.body;
        // Validate plan
        const plan = payg_1.SUBSCRIPTION_PLANS.find(p => p.id === planId);
        if (!plan) {
            return res.status(400).json({ message: 'Invalid plan selected' });
        }
        if (plan.price === 0) {
            return res.status(400).json({ message: 'Free trial does not require payment' });
        }
        // Get user details
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Generate unique request ID
        const uniqueRequestId = `SUB_${userId}_${Date.now()}_${crypto_1.default.randomBytes(4).toString('hex')}`;
        // Check if PayG credentials are configured
        if (!process.env.PAYG_AUTH_KEY || !process.env.PAYG_MID) {
            // Dev mode: simulate order creation
            const txn = await prisma_1.default.paygTransaction.create({
                data: {
                    userId,
                    orderKeyId: `DEV_${uniqueRequestId}`,
                    uniqueRequestId,
                    orderAmount: plan.price,
                    orderStatus: 'INITIATED',
                    paymentStatus: 0,
                    paymentProcessUrl: `/payment/callback?OrderKeyId=DEV_${uniqueRequestId}&status=success`,
                    purpose: 'subscription',
                    rawResponse: { dev: true, plan: planId },
                },
            });
            return res.json({
                success: true,
                dev: true,
                orderKeyId: txn.orderKeyId,
                paymentProcessUrl: txn.paymentProcessUrl,
                message: 'Dev mode — PayG credentials not configured. Simulating payment.',
            });
        }
        // Create PayG order
        const paygResponse = await (0, payg_1.createPaygOrder)({
            uniqueRequestId,
            orderAmount: plan.price,
            customerFirstName: user.firstName,
            customerLastName: user.lastName,
            customerEmail: user.email,
            customerMobile: user.phone || '9999999999',
            productDescription: `OkeBill ${plan.name} Plan - Monthly Subscription`,
            userDefined1: `plan:${planId},userId:${userId}`,
        });
        // Store transaction
        await prisma_1.default.paygTransaction.create({
            data: {
                userId,
                orderKeyId: paygResponse.OrderKeyId,
                uniqueRequestId,
                orderAmount: plan.price,
                orderStatus: paygResponse.OrderStatus,
                paymentStatus: paygResponse.PaymentStatus,
                paymentProcessUrl: paygResponse.PaymentProcessUrl,
                purpose: 'subscription',
                rawResponse: paygResponse,
            },
        });
        res.json({
            success: true,
            orderKeyId: paygResponse.OrderKeyId,
            paymentProcessUrl: paygResponse.PaymentProcessUrl,
        });
    }
    catch (err) {
        console.error('Subscription checkout error:', err);
        res.status(500).json({ message: err.message });
    }
});
// ─── GET /subscription/callback ──────────────────────────
// Handle PayG redirect after payment (also accepts POST)
router.all('/callback', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const orderKeyId = (req.query.OrderKeyId || req.body?.OrderKeyId);
        if (!orderKeyId) {
            return res.status(400).json({ message: 'Missing OrderKeyId' });
        }
        // Find the stored transaction
        const txn = await prisma_1.default.paygTransaction.findFirst({
            where: { orderKeyId },
        });
        if (!txn) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        // Dev mode handling
        if (orderKeyId.startsWith('DEV_')) {
            // Simulate successful payment
            await prisma_1.default.paygTransaction.update({
                where: { id: txn.id },
                data: {
                    paymentStatus: 1,
                    orderStatus: 'PAID',
                    paymentResponseCode: 1,
                    paymentResponseText: 'Success (Dev Mode)',
                    paymentMethod: 'DEV',
                },
            });
            // Parse plan from rawResponse
            const rawResp = txn.rawResponse;
            const planId = rawResp?.plan || 'starter';
            const plan = payg_1.SUBSCRIPTION_PLANS.find(p => p.id === planId);
            // Activate subscription
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (plan?.duration || 30));
            await prisma_1.default.subscription.create({
                data: {
                    userId: txn.userId,
                    plan: planId,
                    status: 'active',
                    amount: txn.orderAmount,
                    endDate,
                    paygOrderKeyId: orderKeyId,
                    lastPaymentAt: new Date(),
                },
            });
            return res.json({
                success: true,
                message: 'Subscription activated (Dev Mode)',
                plan: planId,
            });
        }
        // Production: Check PayG order status
        const statusResponse = await (0, payg_1.getPaygOrderStatus)(orderKeyId);
        // Update transaction
        await prisma_1.default.paygTransaction.update({
            where: { id: txn.id },
            data: {
                paymentStatus: statusResponse.PaymentStatus,
                orderStatus: statusResponse.OrderStatus,
                paymentResponseCode: statusResponse.PaymentResponseCode,
                paymentResponseText: statusResponse.PaymentResponseText,
                paymentMethod: statusResponse.PaymentMethod,
                paymentTransactionId: statusResponse.PaymentTransactionId,
                rawResponse: statusResponse,
            },
        });
        // Check if payment was successful (PaymentResponseCode 1 = success)
        if (statusResponse.PaymentResponseCode === 1) {
            // Parse plan from UserDefined1
            const ud1 = statusResponse.UserDefinedData?.UserDefined1 || '';
            const planMatch = ud1.match(/plan:(\w+)/);
            const planId = planMatch ? planMatch[1] : 'starter';
            const plan = payg_1.SUBSCRIPTION_PLANS.find(p => p.id === planId);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (plan?.duration || 30));
            await prisma_1.default.subscription.create({
                data: {
                    userId: txn.userId,
                    plan: planId,
                    status: 'active',
                    amount: txn.orderAmount,
                    endDate,
                    paygOrderKeyId: orderKeyId,
                    lastPaymentAt: new Date(),
                },
            });
            return res.json({
                success: true,
                message: 'Payment successful! Subscription activated.',
                plan: planId,
            });
        }
        res.json({
            success: false,
            message: statusResponse.PaymentResponseText || 'Payment was not successful',
            paymentStatus: statusResponse.PaymentStatus,
        });
    }
    catch (err) {
        console.error('Subscription callback error:', err);
        res.status(500).json({ message: err.message });
    }
});
// ─── GET /subscription/history ───────────────────────────
// Get payment history
router.get('/history', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const transactions = await prisma_1.default.paygTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json({ transactions });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── POST /subscription/invoice-payment ──────────────────
// Create a PayG order for collecting payment on an invoice
router.post('/invoice-payment', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { invoiceId } = req.body;
        // Get invoice with client details
        const invoice = await prisma_1.default.invoice.findFirst({
            where: { id: Number(invoiceId), userId },
            include: { client: true },
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const uniqueRequestId = `INV_${invoiceId}_${Date.now()}_${crypto_1.default.randomBytes(4).toString('hex')}`;
        const amount = Number(invoice.total);
        // Check if PayG credentials are configured
        if (!process.env.PAYG_AUTH_KEY || !process.env.PAYG_MID) {
            const txn = await prisma_1.default.paygTransaction.create({
                data: {
                    userId,
                    orderKeyId: `DEV_${uniqueRequestId}`,
                    uniqueRequestId,
                    orderAmount: amount,
                    orderStatus: 'INITIATED',
                    paymentStatus: 0,
                    paymentProcessUrl: `/payment/callback?OrderKeyId=DEV_${uniqueRequestId}&status=success`,
                    purpose: 'invoice_payment',
                    entityId: invoice.id,
                    rawResponse: { dev: true, invoiceId },
                },
            });
            return res.json({
                success: true,
                dev: true,
                orderKeyId: txn.orderKeyId,
                paymentProcessUrl: txn.paymentProcessUrl,
            });
        }
        const paygResponse = await (0, payg_1.createPaygOrder)({
            uniqueRequestId,
            orderAmount: amount,
            customerFirstName: invoice.client.name.split(' ')[0] || invoice.client.name,
            customerLastName: invoice.client.name.split(' ').slice(1).join(' ') || '',
            customerEmail: invoice.client.contactEmail,
            customerMobile: invoice.client.phone || '9999999999',
            productDescription: `Payment for Invoice #${invoice.invoiceNumber}`,
            userDefined1: `invoiceId:${invoiceId}`,
        });
        await prisma_1.default.paygTransaction.create({
            data: {
                userId,
                orderKeyId: paygResponse.OrderKeyId,
                uniqueRequestId,
                orderAmount: amount,
                orderStatus: paygResponse.OrderStatus,
                paymentStatus: paygResponse.PaymentStatus,
                paymentProcessUrl: paygResponse.PaymentProcessUrl,
                purpose: 'invoice_payment',
                entityId: invoice.id,
                rawResponse: paygResponse,
            },
        });
        res.json({
            success: true,
            orderKeyId: paygResponse.OrderKeyId,
            paymentProcessUrl: paygResponse.PaymentProcessUrl,
        });
    }
    catch (err) {
        console.error('Invoice payment error:', err);
        res.status(500).json({ message: err.message });
    }
});
// ─── POST /subscription/downgrade-free ───────────────────
// Downgrade to Free Tier and delete all trial data
router.post('/downgrade-free', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        // 1. Delete all transactional trial data
        await prisma_1.default.$transaction([
            prisma_1.default.payment.deleteMany({ where: { userId } }),
            prisma_1.default.invoice.deleteMany({ where: { userId } }),
            prisma_1.default.client.deleteMany({ where: { userId } }),
            prisma_1.default.proposal.deleteMany({ where: { userId } }),
            prisma_1.default.contract.deleteMany({ where: { userId } }),
            prisma_1.default.expense.deleteMany({ where: { userId } }),
            prisma_1.default.creditNote.deleteMany({ where: { userId } }),
            prisma_1.default.recurringInvoice.deleteMany({ where: { userId } }),
            prisma_1.default.notification.deleteMany({ where: { userId } }),
            prisma_1.default.file.deleteMany({ where: { userId } }),
        ]);
        // 2. Find or create/update subscription to 'free' plan
        const existingSub = await prisma_1.default.subscription.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        if (existingSub) {
            await prisma_1.default.subscription.update({
                where: { id: existingSub.id },
                data: {
                    plan: 'free',
                    status: 'active',
                    endDate: new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000), // 100 years
                    trialEndsAt: null,
                    amount: 0,
                },
            });
        }
        else {
            await prisma_1.default.subscription.create({
                data: {
                    userId,
                    plan: 'free',
                    status: 'active',
                    endDate: new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000),
                    amount: 0,
                },
            });
        }
        res.json({ success: true, message: 'Downgraded to Free Tier. All trial data has been cleared.' });
    }
    catch (err) {
        console.error('Downgrade to free error:', err);
        res.status(500).json({ message: err.message || 'Failed to downgrade to Free Tier' });
    }
});
exports.default = router;
//# sourceMappingURL=subscription.js.map