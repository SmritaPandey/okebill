"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /recurring-invoices — List all
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { search, status, limit, offset } = req.query;
        const where = { userId: req.userId };
        if (status === 'active')
            where.active = true;
        else if (status === 'paused')
            where.active = false;
        const [items, total] = await Promise.all([
            prisma_1.default.recurringInvoice.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit ? Number(limit) : 50,
                skip: offset ? Number(offset) : 0,
            }),
            prisma_1.default.recurringInvoice.count({ where }),
        ]);
        res.json({ recurringInvoices: items, total });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /recurring-invoices/summary — Stats
router.get('/summary', auth_1.authMiddleware, async (req, res) => {
    try {
        const all = await prisma_1.default.recurringInvoice.findMany({
            where: { userId: req.userId },
            select: { active: true, total: true, frequency: true },
        });
        const activeCount = all.filter(r => r.active).length;
        const pausedCount = all.filter(r => !r.active).length;
        const monthlyRevenue = all
            .filter(r => r.active)
            .reduce((sum, r) => {
            const amount = Number(r.total);
            switch (r.frequency) {
                case 'weekly': return sum + amount * 4.33;
                case 'monthly': return sum + amount;
                case 'quarterly': return sum + amount / 3;
                case 'yearly': return sum + amount / 12;
                default: return sum + amount;
            }
        }, 0);
        res.json({
            activeCount,
            pausedCount,
            totalCount: all.length,
            estimatedMonthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /recurring-invoices/:id — Get single
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const item = await prisma_1.default.recurringInvoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!item)
            return res.status(404).json({ message: 'Recurring invoice not found' });
        res.json(item);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /recurring-invoices — Create
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { clientId, templateItems, subtotal, taxRate, total, frequency, nextDate, endDate, paymentTermsDays, notes } = req.body;
        if (!clientId || !nextDate) {
            return res.status(400).json({ message: 'clientId and nextDate are required' });
        }
        const item = await prisma_1.default.recurringInvoice.create({
            data: {
                userId: req.userId,
                clientId: Number(clientId),
                templateItems: templateItems || [],
                subtotal: subtotal || 0,
                taxRate: taxRate || 0,
                total: total || 0,
                frequency: frequency || 'monthly',
                nextDate: new Date(nextDate),
                endDate: endDate ? new Date(endDate) : null,
                paymentTermsDays: paymentTermsDays || 30,
                notes,
                active: true,
            },
        });
        res.status(201).json(item);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PUT /recurring-invoices/:id — Update
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const existing = await prisma_1.default.recurringInvoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: 'Recurring invoice not found' });
        const item = await prisma_1.default.recurringInvoice.update({
            where: { id: existing.id },
            data: {
                ...(req.body.clientId !== undefined && { clientId: Number(req.body.clientId) }),
                ...(req.body.templateItems && { templateItems: req.body.templateItems }),
                ...(req.body.subtotal !== undefined && { subtotal: req.body.subtotal }),
                ...(req.body.taxRate !== undefined && { taxRate: req.body.taxRate }),
                ...(req.body.total !== undefined && { total: req.body.total }),
                ...(req.body.frequency && { frequency: req.body.frequency }),
                ...(req.body.nextDate && { nextDate: new Date(req.body.nextDate) }),
                ...(req.body.endDate !== undefined && { endDate: req.body.endDate ? new Date(req.body.endDate) : null }),
                ...(req.body.paymentTermsDays !== undefined && { paymentTermsDays: req.body.paymentTermsDays }),
                ...(req.body.notes !== undefined && { notes: req.body.notes }),
                ...(req.body.active !== undefined && { active: req.body.active }),
            },
        });
        res.json(item);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PATCH /recurring-invoices/:id/toggle — Toggle active/paused
router.patch('/:id/toggle', auth_1.authMiddleware, async (req, res) => {
    try {
        const existing = await prisma_1.default.recurringInvoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: 'Recurring invoice not found' });
        const item = await prisma_1.default.recurringInvoice.update({
            where: { id: existing.id },
            data: { active: !existing.active },
        });
        res.json(item);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// DELETE /recurring-invoices/:id
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const existing = await prisma_1.default.recurringInvoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: 'Recurring invoice not found' });
        await prisma_1.default.recurringInvoice.delete({ where: { id: existing.id } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=recurring-invoices.js.map