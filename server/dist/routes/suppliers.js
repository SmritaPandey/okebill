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
// GET /suppliers
router.get('/', async (req, res) => {
    try {
        const { tenantId, search, limit = '50', offset = '0' } = req.query;
        const where = {};
        if (tenantId)
            where.tenantId = Number(tenantId);
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const [suppliers, total] = await Promise.all([
            prisma_1.default.supplier.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } }),
            prisma_1.default.supplier.count({ where }),
        ]);
        res.json({ suppliers, total });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /suppliers/:id
router.get('/:id', async (req, res) => {
    try {
        const supplier = await prisma_1.default.supplier.findUnique({ where: { id: Number(req.params.id) } });
        if (!supplier) {
            res.status(404).json({ message: 'Supplier not found' });
            return;
        }
        res.json(supplier);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /suppliers
router.post('/', async (req, res) => {
    try {
        const supplier = await prisma_1.default.supplier.create({ data: req.body });
        res.status(201).json(supplier);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PUT /suppliers/:id
router.put('/:id', async (req, res) => {
    try {
        const supplier = await prisma_1.default.supplier.update({ where: { id: Number(req.params.id) }, data: req.body });
        res.json(supplier);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// DELETE /suppliers/:id
router.delete('/:id', async (req, res) => {
    try {
        await prisma_1.default.supplier.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=suppliers.js.map