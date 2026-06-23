"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /expenses — List all expenses
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { search, category, status, limit, offset } = req.query;
        const where = { userId: req.userId };
        if (search) {
            where.OR = [
                { description: { contains: String(search), mode: 'insensitive' } },
                { vendor: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        if (category && category !== 'all')
            where.category = String(category);
        if (status && status !== 'all')
            where.status = String(status);
        const [expenses, total] = await Promise.all([
            prisma_1.default.expense.findMany({
                where,
                orderBy: { date: 'desc' },
                take: limit ? Number(limit) : 50,
                skip: offset ? Number(offset) : 0,
            }),
            prisma_1.default.expense.count({ where }),
        ]);
        res.json({ expenses, total });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /expenses/summary — Expense summary/stats
router.get('/summary', auth_1.authMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const allExpenses = await prisma_1.default.expense.findMany({
            where: { userId: req.userId, date: { gte: thisMonthStart } },
            select: { amount: true, gst: true, category: true, status: true },
        });
        const totalAmount = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const totalGst = allExpenses.reduce((s, e) => s + Number(e.gst), 0);
        const pendingCount = allExpenses.filter(e => e.status === 'pending').length;
        // Category breakdown
        const categoryBreakdown = {};
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
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /expenses/:id — Get single expense
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const expense = await prisma_1.default.expense.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!expense)
            return res.status(404).json({ message: 'Expense not found' });
        res.json(expense);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /expenses — Create expense
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { date, description, category, amount, gst, vendor, paymentMode, receipt, status, notes } = req.body;
        const expense = await prisma_1.default.expense.create({
            data: {
                userId: req.userId,
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
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PUT /expenses/:id — Update expense
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const existing = await prisma_1.default.expense.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: 'Expense not found' });
        const expense = await prisma_1.default.expense.update({
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
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PATCH /expenses/:id/status — Update expense status
router.patch('/:id/status', auth_1.authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const existing = await prisma_1.default.expense.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: 'Expense not found' });
        const expense = await prisma_1.default.expense.update({
            where: { id: existing.id },
            data: { status },
        });
        res.json(expense);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// DELETE /expenses/:id — Delete expense
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const existing = await prisma_1.default.expense.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: 'Expense not found' });
        await prisma_1.default.expense.delete({ where: { id: existing.id } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=expenses.js.map