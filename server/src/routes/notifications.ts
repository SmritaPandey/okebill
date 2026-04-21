import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /notifications
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { limit = '50', offset = '0' } = req.query;
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({ where: { userId: req.userId }, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } }),
            prisma.notification.count({ where: { userId: req.userId } }),
        ]);
        res.json({ notifications, total });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', async (req: AuthRequest, res) => {
    try {
        await prisma.notification.updateMany({ where: { id: Number(req.params.id), userId: req.userId }, data: { read: true } });
        res.status(204).send();
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;
