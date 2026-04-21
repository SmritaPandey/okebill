import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /products
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { tenantId, search, category, brand, limit = '50', offset = '0' } = req.query;
        const where: any = {};
        if (tenantId) where.tenantId = Number(tenantId);
        if (category) where.category = String(category);
        if (brand) where.brand = String(brand);
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { sku: { contains: String(search), mode: 'insensitive' } },
                { barcode: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const [products, total] = await Promise.all([
            prisma.product.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } }),
            prisma.product.count({ where }),
        ]);
        res.json({ products, total });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /products/:id
router.get('/:id', async (_req, res) => {
    try {
        const product = await prisma.product.findUnique({ where: { id: Number(_req.params.id) } });
        if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
        res.json(product);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST /products
router.post('/', async (_req, res) => {
    try {
        const product = await prisma.product.create({ data: _req.body });
        res.status(201).json(product);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// PUT /products/:id
router.put('/:id', async (_req, res) => {
    try {
        const product = await prisma.product.update({ where: { id: Number(_req.params.id) }, data: _req.body });
        res.json(product);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// DELETE /products/:id
router.delete('/:id', async (_req, res) => {
    try {
        await prisma.product.delete({ where: { id: Number(_req.params.id) } });
        res.status(204).send();
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;
