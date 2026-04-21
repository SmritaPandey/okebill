import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// POST /pos/transactions
router.post('/transactions', async (req, res) => {
    try {
        const { items, ...transactionData } = req.body;
        // Auto-generate transaction number
        const count = await prisma.transaction.count({ where: { tenantId: transactionData.tenantId } });
        const transactionNumber = `TXN-${String(count + 1).padStart(6, '0')}`;

        const transaction = await prisma.transaction.create({
            data: {
                ...transactionData,
                transactionNumber,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discountAmount: item.discountAmount || 0,
                        taxAmount: item.taxAmount || 0,
                        lineTotal: item.lineTotal || item.quantity * item.unitPrice,
                    })),
                },
            },
            include: { items: { include: { product: true } }, customer: true },
        });

        // Update inventory for each item
        for (const item of items) {
            await prisma.inventory.updateMany({
                where: { productId: item.productId, outletId: transactionData.outletId },
                data: { quantity: { decrement: Number(item.quantity) } },
            });
        }

        res.status(201).json(transaction);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /pos/transactions/:id
router.get('/transactions/:id', async (req, res) => {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: Number(req.params.id) },
            include: { items: { include: { product: true } }, customer: true },
        });
        if (!transaction) { res.status(404).json({ message: 'Transaction not found' }); return; }
        res.json(transaction);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /pos/transactions
router.get('/transactions', async (req, res) => {
    try {
        const { tenantId, outletId, transactionType, limit = '50', offset = '0' } = req.query;
        const where: any = {};
        if (tenantId) where.tenantId = Number(tenantId);
        if (outletId) where.outletId = Number(outletId);
        if (transactionType) where.transactionType = String(transactionType);
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' }, include: { items: true, customer: true } }),
            prisma.transaction.count({ where }),
        ]);
        res.json({ transactions, total });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST /pos/transactions/:id/void
router.post('/transactions/:id/void', async (req, res) => {
    try {
        const transaction = await prisma.transaction.update({
            where: { id: Number(req.params.id) },
            data: { status: 'voided' },
            include: { items: true },
        });
        // Restore inventory
        for (const item of transaction.items) {
            await prisma.inventory.updateMany({
                where: { productId: item.productId, outletId: transaction.outletId },
                data: { quantity: { increment: Number(item.quantity) } },
            });
        }
        res.json(transaction);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;
