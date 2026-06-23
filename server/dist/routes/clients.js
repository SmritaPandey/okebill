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
// GET /clients
router.get('/', async (req, res) => {
    try {
        const { search, limit = '50', offset = '0' } = req.query;
        const where = { userId: req.userId };
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { contactEmail: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const [clients, total] = await Promise.all([
            prisma_1.default.client.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } }),
            prisma_1.default.client.count({ where }),
        ]);
        res.json({ clients, total });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /clients/:id
router.get('/:id', async (req, res) => {
    try {
        const client = await prisma_1.default.client.findFirst({ where: { id: Number(req.params.id), userId: req.userId } });
        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }
        res.json(client);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /clients
router.post('/', async (req, res) => {
    try {
        const client = await prisma_1.default.client.create({ data: { ...req.body, userId: req.userId } });
        res.status(201).json(client);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PUT /clients/:id
router.put('/:id', async (req, res) => {
    try {
        const client = await prisma_1.default.client.updateMany({ where: { id: Number(req.params.id), userId: req.userId }, data: req.body });
        if (client.count === 0) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }
        const updated = await prisma_1.default.client.findUnique({ where: { id: Number(req.params.id) } });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// DELETE /clients/:id
router.delete('/:id', async (req, res) => {
    try {
        await prisma_1.default.client.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=clients.js.map