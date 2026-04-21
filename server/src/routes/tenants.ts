import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /tenants/:id
router.get('/:id', async (req, res) => {
    try {
        const tenant = await prisma.tenant.findUnique({ where: { id: Number(req.params.id) } });
        if (!tenant) { res.status(404).json({ message: 'Tenant not found' }); return; }
        res.json(tenant);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST /tenants
router.post('/', async (req, res) => {
    try {
        const tenant = await prisma.tenant.create({ data: req.body });
        res.status(201).json(tenant);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// PUT /tenants/:id
router.put('/:id', async (req, res) => {
    try {
        const tenant = await prisma.tenant.update({ where: { id: Number(req.params.id) }, data: req.body });
        res.json(tenant);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;
