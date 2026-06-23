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
// GET /contracts
router.get('/', async (req, res) => {
    try {
        const { clientId, status, limit = '50', offset = '0' } = req.query;
        const where = { userId: req.userId };
        if (clientId)
            where.clientId = Number(clientId);
        if (status)
            where.status = String(status);
        const [contracts, total] = await Promise.all([
            prisma_1.default.contract.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' }, include: { client: true, proposal: true } }),
            prisma_1.default.contract.count({ where }),
        ]);
        res.json({ contracts, total });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /contracts/:id
router.get('/:id', async (req, res) => {
    try {
        const contract = await prisma_1.default.contract.findFirst({ where: { id: Number(req.params.id), userId: req.userId }, include: { client: true, proposal: true } });
        if (!contract) {
            res.status(404).json({ message: 'Contract not found' });
            return;
        }
        res.json(contract);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /contracts/generate
router.post('/generate', async (req, res) => {
    try {
        const { proposalId, startDate, endDate } = req.body;
        const proposal = await prisma_1.default.proposal.findUnique({ where: { id: proposalId } });
        if (!proposal) {
            res.status(404).json({ message: 'Proposal not found' });
            return;
        }
        const contract = await prisma_1.default.contract.create({
            data: {
                userId: req.userId,
                clientId: proposal.clientId,
                proposalId: proposal.id,
                title: `Contract for ${proposal.title}`,
                terms: '',
                value: proposal.total,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : undefined,
                status: 'active',
            },
        });
        res.status(201).json(contract);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PUT /contracts/:id
router.put('/:id', async (req, res) => {
    try {
        const existing = await prisma_1.default.contract.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) {
            res.status(404).json({ message: 'Contract not found' });
            return;
        }
        const { title, terms, value, startDate, endDate, status } = req.body;
        const contract = await prisma_1.default.contract.update({
            where: { id: Number(req.params.id) },
            data: {
                ...(title && { title }),
                ...(terms !== undefined && { terms }),
                ...(value !== undefined && { value: Number(value) }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) }),
                ...(status && { status }),
            },
            include: { client: true, proposal: true },
        });
        res.json(contract);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /contracts/:id/renew
router.post('/:id/renew', async (req, res) => {
    try {
        const original = await prisma_1.default.contract.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!original) {
            res.status(404).json({ message: 'Contract not found' });
            return;
        }
        const { startDate, endDate } = req.body;
        const newStart = startDate ? new Date(startDate) : original.endDate || new Date();
        // Mark original as completed
        await prisma_1.default.contract.update({
            where: { id: original.id },
            data: { status: 'completed' },
        });
        const renewed = await prisma_1.default.contract.create({
            data: {
                userId: req.userId,
                clientId: original.clientId,
                proposalId: original.proposalId,
                title: `${original.title} (Renewed)`,
                terms: original.terms || '',
                value: original.value,
                startDate: newStart,
                endDate: endDate ? new Date(endDate) : undefined,
                status: 'active',
            },
            include: { client: true },
        });
        res.status(201).json(renewed);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// DELETE /contracts/:id
router.delete('/:id', async (req, res) => {
    try {
        const contract = await prisma_1.default.contract.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!contract) {
            res.status(404).json({ message: 'Contract not found' });
            return;
        }
        if (!['draft', 'cancelled'].includes(contract.status)) {
            // Active/completed contracts get cancelled instead of deleted
            await prisma_1.default.contract.update({ where: { id: Number(req.params.id) }, data: { status: 'cancelled' } });
        }
        else {
            await prisma_1.default.contract.delete({ where: { id: Number(req.params.id) } });
        }
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=contracts.js.map