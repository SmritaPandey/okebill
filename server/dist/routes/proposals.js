"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// GET /proposals
router.get('/', async (req, res) => {
    try {
        const { clientId, status, limit = '50', offset = '0' } = req.query;
        const where = { userId: req.userId };
        if (clientId)
            where.clientId = Number(clientId);
        if (status)
            where.status = String(status);
        const [proposals, total] = await Promise.all([
            prisma_1.default.proposal.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' }, include: { client: true } }),
            prisma_1.default.proposal.count({ where }),
        ]);
        res.json({ proposals, total });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /proposals/:id
router.get('/:id', async (req, res) => {
    try {
        const proposal = await prisma_1.default.proposal.findFirst({ where: { id: Number(req.params.id), userId: req.userId }, include: { client: true } });
        if (!proposal) {
            res.status(404).json({ message: 'Proposal not found' });
            return;
        }
        res.json(proposal);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /proposals/:id/public (no auth)
router.get('/:id/public', async (req, res) => {
    try {
        const proposal = await prisma_1.default.proposal.findUnique({ where: { id: Number(req.params.id) }, include: { client: true } });
        if (!proposal) {
            res.status(404).json({ message: 'Proposal not found' });
            return;
        }
        res.json(proposal);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /proposals
router.post('/', async (req, res) => {
    try {
        const proposal = await prisma_1.default.proposal.create({ data: { ...req.body, userId: req.userId } });
        res.status(201).json(proposal);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PUT /proposals/:id
router.put('/:id', async (req, res) => {
    try {
        const proposal = await prisma_1.default.proposal.update({ where: { id: Number(req.params.id) }, data: req.body });
        res.json(proposal);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PATCH /proposals/:id/status
router.patch('/:id/status', async (req, res) => {
    try {
        const proposal = await prisma_1.default.proposal.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status } });
        res.json(proposal);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// DELETE /proposals/:id
router.delete('/:id', async (req, res) => {
    try {
        const proposal = await prisma_1.default.proposal.findFirst({ where: { id: Number(req.params.id), userId: req.userId } });
        if (!proposal) {
            res.status(404).json({ message: 'Proposal not found' });
            return;
        }
        if (proposal.status === 'draft') {
            await prisma_1.default.proposal.delete({ where: { id: Number(req.params.id) } });
        }
        else {
            await prisma_1.default.proposal.update({ where: { id: Number(req.params.id) }, data: { status: 'rejected' } });
        }
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── POST /proposals/:id/convert-to-invoice ─────────────────
// One-click conversion of a quotation/proposal into a tax invoice
router.post('/:id/convert-to-invoice', async (req, res) => {
    try {
        const proposal = await prisma_1.default.proposal.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
            include: { client: true },
        });
        if (!proposal) {
            res.status(404).json({ message: 'Proposal not found' });
            return;
        }
        if (proposal.status === 'rejected') {
            res.status(400).json({ message: 'Cannot convert a rejected proposal' });
            return;
        }
        // Create a contract from the proposal
        const contract = await prisma_1.default.contract.create({
            data: {
                userId: req.userId,
                clientId: proposal.clientId,
                proposalId: proposal.id,
                title: proposal.title,
                status: 'active',
                value: Number(proposal.total),
                startDate: new Date(),
            },
        });
        // Auto-generate invoice number
        const count = await prisma_1.default.invoice.count({ where: { userId: req.userId } });
        const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
        // Parse proposal items
        const items = Array.isArray(proposal.items) ? proposal.items : [];
        const subtotal = Number(proposal.total);
        const taxRate = req.body.taxRate || 18; // Default 18% GST
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        // Create invoice
        const invoice = await prisma_1.default.invoice.create({
            data: {
                userId: req.userId,
                clientId: proposal.clientId,
                contractId: contract.id,
                invoiceNumber,
                items: items,
                subtotal,
                taxAmount,
                total,
                dueDate: new Date(Date.now() + 30 * 86400000), // 30 days
                issueDate: new Date(),
                notes: `Generated from proposal: ${proposal.title}`,
                status: 'draft',
            },
            include: { client: true },
        });
        // Mark proposal as accepted
        await prisma_1.default.proposal.update({
            where: { id: proposal.id },
            data: { status: 'accepted' },
        });
        res.status(201).json({
            invoice,
            contract,
            message: `Proposal converted to invoice ${invoiceNumber}`,
        });
    }
    catch (err) {
        if (err.code === 'P2002') {
            res.status(409).json({ message: 'Invoice number conflict. Please try again.' });
            return;
        }
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=proposals.js.map