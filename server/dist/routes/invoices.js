"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const XLSX = __importStar(require("xlsx"));
const payg_1 = require("../lib/payg");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// Multer memory storage for file uploads
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
// ─── POST /invoices/import ─────────────────────────────────
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (rows.length === 0) {
            res.status(400).json({ message: 'Excel file is empty' });
            return;
        }
        // Normalize column headers (case-insensitive matching)
        const normalizeKey = (key) => key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const getField = (row, ...names) => {
            for (const key of Object.keys(row)) {
                const nk = normalizeKey(key);
                for (const name of names) {
                    if (nk === normalizeKey(name))
                        return String(row[key]).trim();
                }
            }
            return '';
        };
        // Parse rows into structured data
        const parsedRows = rows.map((row, idx) => ({
            rowIndex: idx + 2, // +2 for header + 0-index
            clientName: getField(row, 'ClientName', 'Client Name', 'Client', 'Company', 'CustomerName', 'Customer Name', 'Customer'),
            clientEmail: getField(row, 'ClientEmail', 'Client Email', 'Email', 'CustomerEmail', 'Customer Email'),
            description: getField(row, 'Description', 'Item', 'ItemDescription', 'Item Description', 'Service', 'LineItem'),
            quantity: parseFloat(getField(row, 'Quantity', 'Qty', 'Units') || '1') || 1,
            unitPrice: parseFloat(getField(row, 'UnitPrice', 'Unit Price', 'Price', 'Rate', 'Amount') || '0') || 0,
            taxRate: parseFloat(getField(row, 'Tax', 'Tax%', 'TaxRate', 'Tax Rate', 'GST', 'VAT') || '0') || 0,
            dueDate: getField(row, 'DueDate', 'Due Date', 'Due', 'PaymentDue', 'Payment Due'),
            notes: getField(row, 'Notes', 'Note', 'Memo', 'Comments'),
        }));
        const errors = [];
        const validRows = parsedRows.filter(r => {
            if (!r.clientName) {
                errors.push(`Row ${r.rowIndex}: Missing client name`);
                return false;
            }
            if (!r.description) {
                errors.push(`Row ${r.rowIndex}: Missing description`);
                return false;
            }
            if (r.unitPrice <= 0) {
                errors.push(`Row ${r.rowIndex}: Invalid price`);
                return false;
            }
            return true;
        });
        // Group rows by clientName + dueDate → one invoice per group
        const groups = new Map();
        for (const row of validRows) {
            const key = `${row.clientName}|||${row.dueDate || 'default'}`;
            if (!groups.has(key))
                groups.set(key, []);
            groups.get(key).push(row);
        }
        // Resolve or create clients
        const clientCache = new Map();
        let clientsCreated = 0;
        for (const [key] of groups) {
            const clientName = key.split('|||')[0];
            if (clientCache.has(clientName))
                continue;
            // Find existing client by name
            const existing = await prisma_1.default.client.findFirst({
                where: { userId: req.userId, name: { equals: clientName, mode: 'insensitive' } },
            });
            if (existing) {
                clientCache.set(clientName, existing.id);
            }
            else {
                // Get email from first row with this client
                const firstRow = validRows.find(r => r.clientName === clientName);
                const newClient = await prisma_1.default.client.create({
                    data: {
                        userId: req.userId,
                        name: clientName,
                        contactEmail: firstRow?.clientEmail || `${clientName.toLowerCase().replace(/\s+/g, '.')}@imported.local`,
                    },
                });
                clientCache.set(clientName, newClient.id);
                clientsCreated++;
            }
        }
        // Create invoices
        let invoicesCreated = 0;
        const invoiceCount = await prisma_1.default.invoice.count({ where: { userId: req.userId } });
        let counter = invoiceCount + 1;
        for (const [key, groupRows] of groups) {
            const clientName = key.split('|||')[0];
            const clientId = clientCache.get(clientName);
            // Build invoice items
            const items = groupRows.map(r => ({
                description: r.description,
                quantity: r.quantity,
                unitPrice: r.unitPrice,
                total: r.quantity * r.unitPrice,
            }));
            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            const avgTaxRate = groupRows.reduce((sum, r) => sum + r.taxRate, 0) / groupRows.length;
            const taxAmount = subtotal * (avgTaxRate / 100);
            const total = subtotal + taxAmount;
            // Parse due date
            let dueDate;
            const rawDue = groupRows[0].dueDate;
            if (rawDue) {
                const parsed = new Date(rawDue);
                dueDate = isNaN(parsed.getTime()) ? new Date(Date.now() + 30 * 86400000) : parsed;
            }
            else {
                dueDate = new Date(Date.now() + 30 * 86400000); // Default 30 days
            }
            const invoiceNumber = `INV-${String(counter).padStart(5, '0')}`;
            counter++;
            // Check for duplicate invoice number
            const existing = await prisma_1.default.invoice.findUnique({ where: { invoiceNumber } });
            if (existing) {
                errors.push(`Invoice ${invoiceNumber} already exists, skipped`);
                continue;
            }
            const notes = groupRows.map(r => r.notes).filter(Boolean).join('; ');
            await prisma_1.default.invoice.create({
                data: {
                    userId: req.userId,
                    clientId,
                    invoiceNumber,
                    status: 'draft',
                    items: JSON.stringify(items),
                    subtotal,
                    taxAmount,
                    total,
                    dueDate,
                    notes: notes || undefined,
                },
            });
            invoicesCreated++;
        }
        res.json({
            success: true,
            summary: {
                totalRows: rows.length,
                validRows: validRows.length,
                invoicesCreated,
                clientsCreated,
                errors,
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── GET /invoices ──────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { clientId, status, limit = '50', offset = '0' } = req.query;
        const where = { userId: req.userId };
        if (clientId)
            where.clientId = Number(clientId);
        if (status)
            where.status = String(status);
        // Auto-detect overdue invoices
        await prisma_1.default.invoice.updateMany({
            where: {
                userId: req.userId,
                status: { in: ['sent', 'draft'] },
                dueDate: { lt: new Date() },
            },
            data: { status: 'overdue' },
        });
        const [invoices, total] = await Promise.all([
            prisma_1.default.invoice.findMany({
                where,
                take: Number(limit),
                skip: Number(offset),
                orderBy: { createdAt: 'desc' },
                include: { client: true, payments: true },
            }),
            prisma_1.default.invoice.count({ where }),
        ]);
        // Compute balance remaining for each invoice
        const enriched = invoices.map((inv) => {
            const totalPaid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            return {
                ...inv,
                amountPaid: totalPaid,
                balanceRemaining: Number(inv.total) - totalPaid,
            };
        });
        res.json({ invoices: enriched, total });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── GET /invoices/:id ──────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
            include: { client: true, payments: true },
        });
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        res.json({
            ...invoice,
            amountPaid: totalPaid,
            balanceRemaining: Number(invoice.total) - totalPaid,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── POST /invoices ─────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        // Check subscription limits
        const subscription = await prisma_1.default.subscription.findFirst({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
        });
        const planId = subscription?.plan || 'free';
        let isExpired = false;
        if (subscription?.plan === 'free_trial' && subscription.trialEndsAt) {
            if (new Date() > subscription.trialEndsAt) {
                isExpired = true;
                if (subscription.status === 'active') {
                    await prisma_1.default.subscription.update({
                        where: { id: subscription.id },
                        data: { status: 'expired' },
                    });
                }
            }
        }
        if (subscription?.status === 'expired' || isExpired) {
            res.status(403).json({ message: 'Your subscription has expired. Please upgrade or downgrade to the Free Tier.' });
            return;
        }
        const plan = payg_1.SUBSCRIPTION_PLANS.find(p => p.id === planId);
        const limit = plan?.limits?.invoicesPerMonth ?? 3; // Default to free tier limit
        if (limit !== -1) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const endOfMonth = new Date();
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            endOfMonth.setDate(0);
            endOfMonth.setHours(23, 59, 59, 999);
            const currentInvoicesCount = await prisma_1.default.invoice.count({
                where: {
                    userId: req.userId,
                    createdAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
            });
            if (currentInvoicesCount >= limit) {
                res.status(403).json({ message: `Monthly invoice limit reached. You can only create up to ${limit} invoices per month on the ${plan?.name || 'Free Tier'}. Please upgrade to create more.` });
                return;
            }
        }
        // Determine invoice type and number prefix
        const invoiceType = req.body.invoiceType || 'tax_invoice'; // tax_invoice, proforma, estimate
        const prefix = invoiceType === 'proforma' ? 'PI' : invoiceType === 'estimate' ? 'EST' : 'INV';
        // Auto-generate invoice number with appropriate prefix
        const count = await prisma_1.default.invoice.count({ where: { userId: req.userId } });
        const invoiceNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
        const { clientId, items, subtotal, tax, taxAmount, total, dueDate, issueDate, notes, contractId, placeOfSupply, ewayBillNumber, transportMode, vehicleNumber, transporterName, transporterGstin, distanceKm } = req.body;
        // Auto-detect supply type from GSTIN state codes
        let supplyType = 'intra';
        if (placeOfSupply) {
            // Get company GSTIN from settings
            const settings = await prisma_1.default.userSettings.findFirst({
                where: { userId: req.userId, category: 'branding' },
            });
            const branding = settings?.settings || {};
            const companyStateCode = branding.gstin?.substring(0, 2) || '';
            if (companyStateCode && placeOfSupply !== companyStateCode) {
                supplyType = 'inter';
            }
        }
        const invoice = await prisma_1.default.invoice.create({
            data: {
                userId: req.userId,
                clientId: Number(clientId),
                contractId: contractId ? Number(contractId) : undefined,
                invoiceNumber,
                invoiceType,
                items: items || [],
                subtotal: subtotal || 0,
                taxAmount: tax || taxAmount || 0,
                total: total || 0,
                dueDate: new Date(dueDate),
                issueDate: issueDate ? new Date(issueDate) : new Date(),
                notes: notes || null,
                status: 'draft',
                placeOfSupply: placeOfSupply || null,
                supplyType,
                // E-Way Bill fields
                ewayBillNumber: ewayBillNumber || null,
                transportMode: transportMode || null,
                vehicleNumber: vehicleNumber || null,
                transporterName: transporterName || null,
                transporterGstin: transporterGstin || null,
                distanceKm: distanceKm ? Number(distanceKm) : null,
            },
            include: { client: true },
        });
        res.status(201).json(invoice);
    }
    catch (err) {
        // Handle duplicate invoice number gracefully
        if (err.code === 'P2002') {
            res.status(409).json({ message: 'Invoice number already exists. Please try again.' });
            return;
        }
        res.status(500).json({ message: err.message });
    }
});
// ─── PUT /invoices/:id ──────────────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const existing = await prisma_1.default.invoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        if (existing.status !== 'draft') {
            res.status(400).json({ message: 'Only draft invoices can be edited' });
            return;
        }
        const { clientId, items, subtotal, tax, taxAmount, total, dueDate, notes, ewayBillNumber, transportMode, vehicleNumber, transporterName, transporterGstin, distanceKm } = req.body;
        const invoice = await prisma_1.default.invoice.update({
            where: { id: Number(req.params.id) },
            data: {
                ...(clientId && { clientId: Number(clientId) }),
                ...(items && { items }),
                ...(subtotal !== undefined && { subtotal }),
                ...(total !== undefined && { total }),
                ...((tax !== undefined || taxAmount !== undefined) && { taxAmount: tax || taxAmount }),
                ...(dueDate && { dueDate: new Date(dueDate) }),
                ...(notes !== undefined && { notes }),
                // E-Way Bill fields
                ...(ewayBillNumber !== undefined && { ewayBillNumber: ewayBillNumber || null }),
                ...(transportMode !== undefined && { transportMode: transportMode || null }),
                ...(vehicleNumber !== undefined && { vehicleNumber: vehicleNumber || null }),
                ...(transporterName !== undefined && { transporterName: transporterName || null }),
                ...(transporterGstin !== undefined && { transporterGstin: transporterGstin || null }),
                ...(distanceKm !== undefined && { distanceKm: distanceKm ? Number(distanceKm) : null }),
            },
            include: { client: true },
        });
        res.json(invoice);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── DELETE /invoices/:id ───────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const existing = await prisma_1.default.invoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!existing) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        if (!['draft', 'cancelled'].includes(existing.status)) {
            res.status(400).json({ message: 'Only draft or cancelled invoices can be deleted' });
            return;
        }
        await prisma_1.default.invoice.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── PATCH /invoices/:id/status ─────────────────────────────
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            return;
        }
        const data = { status };
        if (status === 'paid')
            data.paidDate = new Date();
        // Generate e-invoice data when sending
        if (status === 'sent') {
            data.sentAt = new Date();
            // Generate IRN (Invoice Reference Number) — SHA256 hash of key invoice fields
            const existing = await prisma_1.default.invoice.findFirst({
                where: { id: Number(req.params.id), userId: req.userId },
                include: { client: true },
            });
            if (existing && !existing.irn) {
                // Create a deterministic IRN from invoice data
                const irnInput = `${existing.invoiceNumber}|${existing.userId}|${existing.clientId}|${existing.total}|${existing.issueDate.toISOString()}`;
                let hash = 0;
                for (let i = 0; i < irnInput.length; i++) {
                    const char = irnInput.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convert to 32bit integer
                }
                const irn = Math.abs(hash).toString(16).padStart(16, '0').toUpperCase() +
                    Date.now().toString(16).toUpperCase();
                data.irn = irn;
                data.eInvoiceData = {
                    ackNo: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
                    ackDate: new Date().toISOString().split('T')[0],
                    irn,
                    // QR code is generated client-side using the IRN
                    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(JSON.stringify({
                        irn,
                        invoiceNumber: existing.invoiceNumber,
                        sellerGstin: '', // Will be filled from settings
                        buyerGstin: existing.client?.gstin || '',
                        total: Number(existing.total),
                        date: existing.issueDate.toISOString().split('T')[0],
                    }))}`,
                };
            }
        }
        const invoice = await prisma_1.default.invoice.update({
            where: { id: Number(req.params.id) },
            data,
            include: { client: true },
        });
        res.json(invoice);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── POST /invoices/:id/credit-note ─────────────────────────
router.post('/:id/credit-note', async (req, res) => {
    try {
        const original = await prisma_1.default.invoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
        });
        if (!original) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        const count = await prisma_1.default.invoice.count({ where: { userId: req.userId } });
        const invoiceNumber = `CN-${String(count + 1).padStart(5, '0')}`;
        const creditNote = await prisma_1.default.invoice.create({
            data: {
                userId: req.userId,
                clientId: original.clientId,
                contractId: original.contractId,
                invoiceNumber,
                items: original.items,
                subtotal: -Number(original.subtotal),
                taxAmount: -Number(original.taxAmount),
                total: -Number(original.total),
                dueDate: new Date(),
                issueDate: new Date(),
                notes: `Credit note for invoice ${original.invoiceNumber}`,
                status: 'paid',
                paidDate: new Date(),
            },
            include: { client: true },
        });
        res.status(201).json(creditNote);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── GET /invoices/overdue/check ────────────────────────────
router.get('/overdue/check', async (req, res) => {
    try {
        const result = await prisma_1.default.invoice.updateMany({
            where: {
                userId: req.userId,
                status: { in: ['sent', 'draft'] },
                dueDate: { lt: new Date() },
            },
            data: { status: 'overdue' },
        });
        res.json({ updated: result.count, message: `${result.count} invoices marked as overdue` });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── POST /invoices/:id/convert-to-tax-invoice ──────────────
// Convert a proforma/estimate to a tax invoice
router.post('/:id/convert-to-tax-invoice', async (req, res) => {
    try {
        const proforma = await prisma_1.default.invoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
            include: { client: true },
        });
        if (!proforma) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        if (proforma.invoiceType === 'tax_invoice') {
            res.status(400).json({ message: 'This is already a tax invoice' });
            return;
        }
        const count = await prisma_1.default.invoice.count({ where: { userId: req.userId } });
        const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
        const taxInvoice = await prisma_1.default.invoice.create({
            data: {
                userId: req.userId,
                clientId: proforma.clientId,
                contractId: proforma.contractId,
                invoiceNumber,
                invoiceType: 'tax_invoice',
                items: proforma.items,
                subtotal: Number(proforma.subtotal),
                taxAmount: Number(proforma.taxAmount),
                total: Number(proforma.total),
                placeOfSupply: proforma.placeOfSupply,
                supplyType: proforma.supplyType,
                transportMode: proforma.transportMode,
                vehicleNumber: proforma.vehicleNumber,
                transporterName: proforma.transporterName,
                transporterGstin: proforma.transporterGstin,
                distanceKm: proforma.distanceKm,
                dueDate: proforma.dueDate,
                issueDate: new Date(),
                notes: `Converted from ${proforma.invoiceType === 'proforma' ? 'Proforma' : 'Estimate'} ${proforma.invoiceNumber}`,
                status: 'draft',
            },
            include: { client: true },
        });
        // Mark original as converted
        await prisma_1.default.invoice.update({
            where: { id: proforma.id },
            data: { status: 'cancelled', notes: `Converted to tax invoice ${invoiceNumber}. ${proforma.notes || ''}` },
        });
        res.status(201).json({
            invoice: taxInvoice,
            message: `Converted to tax invoice ${invoiceNumber}`,
        });
    }
    catch (err) {
        if (err.code === 'P2002') {
            res.status(409).json({ message: 'Invoice number conflict. Please try again.' });
            return;
        }
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=invoices.js.map