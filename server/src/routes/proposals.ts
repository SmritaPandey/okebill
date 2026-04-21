import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /proposals
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { clientId, status, limit = '50', offset = '0' } = req.query;
        const where: any = { userId: req.userId };
        if (clientId) where.clientId = Number(clientId);
        if (status) where.status = String(status);
        const [proposals, total] = await Promise.all([
            prisma.proposal.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' }, include: { client: true } }),
            prisma.proposal.count({ where }),
        ]);
        res.json({ proposals, total });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /proposals/:id
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const proposal = await prisma.proposal.findFirst({ where: { id: Number(req.params.id), userId: req.userId }, include: { client: true } });
        if (!proposal) { res.status(404).json({ message: 'Proposal not found' }); return; }
        res.json(proposal);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /proposals/:id/public (no auth)
router.get('/:id/public', async (req, res) => {
    try {
        const proposal = await prisma.proposal.findUnique({ where: { id: Number(req.params.id) }, include: { client: true } });
        if (!proposal) { res.status(404).json({ message: 'Proposal not found' }); return; }
        res.json(proposal);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST /proposals
router.post('/', async (req: AuthRequest, res) => {
    try {
        const proposal = await prisma.proposal.create({ data: { ...req.body, userId: req.userId! } });
        res.status(201).json(proposal);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// PUT /proposals/:id
router.put('/:id', async (req: AuthRequest, res) => {
    try {
        const proposal = await prisma.proposal.update({ where: { id: Number(req.params.id) }, data: req.body });
        res.json(proposal);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// PATCH /proposals/:id/status
router.patch('/:id/status', async (req: AuthRequest, res) => {
    try {
        const proposal = await prisma.proposal.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status } });
        res.json(proposal);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// DELETE /proposals/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const proposal = await prisma.proposal.findFirst({ where: { id: Number(req.params.id), userId: req.userId } });
        if (!proposal) { res.status(404).json({ message: 'Proposal not found' }); return; }
        if (proposal.status === 'draft') {
            await prisma.proposal.delete({ where: { id: Number(req.params.id) } });
        } else {
            await prisma.proposal.update({ where: { id: Number(req.params.id) }, data: { status: 'rejected' } });
        }
        res.status(204).send();
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;
