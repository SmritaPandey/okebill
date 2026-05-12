import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ─── GET /purchases ─────────────────────────────────────────
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { status, purchaseType, limit = '50', offset = '0' } = req.query;
        const where: any = { userId: req.userId };
        if (status) where.status = String(status);
        if (purchaseType) where.purchaseType = String(purchaseType);

        const [purchases, total] = await Promise.all([
            prisma.purchaseInvoice.findMany({
                where,
                take: Number(limit),
                skip: Number(offset),
                orderBy: { createdAt: 'desc' },
            }),
            prisma.purchaseInvoice.count({ where }),
        ]);

        res.json({ purchases, total });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /purchases/:id ─────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const purchase = await prisma.purchaseInvoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!purchase) { res.status(404).json({ message: 'Purchase invoice not found' }); return; }
        res.json(purchase);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /purchases ────────────────────────────────────────
router.post('/', async (req: AuthRequest, res) => {
    try {
        const {
            supplierId, supplierName, supplierGstin, invoiceNumber, purchaseType,
            items, subtotal, taxAmount, total, placeOfSupply,
            paymentMethod, paymentReference, ewayBillNumber,
            invoiceDate, receivedDate, dueDate, notes,
        } = req.body;

        if (!supplierName) {
            res.status(400).json({ message: 'Supplier name is required' }); return;
        }
        if (!invoiceNumber) {
            res.status(400).json({ message: 'Invoice number is required' }); return;
        }

        // Auto-detect supply type
        let supplyType = 'intra';
        if (placeOfSupply && supplierGstin) {
            const supplierState = supplierGstin.substring(0, 2);
            if (supplierState !== placeOfSupply) supplyType = 'inter';
        }

        const purchase = await prisma.purchaseInvoice.create({
            data: {
                userId: req.userId!,
                supplierId: supplierId ? Number(supplierId) : null,
                supplierName,
                supplierGstin: supplierGstin || null,
                invoiceNumber,
                purchaseType: purchaseType || 'purchase',
                items: items || [],
                subtotal: subtotal || 0,
                taxAmount: taxAmount || 0,
                total: total || 0,
                placeOfSupply: placeOfSupply || null,
                supplyType,
                paymentMethod: paymentMethod || null,
                paymentReference: paymentReference || null,
                ewayBillNumber: ewayBillNumber || null,
                invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
                receivedDate: receivedDate ? new Date(receivedDate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                notes: notes || null,
            },
        });

        res.status(201).json(purchase);
    } catch (err: any) {
        if (err.code === 'P2002') {
            res.status(409).json({ message: 'Purchase invoice number already exists for this user.' });
            return;
        }
        res.status(500).json({ message: err.message });
    }
});

// ─── PUT /purchases/:id ─────────────────────────────────────
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.purchaseInvoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) { res.status(404).json({ message: 'Purchase invoice not found' }); return; }
        if (!['draft'].includes(existing.status)) {
            res.status(400).json({ message: 'Only draft purchases can be edited' });
            return;
        }

        const {
            supplierId, supplierName, supplierGstin, items, subtotal, taxAmount, total,
            placeOfSupply, paymentMethod, paymentReference, ewayBillNumber,
            receivedDate, dueDate, notes,
        } = req.body;

        const purchase = await prisma.purchaseInvoice.update({
            where: { id: Number(req.params.id) },
            data: {
                ...(supplierId !== undefined && { supplierId: supplierId ? Number(supplierId) : null }),
                ...(supplierName && { supplierName }),
                ...(supplierGstin !== undefined && { supplierGstin: supplierGstin || null }),
                ...(items && { items }),
                ...(subtotal !== undefined && { subtotal }),
                ...(taxAmount !== undefined && { taxAmount }),
                ...(total !== undefined && { total }),
                ...(placeOfSupply !== undefined && { placeOfSupply: placeOfSupply || null }),
                ...(paymentMethod !== undefined && { paymentMethod: paymentMethod || null }),
                ...(paymentReference !== undefined && { paymentReference: paymentReference || null }),
                ...(ewayBillNumber !== undefined && { ewayBillNumber: ewayBillNumber || null }),
                ...(receivedDate !== undefined && { receivedDate: receivedDate ? new Date(receivedDate) : null }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(notes !== undefined && { notes: notes || null }),
            },
        });

        res.json(purchase);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PATCH /purchases/:id/status ────────────────────────────
router.patch('/:id/status', async (req: AuthRequest, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['draft', 'received', 'paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            return;
        }

        const data: any = { status };
        if (status === 'received') data.receivedDate = new Date();

        const purchase = await prisma.purchaseInvoice.update({
            where: { id: Number(req.params.id) },
            data,
        });
        res.json(purchase);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /purchases/:id/payment ────────────────────────────
// Record a payment against a purchase invoice
router.post('/:id/payment', async (req: AuthRequest, res) => {
    try {
        const purchase = await prisma.purchaseInvoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!purchase) { res.status(404).json({ message: 'Purchase invoice not found' }); return; }

        const { amount, paymentMethod, paymentReference } = req.body;
        const paymentAmount = Number(amount);
        if (!paymentAmount || paymentAmount <= 0) {
            res.status(400).json({ message: 'Valid payment amount is required' }); return;
        }

        const newAmountPaid = Number(purchase.amountPaid) + paymentAmount;
        const totalDue = Number(purchase.total);
        const paymentStatus = newAmountPaid >= totalDue ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid';

        const updated = await prisma.purchaseInvoice.update({
            where: { id: purchase.id },
            data: {
                amountPaid: newAmountPaid,
                paymentStatus,
                paymentMethod: paymentMethod || purchase.paymentMethod,
                paymentReference: paymentReference || purchase.paymentReference,
                status: paymentStatus === 'paid' ? 'paid' : purchase.status,
            },
        });

        res.json(updated);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /purchases/:id/return ─────────────────────────────
// Create a purchase return (debit note) from a purchase invoice
router.post('/:id/return', async (req: AuthRequest, res) => {
    try {
        const original = await prisma.purchaseInvoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!original) { res.status(404).json({ message: 'Purchase invoice not found' }); return; }

        const { items, reason } = req.body;
        const returnItems = items || original.items;

        // Calculate return totals
        const parsedItems = Array.isArray(returnItems) ? returnItems : [];
        const returnSubtotal = parsedItems.reduce((sum: number, item: any) =>
            sum + ((item.quantity || 1) * (item.unitPrice || 0)), 0);
        const returnTax = returnSubtotal * 0.18; // Default 18% GST for returns
        const returnTotal = returnSubtotal + returnTax;

        const count = await prisma.purchaseInvoice.count({ where: { userId: req.userId } });

        const purchaseReturn = await prisma.purchaseInvoice.create({
            data: {
                userId: req.userId!,
                supplierId: original.supplierId,
                supplierName: original.supplierName,
                supplierGstin: original.supplierGstin,
                invoiceNumber: `PR-${String(count + 1).padStart(5, '0')}`,
                purchaseType: 'purchase_return',
                items: returnItems,
                subtotal: returnSubtotal,
                taxAmount: returnTax,
                total: returnTotal,
                placeOfSupply: original.placeOfSupply,
                supplyType: original.supplyType,
                invoiceDate: new Date(),
                notes: reason || `Purchase return against ${original.invoiceNumber}`,
                status: 'draft',
            },
        });

        res.status(201).json(purchaseReturn);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── DELETE /purchases/:id ──────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.purchaseInvoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) { res.status(404).json({ message: 'Purchase invoice not found' }); return; }
        if (!['draft', 'cancelled'].includes(existing.status)) {
            res.status(400).json({ message: 'Only draft or cancelled purchases can be deleted' });
            return;
        }
        await prisma.purchaseInvoice.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /purchases/summary ─────────────────────────────────
// Purchase summary for reports
router.get('/summary/overview', async (req: AuthRequest, res) => {
    try {
        const { month, year } = req.query;
        const where: any = { userId: req.userId, purchaseType: 'purchase' };

        if (month && year) {
            const m = Number(month);
            const y = Number(year);
            const startDate = new Date(y, m - 1, 1);
            const endDate = new Date(y, m, 0, 23, 59, 59);
            where.invoiceDate = { gte: startDate, lte: endDate };
        }

        const purchases = await prisma.purchaseInvoice.findMany({ where });

        const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total), 0);
        const totalTax = purchases.reduce((sum, p) => sum + Number(p.taxAmount), 0);
        const totalPaid = purchases.reduce((sum, p) => sum + Number(p.amountPaid), 0);
        const totalDue = totalPurchases - totalPaid;

        res.json({
            totalPurchases,
            totalTax,
            totalPaid,
            totalDue,
            count: purchases.length,
            byStatus: {
                draft: purchases.filter(p => p.status === 'draft').length,
                received: purchases.filter(p => p.status === 'received').length,
                paid: purchases.filter(p => p.status === 'paid').length,
                cancelled: purchases.filter(p => p.status === 'cancelled').length,
            },
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
