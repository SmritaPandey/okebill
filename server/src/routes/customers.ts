import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /customers
router.get('/', async (req, res) => {
    try {
        const { tenantId, search, limit = '50', offset = '0' } = req.query;
        const where: any = {};
        if (tenantId) where.tenantId = Number(tenantId);
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
                { phone: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const [customers, total] = await Promise.all([
            prisma.customer.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } }),
            prisma.customer.count({ where }),
        ]);
        res.json({ customers, total });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /customers/:id
router.get('/:id', async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({ where: { id: Number(req.params.id) } });
        if (!customer) { res.status(404).json({ message: 'Customer not found' }); return; }
        res.json(customer);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST /customers
router.post('/', async (req, res) => {
    try {
        const customer = await prisma.customer.create({ data: req.body });
        res.status(201).json(customer);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// PUT /customers/:id
router.put('/:id', async (req, res) => {
    try {
        const customer = await prisma.customer.update({ where: { id: Number(req.params.id) }, data: req.body });
        res.json(customer);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// DELETE /customers/:id
router.delete('/:id', async (req, res) => {
    try {
        await prisma.customer.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;
