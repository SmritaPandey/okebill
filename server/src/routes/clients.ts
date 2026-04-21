import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /clients
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { search, limit = '50', offset = '0' } = req.query;
        const where: any = { userId: req.userId };
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { contactEmail: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const [clients, total] = await Promise.all([
            prisma.client.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } }),
            prisma.client.count({ where }),
        ]);
        res.json({ clients, total });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// GET /clients/:id
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const client = await prisma.client.findFirst({ where: { id: Number(req.params.id), userId: req.userId } });
        if (!client) { res.status(404).json({ message: 'Client not found' }); return; }
        res.json(client);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /clients
router.post('/', async (req: AuthRequest, res) => {
    try {
        const client = await prisma.client.create({ data: { ...req.body, userId: req.userId! } });
        res.status(201).json(client);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /clients/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const client = await prisma.client.updateMany({ where: { id: Number(req.params.id), userId: req.userId }, data: req.body });
        if (client.count === 0) { res.status(404).json({ message: 'Client not found' }); return; }
        const updated = await prisma.client.findUnique({ where: { id: Number(req.params.id) } });
        res.json(updated);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /clients/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        await prisma.client.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
