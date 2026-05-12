import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ─── GET /stock-transfers ───────────────────────────────────
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { status, limit = '50', offset = '0' } = req.query;
        const where: any = { userId: req.userId };
        if (status) where.status = String(status);

        const [transfers, total] = await Promise.all([
            prisma.stockTransfer.findMany({
                where,
                take: Number(limit),
                skip: Number(offset),
                orderBy: { createdAt: 'desc' },
            }),
            prisma.stockTransfer.count({ where }),
        ]);

        res.json({ transfers, total });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /stock-transfers/:id ───────────────────────────────
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const transfer = await prisma.stockTransfer.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!transfer) { res.status(404).json({ message: 'Stock transfer not found' }); return; }
        res.json(transfer);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /stock-transfers ──────────────────────────────────
router.post('/', async (req: AuthRequest, res) => {
    try {
        const count = await prisma.stockTransfer.count({ where: { userId: req.userId } });
        const transferNumber = `ST-${String(count + 1).padStart(5, '0')}`;

        const {
            fromOutletId, toOutletId, fromOutletName, toOutletName,
            items, transportMode, vehicleNumber, driverName, notes, transferDate,
        } = req.body;

        if (!fromOutletName || !toOutletName) {
            res.status(400).json({ message: 'Source and destination outlet names are required' }); return;
        }
        if (fromOutletId === toOutletId) {
            res.status(400).json({ message: 'Source and destination must be different' }); return;
        }

        const parsedItems = Array.isArray(items) ? items : [];
        const totalItems = parsedItems.length;
        const totalQuantity = parsedItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);

        const transfer = await prisma.stockTransfer.create({
            data: {
                userId: req.userId!,
                transferNumber,
                fromOutletId: Number(fromOutletId) || 0,
                toOutletId: Number(toOutletId) || 0,
                fromOutletName,
                toOutletName,
                items: parsedItems,
                totalItems,
                totalQuantity,
                transportMode: transportMode || null,
                vehicleNumber: vehicleNumber || null,
                driverName: driverName || null,
                notes: notes || null,
                transferDate: transferDate ? new Date(transferDate) : new Date(),
            },
        });

        res.status(201).json(transfer);
    } catch (err: any) {
        if (err.code === 'P2002') {
            res.status(409).json({ message: 'Transfer number conflict. Try again.' }); return;
        }
        res.status(500).json({ message: err.message });
    }
});

// ─── PATCH /stock-transfers/:id/status ──────────────────────
router.patch('/:id/status', async (req: AuthRequest, res) => {
    try {
        const { status, receivedBy } = req.body;
        const validStatuses = ['pending', 'in_transit', 'received', 'cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            return;
        }

        const existing = await prisma.stockTransfer.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) { res.status(404).json({ message: 'Transfer not found' }); return; }

        const data: any = { status };
        if (status === 'in_transit' && existing.status === 'pending') {
            data.status = 'in_transit';
        }
        if (status === 'received') {
            data.receivedDate = new Date();
            data.receivedBy = receivedBy || 'System';
        }

        const transfer = await prisma.stockTransfer.update({
            where: { id: Number(req.params.id) },
            data,
        });
        res.json(transfer);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── DELETE /stock-transfers/:id ────────────────────────────
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.stockTransfer.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) { res.status(404).json({ message: 'Transfer not found' }); return; }
        if (!['pending', 'cancelled'].includes(existing.status)) {
            res.status(400).json({ message: 'Only pending or cancelled transfers can be deleted' });
            return;
        }
        await prisma.stockTransfer.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
