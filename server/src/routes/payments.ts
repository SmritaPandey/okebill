import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { razorpayService } from '../services/razorpay';

const router = Router();
router.use(authMiddleware);

// ─── GET /payments ──────────────────────────────────────────
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { invoiceId, status, limit = '50', offset = '0' } = req.query;
        const where: any = { userId: req.userId };
        if (invoiceId) where.invoiceId = Number(invoiceId);
        if (status) where.status = String(status);
        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                take: Number(limit),
                skip: Number(offset),
                orderBy: { createdAt: 'desc' },
                include: { invoice: { include: { client: true } } },
            }),
            prisma.payment.count({ where }),
        ]);
        res.json({ payments, total });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /payments/:id ──────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const payment = await prisma.payment.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
            include: { invoice: { include: { client: true } } },
        });
        if (!payment) { res.status(404).json({ message: 'Payment not found' }); return; }
        res.json(payment);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /payments ─────────────────────────────────────────
router.post('/', async (req: AuthRequest, res) => {
    try {
        const payment = await prisma.payment.create({
            data: { ...req.body, userId: req.userId! },
        });
        res.status(201).json(payment);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /payments/record ──────────────────────────────────
router.post('/record', async (req: AuthRequest, res) => {
    try {
        const { invoiceId, amount, paymentMethod, paymentDate, notes } = req.body;

        if (!invoiceId || !amount) {
            res.status(400).json({ message: 'invoiceId and amount are required' });
            return;
        }

        // Validate invoice exists and belongs to user
        const invoice = await prisma.invoice.findFirst({
            where: { id: Number(invoiceId), userId: req.userId },
        });
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }

        // Calculate current paid amount
        const existingPayments = await prisma.payment.aggregate({
            where: { invoiceId: Number(invoiceId) },
            _sum: { amount: true },
        });
        const totalPaidBefore = Number(existingPayments._sum.amount || 0);
        const invoiceTotal = Number(invoice.total);

        // Check if overpayment
        if (totalPaidBefore + Number(amount) > invoiceTotal * 1.01) { // 1% tolerance for rounding
            res.status(400).json({
                message: `Payment exceeds balance. Invoice total: ${invoiceTotal}, already paid: ${totalPaidBefore}, remaining: ${invoiceTotal - totalPaidBefore}`,
            });
            return;
        }

        // Generate reference number
        const paymentCount = await prisma.payment.count({ where: { userId: req.userId } });
        const reference = `PAY-${String(paymentCount + 1).padStart(5, '0')}`;

        const payment = await prisma.payment.create({
            data: {
                userId: req.userId!,
                invoiceId: Number(invoiceId),
                amount: Number(amount),
                paymentMethod: paymentMethod || 'bank_transfer',
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                reference,
                notes: notes || null,
                status: 'completed',
            },
            include: { invoice: { include: { client: true } } },
        });

        // Auto-update invoice status
        const totalPaidAfter = totalPaidBefore + Number(amount);
        if (totalPaidAfter >= invoiceTotal) {
            await prisma.invoice.update({
                where: { id: Number(invoiceId) },
                data: { status: 'paid', paidDate: new Date() },
            });
        } else if (totalPaidAfter > 0) {
            // Partially paid — mark as sent (not overdue)
            await prisma.invoice.update({
                where: { id: Number(invoiceId) },
                data: { status: 'sent' }, // keep as sent, since it's partially paid
            });
        }

        res.status(201).json({
            ...payment,
            invoiceTotal,
            totalPaid: totalPaidAfter,
            balanceRemaining: invoiceTotal - totalPaidAfter,
            fullyPaid: totalPaidAfter >= invoiceTotal,
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── DELETE /payments/:id ───────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const payment = await prisma.payment.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!payment) { res.status(404).json({ message: 'Payment not found' }); return; }

        await prisma.payment.delete({ where: { id: Number(req.params.id) } });

        // Recalculate invoice status
        const remainingPayments = await prisma.payment.aggregate({
            where: { invoiceId: payment.invoiceId },
            _sum: { amount: true },
        });
        const invoice = await prisma.invoice.findUnique({ where: { id: payment.invoiceId } });
        if (invoice) {
            const totalPaid = Number(remainingPayments._sum.amount || 0);
            const newStatus = totalPaid >= Number(invoice.total) ? 'paid'
                : totalPaid > 0 ? 'sent'
                    : invoice.dueDate < new Date() ? 'overdue' : 'sent';
            await prisma.invoice.update({
                where: { id: payment.invoiceId },
                data: { status: newStatus, paidDate: newStatus === 'paid' ? new Date() : null },
            });
        }

        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
// RAZORPAY PAYMENT GATEWAY
// ═══════════════════════════════════════════════════════════

// POST /payments/gateway/create-order — Create Razorpay order for invoice
router.post('/gateway/create-order', async (req: AuthRequest, res) => {
    try {
        const { invoiceId } = req.body;
        const invoice = await prisma.invoice.findFirst({
            where: { id: Number(invoiceId), userId: req.userId },
            include: { client: true },
        });
        if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }

        const existingPayments = await prisma.payment.aggregate({
            where: { invoiceId: invoice.id },
            _sum: { amount: true },
        });
        const balance = Number(invoice.total) - Number(existingPayments._sum.amount || 0);
        if (balance <= 0) { res.status(400).json({ message: 'Invoice already fully paid' }); return; }

        const order = await razorpayService.createOrder(balance, invoice.invoiceNumber, {
            invoiceId: String(invoice.id),
            clientName: invoice.client.name,
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: razorpayService.getKeyId() || 'rzp_test_demo',
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.client.name,
            clientEmail: invoice.client.contactEmail,
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /payments/gateway/verify — Verify Razorpay payment and record it
router.post('/gateway/verify', async (req: AuthRequest, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId } = req.body;

        const isValid = await razorpayService.verifyPayment({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        });

        if (!isValid) {
            res.status(400).json({ message: 'Payment verification failed — signature mismatch' });
            return;
        }

        const invoice = await prisma.invoice.findFirst({
            where: { id: Number(invoiceId), userId: req.userId },
        });
        if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }

        // Get payment details from Razorpay
        const paymentDetails = await razorpayService.getPayment(razorpay_payment_id);
        const amountPaid = (paymentDetails.amount || 0) / 100; // paise to rupees

        // Record payment
        const paymentCount = await prisma.payment.count({ where: { userId: req.userId } });
        const payment = await prisma.payment.create({
            data: {
                userId: req.userId!,
                invoiceId: invoice.id,
                amount: amountPaid,
                paymentMethod: paymentDetails.method || 'online',
                paymentDate: new Date(),
                reference: `PAY-${String(paymentCount + 1).padStart(5, '0')}`,
                notes: `Razorpay: ${razorpay_payment_id}`,
                status: 'completed',
            },
        });

        // Update invoice status
        const allPayments = await prisma.payment.aggregate({
            where: { invoiceId: invoice.id },
            _sum: { amount: true },
        });
        const totalPaid = Number(allPayments._sum.amount || 0);
        if (totalPaid >= Number(invoice.total)) {
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: 'paid', paidDate: new Date() },
            });
        }

        res.json({
            success: true,
            paymentId: payment.id,
            razorpayPaymentId: razorpay_payment_id,
            amountPaid,
            totalPaid,
            fullyPaid: totalPaid >= Number(invoice.total),
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /payments/gateway/payment-link — Generate client self-pay link
router.post('/gateway/payment-link', async (req: AuthRequest, res) => {
    try {
        const { invoiceId, expireDays } = req.body;
        const invoice = await prisma.invoice.findFirst({
            where: { id: Number(invoiceId), userId: req.userId },
            include: { client: true },
        });
        if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }

        const existingPayments = await prisma.payment.aggregate({
            where: { invoiceId: invoice.id },
            _sum: { amount: true },
        });
        const balance = Number(invoice.total) - Number(existingPayments._sum.amount || 0);

        const user = await prisma.user.findUnique({ where: { id: req.userId } });

        const link = await razorpayService.createPaymentLink({
            amountInRupees: balance,
            invoiceNumber: invoice.invoiceNumber,
            clientName: invoice.client.name,
            clientEmail: invoice.client.contactEmail,
            clientPhone: invoice.client.phone || undefined,
            description: `Payment for Invoice ${invoice.invoiceNumber} from ${user?.companyName || 'OkBill'}`,
            expireDays: expireDays || 30,
        });

        res.json({
            paymentLinkId: link.id,
            shortUrl: link.short_url,
            amount: link.amount / 100,
            expiresAt: new Date(link.expire_by * 1000).toISOString(),
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /payments/gateway/refund — Process refund
router.post('/gateway/refund', async (req: AuthRequest, res) => {
    try {
        const { paymentId, amount, reason } = req.body;

        const payment = await prisma.payment.findFirst({
            where: { id: Number(paymentId), userId: req.userId },
        });
        if (!payment) { res.status(404).json({ message: 'Payment not found' }); return; }

        // Extract Razorpay payment ID from notes
        const razorpayPaymentId = payment.notes?.toString().match(/Razorpay: (pay_\w+)/)?.[1];
        if (!razorpayPaymentId) {
            res.status(400).json({ message: 'No Razorpay payment ID found — manual refund required' });
            return;
        }

        const refundAmount = amount ? Number(amount) : Number(payment.amount);
        const refund = await razorpayService.createRefund(razorpayPaymentId, refundAmount, reason);

        // Record refund as negative payment
        await prisma.payment.create({
            data: {
                userId: req.userId!,
                invoiceId: payment.invoiceId,
                amount: -refundAmount,
                paymentMethod: 'refund',
                paymentDate: new Date(),
                reference: `RFND-${refund.id || Date.now()}`,
                notes: `Refund: ${reason || 'Customer request'}`,
                status: 'completed',
            },
        });

        // Recalculate invoice status
        const allPayments = await prisma.payment.aggregate({
            where: { invoiceId: payment.invoiceId },
            _sum: { amount: true },
        });
        const invoice = await prisma.invoice.findUnique({ where: { id: payment.invoiceId } });
        if (invoice) {
            const totalPaid = Number(allPayments._sum.amount || 0);
            const newStatus = totalPaid >= Number(invoice.total) ? 'paid'
                : totalPaid > 0 ? 'sent'
                    : invoice.dueDate < new Date() ? 'overdue' : 'sent';
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: newStatus, paidDate: newStatus === 'paid' ? new Date() : null },
            });
        }

        res.json({ success: true, refundId: refund.id, amount: refundAmount });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// GET /payments/gateway/status — Check Razorpay config status
router.get('/gateway/status', async (_req: AuthRequest, res) => {
    res.json({
        configured: razorpayService.isConfigured(),
        provider: 'Razorpay',
        keyId: razorpayService.getKeyId() ? '***' + razorpayService.getKeyId()!.slice(-4) : null,
        features: ['orders', 'payment_links', 'refunds', 'upi', 'cards', 'netbanking', 'wallets'],
    });
});

export default router;

