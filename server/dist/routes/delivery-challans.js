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
// ─── GET /delivery-challans ─────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { status, limit = '50', offset = '0' } = req.query;
        const where = { userId: req.userId };
        if (status)
            where.status = String(status);
        const [challans, total] = await Promise.all([
            prisma_1.default.deliveryChallan.findMany({
                where,
                take: Number(limit),
                skip: Number(offset),
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.default.deliveryChallan.count({ where }),
        ]);
        res.json({ challans, total });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── GET /delivery-challans/:id ─────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const challan = await prisma_1.default.deliveryChallan.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!challan) {
            res.status(404).json({ message: 'Delivery challan not found' });
            return;
        }
        res.json(challan);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── POST /delivery-challans ────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const count = await prisma_1.default.deliveryChallan.count({ where: { userId: req.userId } });
        const challanNumber = `DC-${String(count + 1).padStart(5, '0')}`;
        const { clientId, challanType, items, subtotal, taxAmount, total, placeOfSupply, transportMode, vehicleNumber, transporterName, transporterGstin, distanceKm, issueDate, dueDate, notes, } = req.body;
        const challan = await prisma_1.default.deliveryChallan.create({
            data: {
                userId: req.userId,
                clientId: Number(clientId),
                challanNumber,
                challanType: challanType || 'supply',
                items: items || [],
                subtotal: subtotal || 0,
                taxAmount: taxAmount || 0,
                total: total || 0,
                placeOfSupply: placeOfSupply || null,
                transportMode: transportMode || null,
                vehicleNumber: vehicleNumber || null,
                transporterName: transporterName || null,
                transporterGstin: transporterGstin || null,
                distanceKm: distanceKm ? Number(distanceKm) : null,
                issueDate: issueDate ? new Date(issueDate) : new Date(),
                dueDate: dueDate ? new Date(dueDate) : null,
                notes: notes || null,
            },
        });
        res.status(201).json(challan);
    }
    catch (err) {
        if (err.code === 'P2002') {
            res.status(409).json({ message: 'Challan number already exists. Please try again.' });
            return;
        }
        res.status(500).json({ message: err.message });
    }
});
// ─── PUT /delivery-challans/:id ─────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const existing = await prisma_1.default.deliveryChallan.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) {
            res.status(404).json({ message: 'Delivery challan not found' });
            return;
        }
        if (!['draft'].includes(existing.status)) {
            res.status(400).json({ message: 'Only draft challans can be edited' });
            return;
        }
        const { clientId, challanType, items, subtotal, taxAmount, total, placeOfSupply, transportMode, vehicleNumber, transporterName, transporterGstin, distanceKm, dueDate, notes, } = req.body;
        const challan = await prisma_1.default.deliveryChallan.update({
            where: { id: Number(req.params.id) },
            data: {
                ...(clientId && { clientId: Number(clientId) }),
                ...(challanType && { challanType }),
                ...(items && { items }),
                ...(subtotal !== undefined && { subtotal }),
                ...(taxAmount !== undefined && { taxAmount }),
                ...(total !== undefined && { total }),
                ...(placeOfSupply !== undefined && { placeOfSupply: placeOfSupply || null }),
                ...(transportMode !== undefined && { transportMode: transportMode || null }),
                ...(vehicleNumber !== undefined && { vehicleNumber: vehicleNumber || null }),
                ...(transporterName !== undefined && { transporterName: transporterName || null }),
                ...(transporterGstin !== undefined && { transporterGstin: transporterGstin || null }),
                ...(distanceKm !== undefined && { distanceKm: distanceKm ? Number(distanceKm) : null }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(notes !== undefined && { notes: notes || null }),
            },
        });
        res.json(challan);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── PATCH /delivery-challans/:id/status ────────────────────
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['draft', 'sent', 'cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            return;
        }
        const challan = await prisma_1.default.deliveryChallan.update({
            where: { id: Number(req.params.id) },
            data: { status },
        });
        res.json(challan);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── POST /delivery-challans/:id/convert-to-invoice ─────────
// Convert a delivery challan to a tax invoice
router.post('/:id/convert-to-invoice', async (req, res) => {
    try {
        const challan = await prisma_1.default.deliveryChallan.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!challan) {
            res.status(404).json({ message: 'Delivery challan not found' });
            return;
        }
        if (challan.status === 'converted') {
            res.status(400).json({ message: 'Challan already converted to invoice' });
            return;
        }
        // Auto-generate invoice number
        const count = await prisma_1.default.invoice.count({ where: { userId: req.userId } });
        const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
        // Create invoice from challan data
        const invoice = await prisma_1.default.invoice.create({
            data: {
                userId: req.userId,
                clientId: challan.clientId,
                invoiceNumber,
                items: challan.items,
                subtotal: Number(challan.subtotal),
                taxAmount: Number(challan.taxAmount),
                total: Number(challan.total),
                dueDate: challan.dueDate || new Date(Date.now() + 30 * 86400000),
                issueDate: new Date(),
                placeOfSupply: challan.placeOfSupply,
                supplyType: challan.supplyType,
                transportMode: challan.transportMode,
                vehicleNumber: challan.vehicleNumber,
                transporterName: challan.transporterName,
                transporterGstin: challan.transporterGstin,
                distanceKm: challan.distanceKm,
                ewayBillNumber: challan.ewayBillNumber,
                notes: `Converted from Delivery Challan ${challan.challanNumber}`,
                status: 'draft',
            },
            include: { client: true },
        });
        // Mark challan as converted
        await prisma_1.default.deliveryChallan.update({
            where: { id: challan.id },
            data: {
                status: 'converted',
                convertedToInvoiceId: invoice.id,
            },
        });
        res.status(201).json({ invoice, message: `Converted to invoice ${invoiceNumber}` });
    }
    catch (err) {
        if (err.code === 'P2002') {
            res.status(409).json({ message: 'Invoice number conflict. Please try again.' });
            return;
        }
        res.status(500).json({ message: err.message });
    }
});
// ─── DELETE /delivery-challans/:id ──────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const existing = await prisma_1.default.deliveryChallan.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) {
            res.status(404).json({ message: 'Delivery challan not found' });
            return;
        }
        if (!['draft', 'cancelled'].includes(existing.status)) {
            res.status(400).json({ message: 'Only draft or cancelled challans can be deleted' });
            return;
        }
        await prisma_1.default.deliveryChallan.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=delivery-challans.js.map