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
// GET /inventory/stock-levels
// Returns data in the shape the frontend expects:
// { items: [{ productId, productName, sku, outletId, outletName, totalQuantity, availableQuantity, reservedQuantity, batches[], lowStockAlert, expiryAlert }], total }
router.get('/stock-levels', async (req, res) => {
    try {
        const { tenantId, productId, outletId, lowStockOnly, expiringOnly, limit = '50', offset = '0' } = req.query;
        const where = {};
        if (tenantId)
            where.tenantId = Number(tenantId);
        if (productId)
            where.productId = Number(productId);
        if (outletId)
            where.outletId = Number(outletId);
        if (lowStockOnly === 'true')
            where.quantity = { lte: 10 };
        if (expiringOnly === 'true') {
            const thirtyDays = new Date();
            thirtyDays.setDate(thirtyDays.getDate() + 30);
            where.expiryDate = { lte: thirtyDays, not: null };
        }
        const [rawItems, total] = await Promise.all([
            prisma_1.default.inventory.findMany({
                where,
                take: Number(limit),
                skip: Number(offset),
                include: { product: true, outlet: true },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma_1.default.inventory.count({ where }),
        ]);
        // Transform raw Prisma records into the shape the frontend expects
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() + 30);
        const items = rawItems.map((item) => {
            const qty = Number(item.quantity);
            const reserved = Number(item.reservedQuantity);
            const reorderLevel = item.product?.trackingSettings?.reorderLevel ?? 10;
            const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
            return {
                productId: item.productId,
                productName: item.product?.name || 'Unknown Product',
                sku: item.product?.sku || '',
                category: item.product?.category || '',
                outletId: item.outletId,
                outletName: item.outlet?.name || 'Unknown Outlet',
                totalQuantity: qty,
                availableQuantity: qty - reserved,
                reservedQuantity: reserved,
                costPrice: Number(item.costPrice),
                sellingPrice: Number(item.sellingPrice),
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,
                lowStockAlert: qty <= reorderLevel,
                expiryAlert: expiryDate ? expiryDate <= thirtyDays : false,
                batches: [{
                        quantity: qty,
                        batchNumber: item.batchNumber,
                        expiryDate: item.expiryDate,
                    }],
                status: item.status,
                updatedAt: item.updatedAt,
            };
        });
        res.json({ items, total });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /inventory/stock
router.post('/stock', async (req, res) => {
    try {
        const stock = await prisma_1.default.inventory.create({ data: req.body });
        res.status(201).json(stock);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /inventory/adjust
router.post('/adjust', async (req, res) => {
    try {
        const { tenantId, productId, outletId, adjustmentType, quantity, batchNumber } = req.body;
        const existing = await prisma_1.default.inventory.findFirst({ where: { tenantId, productId, outletId, batchNumber: batchNumber || null } });
        if (!existing) {
            res.status(404).json({ message: 'Inventory record not found' });
            return;
        }
        const newQty = adjustmentType === 'add' || adjustmentType === 'increase'
            ? Number(existing.quantity) + Number(quantity)
            : adjustmentType === 'set'
                ? Number(quantity)
                : Number(existing.quantity) - Number(quantity);
        const updated = await prisma_1.default.inventory.update({ where: { id: existing.id }, data: { quantity: Math.max(0, newQty) } });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=inventory.js.map