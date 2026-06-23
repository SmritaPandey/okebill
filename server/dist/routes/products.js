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
// GET /products
router.get('/', async (req, res) => {
    try {
        const { tenantId, search, category, brand, limit = '50', offset = '0' } = req.query;
        const where = {};
        if (tenantId)
            where.tenantId = Number(tenantId);
        if (category)
            where.category = String(category);
        if (brand)
            where.brand = String(brand);
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { sku: { contains: String(search), mode: 'insensitive' } },
                { barcode: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const [products, total] = await Promise.all([
            prisma_1.default.product.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } }),
            prisma_1.default.product.count({ where }),
        ]);
        res.json({ products, total });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /products/:id
router.get('/:id', async (_req, res) => {
    try {
        const product = await prisma_1.default.product.findUnique({ where: { id: Number(_req.params.id) } });
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        res.json(product);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /products
router.post('/', async (_req, res) => {
    try {
        const product = await prisma_1.default.product.create({ data: _req.body });
        res.status(201).json(product);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PUT /products/:id
router.put('/:id', async (_req, res) => {
    try {
        const product = await prisma_1.default.product.update({ where: { id: Number(_req.params.id) }, data: _req.body });
        res.json(product);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// DELETE /products/:id
router.delete('/:id', async (_req, res) => {
    try {
        await prisma_1.default.product.delete({ where: { id: Number(_req.params.id) } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map