import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /expenses — List all expenses
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { search, category, status, limit, offset } = req.query;
        const where: any = { userId: req.userId };

        if (search) {
            where.OR = [
                { description: { contains: String(search), mode: 'insensitive' } },
                { vendor: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        if (category && category !== 'all') where.category = String(category);
        if (status && status !== 'all') where.status = String(status);

        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                where,
                orderBy: { date: 'desc' },
                take: limit ? Number(limit) : 50,
                skip: offset ? Number(offset) : 0,
            }),
            prisma.expense.count({ where }),
        ]);

        res.json({ expenses, total });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// GET /expenses/summary — Expense summary/stats
router.get('/summary', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const allExpenses = await prisma.expense.findMany({
            where: { userId: req.userId, date: { gte: thisMonthStart } },
            select: { amount: true, gst: true, category: true, status: true },
        });

        const totalAmount = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const totalGst = allExpenses.reduce((s, e) => s + Number(e.gst), 0);
        const pendingCount = allExpenses.filter(e => e.status === 'pending').length;

        // Category breakdown
        const categoryBreakdown: Record<string, number> = {};
        allExpenses.forEach(e => {
            categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + Number(e.amount) + Number(e.gst);
        });

        res.json({
            totalAmount,
            totalGst,
            totalWithGst: totalAmount + totalGst,
            pendingCount,
            approvedCount: allExpenses.filter(e => e.status === 'approved').length,
            categoryBreakdown,
            expenseCount: allExpenses.length,
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// GET /expenses/:id — Get single expense
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const expense = await prisma.expense.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.json(expense);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /expenses — Create expense
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { date, description, category, amount, gst, vendor, paymentMode, receipt, status, notes } = req.body;

        const expense = await prisma.expense.create({
            data: {
                userId: req.userId!,
                date: date ? new Date(date) : new Date(),
                description: description || '',
                category: category || 'misc',
                amount: amount || 0,
                gst: gst || 0,
                vendor: vendor || '',
                paymentMode: paymentMode || 'cash',
                receipt,
                status: status || 'pending',
                notes,
            },
        });

        res.status(201).json(expense);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /expenses/:id — Update expense
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.expense.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) return res.status(404).json({ message: 'Expense not found' });

        const expense = await prisma.expense.update({
            where: { id: existing.id },
            data: {
                ...(req.body.date && { date: new Date(req.body.date) }),
                ...(req.body.description !== undefined && { description: req.body.description }),
                ...(req.body.category && { category: req.body.category }),
                ...(req.body.amount !== undefined && { amount: req.body.amount }),
                ...(req.body.gst !== undefined && { gst: req.body.gst }),
                ...(req.body.vendor !== undefined && { vendor: req.body.vendor }),
                ...(req.body.paymentMode && { paymentMode: req.body.paymentMode }),
                ...(req.body.receipt !== undefined && { receipt: req.body.receipt }),
                ...(req.body.status && { status: req.body.status }),
                ...(req.body.notes !== undefined && { notes: req.body.notes }),
            },
        });

        res.json(expense);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /expenses/:id/status — Update expense status
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const existing = await prisma.expense.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) return res.status(404).json({ message: 'Expense not found' });

        const expense = await prisma.expense.update({
            where: { id: existing.id },
            data: { status },
        });

        res.json(expense);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /expenses/:id — Delete expense
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.expense.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) return res.status(404).json({ message: 'Expense not found' });

        await prisma.expense.delete({ where: { id: existing.id } });
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
