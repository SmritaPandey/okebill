import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /suppliers
router.get('/', async (req, res) => {
    try {
        const { tenantId, search, limit = '50', offset = '0' } = req.query;
        const where: any = {};
        if (tenantId) where.tenantId = Number(tenantId);
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } }),
            prisma.supplier.count({ where }),
        ]);
        res.json({ suppliers, total });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /suppliers/:id
router.get('/:id', async (req, res) => {
    try {
        const supplier = await prisma.supplier.findUnique({ where: { id: Number(req.params.id) } });
        if (!supplier) { res.status(404).json({ message: 'Supplier not found' }); return; }
        res.json(supplier);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST /suppliers
router.post('/', async (req, res) => {
    try {
        const supplier = await prisma.supplier.create({ data: req.body });
        res.status(201).json(supplier);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// PUT /suppliers/:id
router.put('/:id', async (req, res) => {
    try {
        const supplier = await prisma.supplier.update({ where: { id: Number(req.params.id) }, data: req.body });
        res.json(supplier);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// DELETE /suppliers/:id
router.delete('/:id', async (req, res) => {
    try {
        await prisma.supplier.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;
