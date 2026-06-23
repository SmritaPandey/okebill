import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /credit-notes — List credit/debit notes
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { search, type, status, limit, offset } = req.query;
        const where: any = { userId: req.userId };

        if (search) {
            where.OR = [
                { creditNoteNumber: { contains: String(search), mode: 'insensitive' } },
                { reason: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        if (type && type !== 'all') where.type = String(type);
        if (status && status !== 'all') where.status = String(status);

        const [creditNotes, total] = await Promise.all([
            prisma.creditNote.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit ? Number(limit) : 50,
                skip: offset ? Number(offset) : 0,
            }),
            prisma.creditNote.count({ where }),
        ]);

        res.json({ creditNotes, total });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// GET /credit-notes/summary — Stats
router.get('/summary', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const allNotes = await prisma.creditNote.findMany({
            where: { userId: req.userId },
            select: { type: true, total: true, status: true },
        });

        const creditNotes = allNotes.filter(n => n.type === 'credit');
        const debitNotes = allNotes.filter(n => n.type === 'debit');

        res.json({
            creditNotesCount: creditNotes.length,
            creditNotesTotal: creditNotes.reduce((s, n) => s + Number(n.total), 0),
            creditNotesApplied: creditNotes.filter(n => n.status === 'applied').length,
            creditNotesPending: creditNotes.filter(n => n.status === 'draft' || n.status === 'issued').length,
            debitNotesCount: debitNotes.length,
            debitNotesTotal: debitNotes.reduce((s, n) => s + Number(n.total), 0),
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// GET /credit-notes/:id — Get single
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const note = await prisma.creditNote.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!note) return res.status(404).json({ message: 'Credit note not found' });
        res.json(note);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /credit-notes — Create
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { clientId, invoiceId, type, items, subtotal, taxAmount, total, reason, status, notes } = req.body;

        // Auto-generate number
        const count = await prisma.creditNote.count({ where: { userId: req.userId } });
        const prefix = (type === 'debit') ? 'DN' : 'CN';
        const creditNoteNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;

        const note = await prisma.creditNote.create({
            data: {
                userId: req.userId!,
                clientId: clientId ? Number(clientId) : null,
                invoiceId: invoiceId ? Number(invoiceId) : null,
                creditNoteNumber,
                type: type || 'credit',
                items: items || [],
                subtotal: subtotal || 0,
                taxAmount: taxAmount || 0,
                total: total || 0,
                reason,
                status: status || 'draft',
                notes,
            },
        });

        res.status(201).json(note);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /credit-notes/:id — Update
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.creditNote.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) return res.status(404).json({ message: 'Credit note not found' });

        const note = await prisma.creditNote.update({
            where: { id: existing.id },
            data: {
                ...(req.body.clientId !== undefined && { clientId: req.body.clientId }),
                ...(req.body.invoiceId !== undefined && { invoiceId: req.body.invoiceId }),
                ...(req.body.items && { items: req.body.items }),
                ...(req.body.subtotal !== undefined && { subtotal: req.body.subtotal }),
                ...(req.body.taxAmount !== undefined && { taxAmount: req.body.taxAmount }),
                ...(req.body.total !== undefined && { total: req.body.total }),
                ...(req.body.reason !== undefined && { reason: req.body.reason }),
                ...(req.body.status && { status: req.body.status }),
                ...(req.body.notes !== undefined && { notes: req.body.notes }),
            },
        });

        res.json(note);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /credit-notes/:id/status — Change status
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { status } = req.body;
        if (!['draft', 'issued', 'applied', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const existing = await prisma.creditNote.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) return res.status(404).json({ message: 'Credit note not found' });

        const note = await prisma.creditNote.update({
            where: { id: existing.id },
            data: { status },
        });

        res.json(note);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /credit-notes/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const existing = await prisma.creditNote.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) return res.status(404).json({ message: 'Credit note not found' });

        await prisma.creditNote.delete({ where: { id: existing.id } });
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
