"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /dashboard/overview
router.get('/overview', auth_1.authMiddleware, async (req, res) => {
    try {
        const { tenantId, dateFrom, dateTo } = req.query;
        // Billing dashboard (user-scoped)
        const [totalClients, totalProposals, totalInvoices, totalPayments, invoices, recentInvoices] = await Promise.all([
            prisma_1.default.client.count({ where: { userId: req.userId } }),
            prisma_1.default.proposal.count({ where: { userId: req.userId } }),
            prisma_1.default.invoice.count({ where: { userId: req.userId } }),
            prisma_1.default.payment.count({ where: { userId: req.userId } }),
            prisma_1.default.invoice.findMany({ where: { userId: req.userId }, select: { total: true, status: true } }),
            prisma_1.default.invoice.findMany({ where: { userId: req.userId }, take: 5, orderBy: { createdAt: 'desc' }, include: { client: true } }),
        ]);
        const totalRevenue = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + Number(inv.total), 0);
        const pendingRevenue = invoices
            .filter(inv => inv.status === 'pending' || inv.status === 'sent')
            .reduce((sum, inv) => sum + Number(inv.total), 0);
        // Commerce dashboard (tenant-scoped)
        let commerceData = {};
        if (tenantId) {
            const tid = Number(tenantId);
            const txnWhere = { tenantId: tid };
            if (dateFrom)
                txnWhere.transactionDate = { gte: new Date(String(dateFrom)) };
            if (dateTo)
                txnWhere.transactionDate = { ...txnWhere.transactionDate, lte: new Date(String(dateTo)) };
            const [productCount, customerCount, lowStockCount, transactions, recentTransactions] = await Promise.all([
                prisma_1.default.product.count({ where: { tenantId: tid } }),
                prisma_1.default.customer.count({ where: { tenantId: tid } }),
                prisma_1.default.inventory.count({ where: { tenantId: tid, quantity: { lte: 10 } } }),
                prisma_1.default.transaction.findMany({ where: txnWhere, select: { totalAmount: true } }),
                prisma_1.default.transaction.findMany({ where: { tenantId: tid }, take: 5, orderBy: { createdAt: 'desc' }, include: { customer: true } }),
            ]);
            commerceData = {
                productCount,
                activeCustomers: customerCount,
                lowStockCount,
                totalTransactions: transactions.length,
                totalRevenue: transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0),
                recentTransactions,
            };
        }
        res.json({
            totalRevenue,
            pendingRevenue,
            totalClients,
            totalProposals,
            totalInvoices,
            totalPayments,
            recentInvoices,
            ...commerceData,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /analytics/dashboard
router.get('/dashboard', auth_1.authMiddleware, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [invoices, payments] = await Promise.all([
            prisma_1.default.invoice.findMany({ where: { userId: req.userId, createdAt: { gte: thirtyDaysAgo } }, select: { total: true, status: true, createdAt: true } }),
            prisma_1.default.payment.findMany({ where: { userId: req.userId, createdAt: { gte: thirtyDaysAgo } }, select: { amount: true, createdAt: true } }),
        ]);
        res.json({
            invoiceCount: invoices.length,
            totalInvoiced: invoices.reduce((sum, i) => sum + Number(i.total), 0),
            totalCollected: payments.reduce((sum, p) => sum + Number(p.amount), 0),
            invoices,
            payments,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /analytics/reports
router.get('/reports', auth_1.authMiddleware, async (req, res) => {
    try {
        const { reportType, startDate, endDate, clientId } = req.query;
        const where = { userId: req.userId };
        if (startDate)
            where.createdAt = { gte: new Date(String(startDate)) };
        if (endDate)
            where.createdAt = { ...where.createdAt, lte: new Date(String(endDate)) };
        if (clientId)
            where.clientId = Number(clientId);
        let data = {};
        switch (reportType) {
            case 'revenue':
                data = await prisma_1.default.invoice.findMany({ where: { ...where, status: 'paid' }, include: { client: true }, orderBy: { paidDate: 'desc' } });
                break;
            case 'outstanding':
                data = await prisma_1.default.invoice.findMany({ where: { ...where, status: { in: ['pending', 'sent', 'overdue'] } }, include: { client: true } });
                break;
            case 'clients':
                data = await prisma_1.default.client.findMany({ where: { userId: req.userId }, include: { invoices: true, proposals: true } });
                break;
            default:
                data = await prisma_1.default.invoice.findMany({ where, include: { client: true } });
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ═══════════════════════════════════════════════════════════
// KPI — Pre-computed with MoM comparison
// ═══════════════════════════════════════════════════════════
router.get('/kpi', auth_1.authMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const [totalClients, lastMonthClients, totalInvoices, lastMonthInvoices, allInvoices, thisMonthPayments, lastMonthPayments,] = await Promise.all([
            prisma_1.default.client.count({ where: { userId: req.userId } }),
            prisma_1.default.client.count({ where: { userId: req.userId, createdAt: { lt: thisMonthStart } } }),
            prisma_1.default.invoice.count({ where: { userId: req.userId } }),
            prisma_1.default.invoice.count({ where: { userId: req.userId, createdAt: { lt: thisMonthStart } } }),
            prisma_1.default.invoice.findMany({ where: { userId: req.userId }, select: { total: true, status: true, dueDate: true, taxAmount: true, supplyType: true } }),
            prisma_1.default.payment.findMany({ where: { userId: req.userId, createdAt: { gte: thisMonthStart } }, select: { amount: true } }),
            prisma_1.default.payment.findMany({ where: { userId: req.userId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }, select: { amount: true } }),
        ]);
        const thisMonthRevenue = thisMonthPayments.reduce((s, p) => s + Number(p.amount), 0);
        const lastMonthRevenue = lastMonthPayments.reduce((s, p) => s + Number(p.amount), 0);
        const revenueChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
        const outstanding = allInvoices
            .filter(i => ['sent', 'pending', 'overdue'].includes(i.status))
            .reduce((s, i) => s + Number(i.total), 0);
        const overdue = allInvoices.filter(i => i.status === 'overdue' || (i.dueDate < now && ['sent', 'pending'].includes(i.status)));
        const overdueAmount = overdue.reduce((s, i) => s + Number(i.total), 0);
        // GST Liability
        const paidInvoicesThisMonth = allInvoices.filter(i => i.status === 'paid');
        const totalTax = paidInvoicesThisMonth.reduce((s, i) => s + Number(i.taxAmount), 0);
        const cgst = allInvoices.filter(i => i.supplyType !== 'inter').reduce((s, i) => s + Number(i.taxAmount) / 2, 0);
        const sgst = cgst;
        const igst = allInvoices.filter(i => i.supplyType === 'inter').reduce((s, i) => s + Number(i.taxAmount), 0);
        res.json({
            totalClients,
            clientsChange: totalClients - lastMonthClients,
            revenueThisMonth: thisMonthRevenue,
            revenueChange: Math.round(revenueChange * 10) / 10,
            outstanding,
            overdueCount: overdue.length,
            overdueAmount,
            totalInvoices,
            invoicesChange: totalInvoices - lastMonthInvoices,
            gstLiability: { total: totalTax, cgst, sgst, igst },
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ═══════════════════════════════════════════════════════════
// AGING ANALYSIS — Invoice aging buckets
// ═══════════════════════════════════════════════════════════
router.get('/aging', auth_1.authMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const unpaidInvoices = await prisma_1.default.invoice.findMany({
            where: { userId: req.userId, status: { in: ['sent', 'pending', 'overdue'] } },
            include: { client: true },
            orderBy: { dueDate: 'asc' },
        });
        const buckets = { current: [], '0_30': [], '30_60': [], '60_90': [], '90_plus': [] };
        unpaidInvoices.forEach(inv => {
            const daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000));
            const entry = {
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                clientName: inv.client.name,
                total: Number(inv.total),
                dueDate: inv.dueDate,
                daysOverdue,
            };
            if (new Date(inv.dueDate) > now)
                buckets.current.push(entry);
            else if (daysOverdue <= 30)
                buckets['0_30'].push(entry);
            else if (daysOverdue <= 60)
                buckets['30_60'].push(entry);
            else if (daysOverdue <= 90)
                buckets['60_90'].push(entry);
            else
                buckets['90_plus'].push(entry);
        });
        const totals = {
            current: buckets.current.reduce((s, i) => s + i.total, 0),
            '0_30': buckets['0_30'].reduce((s, i) => s + i.total, 0),
            '30_60': buckets['30_60'].reduce((s, i) => s + i.total, 0),
            '60_90': buckets['60_90'].reduce((s, i) => s + i.total, 0),
            '90_plus': buckets['90_plus'].reduce((s, i) => s + i.total, 0),
        };
        res.json({ buckets, totals, totalOutstanding: Object.values(totals).reduce((a, b) => a + b, 0) });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ═══════════════════════════════════════════════════════════
// CASH FLOW — 30/60/90 day projection
// ═══════════════════════════════════════════════════════════
router.get('/cashflow', auth_1.authMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const future30 = new Date(now.getTime() + 30 * 86400000);
        const future60 = new Date(now.getTime() + 60 * 86400000);
        const future90 = new Date(now.getTime() + 90 * 86400000);
        const unpaid = await prisma_1.default.invoice.findMany({
            where: { userId: req.userId, status: { in: ['sent', 'pending'] } },
            select: { total: true, dueDate: true },
        });
        const next30 = unpaid.filter(i => i.dueDate <= future30).reduce((s, i) => s + Number(i.total), 0);
        const next60 = unpaid.filter(i => i.dueDate > future30 && i.dueDate <= future60).reduce((s, i) => s + Number(i.total), 0);
        const next90 = unpaid.filter(i => i.dueDate > future60 && i.dueDate <= future90).reduce((s, i) => s + Number(i.total), 0);
        const beyond = unpaid.filter(i => i.dueDate > future90).reduce((s, i) => s + Number(i.total), 0);
        // Historical monthly revenue (last 12 months)
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        const payments = await prisma_1.default.payment.findMany({
            where: { userId: req.userId, createdAt: { gte: yearAgo } },
            select: { amount: true, createdAt: true },
        });
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyRevenue = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthPayments = payments.filter(p => {
                const pd = new Date(p.createdAt);
                return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
            });
            monthlyRevenue.push({
                month: months[d.getMonth()],
                year: d.getFullYear(),
                revenue: monthPayments.reduce((s, p) => s + Number(p.amount), 0),
            });
        }
        res.json({
            projection: { next30, next60, next90, beyond, total: next30 + next60 + next90 + beyond },
            monthlyRevenue,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ═══════════════════════════════════════════════════════════
// TOP CLIENTS — Revenue by client
// ═══════════════════════════════════════════════════════════
router.get('/top-clients', auth_1.authMiddleware, async (req, res) => {
    try {
        const clients = await prisma_1.default.client.findMany({
            where: { userId: req.userId },
            include: {
                invoices: { where: { status: 'paid' }, select: { total: true } },
                _count: { select: { invoices: true } },
            },
        });
        const ranked = clients
            .map(c => ({
            id: c.id,
            name: c.name,
            totalRevenue: c.invoices.reduce((s, i) => s + Number(i.total), 0),
            invoiceCount: c._count.invoices,
        }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 10);
        res.json({ clients: ranked });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ═══════════════════════════════════════════════════════════
// GST SUMMARY — Monthly GST breakup
// ═══════════════════════════════════════════════════════════
router.get('/gst-summary', auth_1.authMiddleware, async (req, res) => {
    try {
        const { month, year } = req.query;
        const m = month ? Number(String(month)) : new Date().getMonth() + 1;
        const y = year ? Number(String(year)) : new Date().getFullYear();
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);
        const invoices = await prisma_1.default.invoice.findMany({
            where: {
                userId: req.userId,
                issueDate: { gte: startDate, lte: endDate },
                status: { in: ['sent', 'paid', 'overdue'] },
            },
            select: { subtotal: true, taxAmount: true, total: true, supplyType: true },
        });
        const totalTaxable = invoices.reduce((s, i) => s + Number(i.subtotal), 0);
        const totalTax = invoices.reduce((s, i) => s + Number(i.taxAmount), 0);
        const interInvoices = invoices.filter(i => i.supplyType === 'inter');
        const intraInvoices = invoices.filter(i => i.supplyType !== 'inter');
        const igst = interInvoices.reduce((s, i) => s + Number(i.taxAmount), 0);
        const cgst = intraInvoices.reduce((s, i) => s + Number(i.taxAmount) / 2, 0);
        const sgst = cgst;
        res.json({
            period: `${months[m - 1] || ''} ${y}`,
            invoiceCount: invoices.length,
            totalTaxable,
            totalTax,
            cgst,
            sgst,
            igst,
            totalInvoiceValue: invoices.reduce((s, i) => s + Number(i.total), 0),
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
exports.default = router;
//# sourceMappingURL=dashboard.js.map