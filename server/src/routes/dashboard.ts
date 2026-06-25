import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /dashboard/overview
router.get('/overview', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { tenantId, dateFrom, dateTo } = req.query;

        // Billing dashboard (user-scoped)
        const [totalClients, totalProposals, totalInvoices, totalPayments, invoices, recentInvoices] = await Promise.all([
            prisma.client.count({ where: { userId: req.userId } }),
            prisma.proposal.count({ where: { userId: req.userId } }),
            prisma.invoice.count({ where: { userId: req.userId } }),
            prisma.payment.count({ where: { userId: req.userId } }),
            prisma.invoice.findMany({ where: { userId: req.userId }, select: { total: true, status: true } }),
            prisma.invoice.findMany({ where: { userId: req.userId }, take: 5, orderBy: { createdAt: 'desc' }, include: { client: true } }),
        ]);

        const totalRevenue = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + Number(inv.total), 0);

        const pendingRevenue = invoices
            .filter(inv => inv.status === 'pending' || inv.status === 'sent')
            .reduce((sum, inv) => sum + Number(inv.total), 0);

        // Commerce dashboard (tenant-scoped)
        let commerceData: any = {};
        if (tenantId) {
            const tid = Number(tenantId);
            const txnWhere: any = { tenantId: tid };
            if (dateFrom) txnWhere.transactionDate = { gte: new Date(String(dateFrom)) };
            if (dateTo) txnWhere.transactionDate = { ...txnWhere.transactionDate, lte: new Date(String(dateTo)) };

            const [productCount, customerCount, lowStockCount, transactions, recentTransactions] = await Promise.all([
                prisma.product.count({ where: { tenantId: tid } }),
                prisma.customer.count({ where: { tenantId: tid } }),
                prisma.inventory.count({ where: { tenantId: tid, quantity: { lte: 10 } } }),
                prisma.transaction.findMany({ where: txnWhere, select: { totalAmount: true } }),
                prisma.transaction.findMany({ where: { tenantId: tid }, take: 5, orderBy: { createdAt: 'desc' }, include: { customer: true } }),
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
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /analytics/dashboard
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [invoices, payments] = await Promise.all([
            prisma.invoice.findMany({ where: { userId: req.userId, createdAt: { gte: thirtyDaysAgo } }, select: { total: true, status: true, createdAt: true } }),
            prisma.payment.findMany({ where: { userId: req.userId, createdAt: { gte: thirtyDaysAgo } }, select: { amount: true, createdAt: true } }),
        ]);

        res.json({
            invoiceCount: invoices.length,
            totalInvoiced: invoices.reduce((sum, i) => sum + Number(i.total), 0),
            totalCollected: payments.reduce((sum, p) => sum + Number(p.amount), 0),
            invoices,
            payments,
        });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /analytics/reports
router.get('/reports', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { reportType, startDate, endDate, clientId } = req.query;
        const start = startDate ? new Date(String(startDate)) : new Date(0);
        const end = endDate ? new Date(String(endDate)) : new Date();

        let data: any = {
            reportType,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        };

        const whereInvoice: any = {
            userId: req.userId,
            createdAt: { gte: start, lte: end },
        };
        if (clientId) whereInvoice.clientId = Number(clientId);

        switch (reportType) {
            case 'sales_summary': {
                const invoices = await prisma.invoice.findMany({
                    where: whereInvoice,
                    include: { client: true },
                    orderBy: { createdAt: 'desc' }
                });

                const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
                const totalTax = invoices.reduce((sum, inv) => sum + Number(inv.taxAmount), 0);
                const paidSales = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total), 0);
                const pendingSales = invoices.filter(inv => ['pending', 'sent'].includes(inv.status)).reduce((sum, inv) => sum + Number(inv.total), 0);
                const overdueSales = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + Number(inv.total), 0);

                data.summary = {
                    totalSales,
                    totalTax,
                    paidSales,
                    pendingSales,
                    overdueSales,
                    count: invoices.length,
                    averageInvoiceValue: invoices.length > 0 ? totalSales / invoices.length : 0,
                };
                data.details = invoices.map(inv => ({
                    id: inv.id,
                    invoiceNumber: inv.invoiceNumber,
                    clientName: inv.client.name,
                    total: Number(inv.total),
                    taxAmount: Number(inv.taxAmount),
                    status: inv.status,
                    date: inv.createdAt.toISOString()
                }));
                break;
            }

            case 'inventory_report': {
                const products = await prisma.product.findMany({
                    include: { inventory: true }
                });

                const details = products.map(prod => {
                    const totalQty = prod.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);
                    const avgCost = prod.inventory.length > 0 ? prod.inventory.reduce((sum, inv) => sum + Number(inv.costPrice || 0), 0) / prod.inventory.length : 0;
                    const avgPrice = prod.inventory.length > 0 ? prod.inventory.reduce((sum, inv) => sum + Number(inv.sellingPrice || 0), 0) / prod.inventory.length : 0;
                    return {
                        id: prod.id,
                        sku: prod.sku,
                        name: prod.name,
                        category: prod.category || 'N/A',
                        stock: totalQty,
                        costPrice: avgCost,
                        sellingPrice: avgPrice,
                        valuation: totalQty * avgCost,
                        status: prod.status
                    };
                });

                const totalValuation = details.reduce((sum, d) => sum + d.valuation, 0);
                const totalItems = details.reduce((sum, d) => sum + d.stock, 0);

                data.summary = {
                    totalProducts: products.length,
                    totalItemsInStock: totalItems,
                    totalValuation,
                    lowStockCount: details.filter(d => d.stock < 10).length,
                };
                data.details = details;
                break;
            }

            case 'customer_analysis': {
                const clients = await prisma.client.findMany({
                    where: { userId: req.userId },
                    include: { invoices: true }
                });

                const details = clients.map(client => {
                    const clientInvoices = client.invoices.filter(inv => inv.createdAt >= start && inv.createdAt <= end);
                    const totalRevenue = clientInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total), 0);
                    const outstanding = clientInvoices.filter(inv => ['pending', 'sent', 'overdue'].includes(inv.status)).reduce((sum, inv) => sum + Number(inv.total), 0);
                    return {
                        id: client.id,
                        name: client.name,
                        email: client.contactEmail,
                        phone: client.phone || 'N/A',
                        totalInvoices: clientInvoices.length,
                        revenueContributed: totalRevenue,
                        outstandingBalance: outstanding,
                        averageOrderValue: clientInvoices.length > 0 ? (totalRevenue + outstanding) / clientInvoices.length : 0
                    };
                });

                data.summary = {
                    totalCustomers: clients.length,
                    activeCustomers: details.filter(d => d.totalInvoices > 0).length,
                    totalRevenue: details.reduce((sum, d) => sum + d.revenueContributed, 0),
                    totalOutstanding: details.reduce((sum, d) => sum + d.outstandingBalance, 0),
                };
                data.details = details;
                break;
            }

            case 'financial_summary': {
                const invoices = await prisma.invoice.findMany({
                    where: whereInvoice
                });

                const expenses = await prisma.expense.findMany({
                    where: {
                        userId: req.userId,
                        date: { gte: start, lte: end }
                    }
                });

                const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total), 0);
                const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
                const netProfit = totalRevenue - totalExpenses;

                data.summary = {
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                    profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
                    invoiceCount: invoices.length,
                    expenseCount: expenses.length
                };
                
                data.details = {
                    revenueItems: invoices.map(inv => ({
                        id: inv.id,
                        type: 'revenue',
                        reference: inv.invoiceNumber,
                        description: `Invoice Payment`,
                        amount: Number(inv.total),
                        date: inv.createdAt.toISOString()
                    })),
                    expenseItems: expenses.map(exp => ({
                        id: exp.id,
                        type: 'expense',
                        reference: exp.vendor || 'General',
                        description: exp.description || exp.category,
                        amount: Number(exp.amount),
                        date: exp.date.toISOString()
                    }))
                };
                break;
            }

            case 'tax_report': {
                const invoices = await prisma.invoice.findMany({
                    where: whereInvoice
                });

                const details = invoices.map(inv => {
                    const totalTax = Number(inv.taxAmount);
                    const isInter = inv.supplyType === 'inter';
                    return {
                        id: inv.id,
                        invoiceNumber: inv.invoiceNumber,
                        taxableValue: Number(inv.subtotal),
                        cgst: isInter ? 0 : totalTax / 2,
                        sgst: isInter ? 0 : totalTax / 2,
                        igst: isInter ? totalTax : 0,
                        totalTax,
                        totalAmount: Number(inv.total),
                        date: inv.createdAt.toISOString()
                    };
                });

                const totalTaxCollected = details.reduce((sum, d) => sum + d.totalTax, 0);

                data.summary = {
                    taxableValue: details.reduce((sum, d) => sum + d.taxableValue, 0),
                    cgstTotal: details.reduce((sum, d) => sum + d.cgst, 0),
                    sgstTotal: details.reduce((sum, d) => sum + d.sgst, 0),
                    igstTotal: details.reduce((sum, d) => sum + d.igst, 0),
                    totalTaxCollected,
                };
                data.details = details;
                break;
            }

            case 'product_performance': {
                const invoices = await prisma.invoice.findMany({
                    where: whereInvoice
                });

                const performanceMap: Record<string, { name: string; quantity: number; revenue: number; transactions: number }> = {};
                
                invoices.forEach(inv => {
                    const items = (inv.items as any[]) || [];
                    items.forEach(item => {
                        const name = item.name || item.description || 'Unknown Product';
                        const qty = Number(item.qty || item.quantity || 1);
                        const price = Number(item.price || item.unitPrice || 0);
                        const lineTotal = qty * price;

                        if (!performanceMap[name]) {
                            performanceMap[name] = { name, quantity: 0, revenue: 0, transactions: 0 };
                        }
                        performanceMap[name].quantity += qty;
                        performanceMap[name].revenue += lineTotal;
                        performanceMap[name].transactions += 1;
                    });
                });

                const details = Object.values(performanceMap).sort((a, b) => b.revenue - a.revenue);

                data.summary = {
                    totalProductsSold: details.length,
                    totalQuantitySold: details.reduce((sum, d) => sum + d.quantity, 0),
                    totalRevenueGenerated: details.reduce((sum, d) => sum + d.revenue, 0),
                };
                data.details = details;
                break;
            }

            case 'balance_sheet': {
                // 1. Cash & Bank: Payments received minus expenses paid
                const payments = await prisma.payment.findMany({
                    where: {
                        userId: req.userId,
                        paymentDate: { lte: end }
                    }
                });
                const totalCashIn = payments.reduce((sum, p) => sum + Number(p.amount), 0);

                const expenses = await prisma.expense.findMany({
                    where: {
                        userId: req.userId,
                        date: { lte: end }
                    }
                });
                const totalCashOut = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
                const cashAndBank = totalCashIn - totalCashOut;

                // 2. Accounts Receivable: Unpaid invoices
                const unpaidInvoices = await prisma.invoice.findMany({
                    where: {
                        userId: req.userId,
                        createdAt: { lte: end },
                        status: { in: ['pending', 'sent', 'overdue'] }
                    }
                });
                const accountsReceivable = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

                // 3. Inventory Valuation: Sum of quantity * costPrice
                const products = await prisma.product.findMany({
                    include: { inventory: true }
                });
                let inventoryValuation = 0;
                products.forEach(prod => {
                    const qty = prod.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);
                    const avgCost = prod.inventory.length > 0 ? prod.inventory.reduce((sum, inv) => sum + Number(inv.costPrice || 0), 0) / prod.inventory.length : 0;
                    inventoryValuation += qty * avgCost;
                });

                // 4. Accounts Payable: Unpaid purchase invoices
                const unpaidPurchases = await prisma.purchaseInvoice.findMany({
                    where: {
                        userId: req.userId,
                        invoiceDate: { lte: end },
                        status: { not: 'paid' }
                    }
                });
                const accountsPayable = unpaidPurchases.reduce((sum, p) => sum + (Number(p.total) - Number(p.amountPaid)), 0);

                // 5. GST Payable: GST collected on sales minus GST paid on purchases/expenses
                const salesInvoicesForGst = await prisma.invoice.findMany({
                    where: {
                        userId: req.userId,
                        createdAt: { lte: end },
                        status: { in: ['paid', 'pending', 'sent'] }
                    }
                });
                const gstCollected = salesInvoicesForGst.reduce((sum, inv) => sum + Number(inv.taxAmount), 0);

                const gstPaidExpenses = expenses.reduce((sum, exp) => sum + Number(exp.gst), 0);
                const purchasesForGst = await prisma.purchaseInvoice.findMany({
                    where: {
                        userId: req.userId,
                        invoiceDate: { lte: end }
                    }
                });
                const gstPaidPurchases = purchasesForGst.reduce((sum, p) => sum + Number(p.taxAmount), 0);
                const gstPaid = gstPaidExpenses + gstPaidPurchases;
                
                const gstPayable = gstCollected - gstPaid;

                // 6. Retained Earnings
                const retainedEarnings = cashAndBank + accountsReceivable + inventoryValuation - accountsPayable - gstPayable;

                data.summary = {
                    cashAndBank,
                    accountsReceivable,
                    inventoryValuation,
                    totalAssets: cashAndBank + accountsReceivable + inventoryValuation,
                    accountsPayable,
                    gstPayable,
                    totalLiabilities: accountsPayable + gstPayable,
                    retainedEarnings,
                    totalEquity: retainedEarnings,
                    totalLiabilitiesAndEquity: accountsPayable + gstPayable + retainedEarnings
                };
                
                data.details = {
                    assets: [
                        { name: 'Cash & Bank Balances', amount: cashAndBank },
                        { name: 'Accounts Receivable (Debtors)', amount: accountsReceivable },
                        { name: 'Inventory Asset Value', amount: inventoryValuation }
                    ],
                    liabilities: [
                        { name: 'Accounts Payable (Creditors)', amount: accountsPayable },
                        { name: 'GST / Tax Payable', amount: gstPayable }
                    ],
                    equity: [
                        { name: 'Retained Earnings', amount: retainedEarnings }
                    ]
                };
                break;
            }

            case 'cash_flow': {
                // Inflows: Invoice payments received during period
                const periodPayments = await prisma.payment.findMany({
                    where: {
                        userId: req.userId,
                        paymentDate: { gte: start, lte: end }
                    },
                    include: { invoice: { include: { client: true } } }
                });
                const totalInflow = periodPayments.reduce((sum, p) => sum + Number(p.amount), 0);

                // Outflows: Expenses paid during period + Purchases paid during period
                const periodExpenses = await prisma.expense.findMany({
                    where: {
                        userId: req.userId,
                        date: { gte: start, lte: end }
                    }
                });
                const totalExpenseOutflow = periodExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

                const periodPurchases = await prisma.purchaseInvoice.findMany({
                    where: {
                        userId: req.userId,
                        invoiceDate: { gte: start, lte: end }
                    }
                });
                const totalPurchaseOutflow = periodPurchases.reduce((sum, p) => sum + Number(p.amountPaid), 0);
                const totalOutflow = totalExpenseOutflow + totalPurchaseOutflow;
                
                const netCashFlow = totalInflow - totalOutflow;

                // Opening Cash Balance
                const prePayments = await prisma.payment.findMany({
                    where: {
                        userId: req.userId,
                        paymentDate: { lt: start }
                    }
                });
                const preCashIn = prePayments.reduce((sum, p) => sum + Number(p.amount), 0);

                const preExpenses = await prisma.expense.findMany({
                    where: {
                        userId: req.userId,
                        date: { lt: start }
                    }
                });
                const preCashOutExpenses = preExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

                const prePurchases = await prisma.purchaseInvoice.findMany({
                    where: {
                        userId: req.userId,
                        invoiceDate: { lt: start }
                    }
                });
                const preCashOutPurchases = prePurchases.reduce((sum, p) => sum + Number(p.amountPaid), 0);

                const openingBalance = preCashIn - (preCashOutExpenses + preCashOutPurchases);
                const closingBalance = openingBalance + netCashFlow;

                data.summary = {
                    openingBalance,
                    totalInflow,
                    totalOutflow,
                    netCashFlow,
                    closingBalance
                };

                data.details = {
                    inflows: periodPayments.map(p => ({
                        id: p.id,
                        date: p.paymentDate.toISOString(),
                        reference: p.reference || `PAY-${p.id}`,
                        description: `Payment for Invoice ${p.invoice.invoiceNumber} (${p.invoice.client.name})`,
                        amount: Number(p.amount)
                    })),
                    outflows: [
                        ...periodExpenses.map(exp => ({
                            id: exp.id,
                            date: exp.date.toISOString(),
                            reference: exp.vendor || 'Expense',
                            description: exp.description || exp.category,
                            amount: Number(exp.amount),
                            type: 'expense'
                        })),
                        ...periodPurchases.filter(p => Number(p.amountPaid) > 0).map(p => ({
                            id: p.id,
                            date: p.invoiceDate.toISOString(),
                            reference: p.supplierName,
                            description: `Purchase Invoice ${p.invoiceNumber}`,
                            amount: Number(p.amountPaid),
                            type: 'purchase'
                        }))
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                };
                break;
            }

            default: {
                const invoices = await prisma.invoice.findMany({
                    where: whereInvoice,
                    include: { client: true }
                });
                data.details = invoices;
                break;
            }
        }

        res.json(data);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// KPI — Pre-computed with MoM comparison
// ═══════════════════════════════════════════════════════════
router.get('/kpi', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const [
            totalClients, lastMonthClients,
            totalInvoices, lastMonthInvoices,
            allInvoices,
            thisMonthPayments, lastMonthPayments,
        ] = await Promise.all([
            prisma.client.count({ where: { userId: req.userId } }),
            prisma.client.count({ where: { userId: req.userId, createdAt: { lt: thisMonthStart } } }),
            prisma.invoice.count({ where: { userId: req.userId } }),
            prisma.invoice.count({ where: { userId: req.userId, createdAt: { lt: thisMonthStart } } }),
            prisma.invoice.findMany({ where: { userId: req.userId }, select: { total: true, status: true, dueDate: true, taxAmount: true, supplyType: true } }),
            prisma.payment.findMany({ where: { userId: req.userId, createdAt: { gte: thisMonthStart } }, select: { amount: true } }),
            prisma.payment.findMany({ where: { userId: req.userId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }, select: { amount: true } }),
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
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// AGING ANALYSIS — Invoice aging buckets
// ═══════════════════════════════════════════════════════════
router.get('/aging', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const now = new Date();
        const unpaidInvoices = await prisma.invoice.findMany({
            where: { userId: req.userId, status: { in: ['sent', 'pending', 'overdue'] } },
            include: { client: true },
            orderBy: { dueDate: 'asc' },
        });

        const buckets = { current: [] as any[], '0_30': [] as any[], '30_60': [] as any[], '60_90': [] as any[], '90_plus': [] as any[] };

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

            if (new Date(inv.dueDate) > now) buckets.current.push(entry);
            else if (daysOverdue <= 30) buckets['0_30'].push(entry);
            else if (daysOverdue <= 60) buckets['30_60'].push(entry);
            else if (daysOverdue <= 90) buckets['60_90'].push(entry);
            else buckets['90_plus'].push(entry);
        });

        const totals = {
            current: buckets.current.reduce((s, i) => s + i.total, 0),
            '0_30': buckets['0_30'].reduce((s, i) => s + i.total, 0),
            '30_60': buckets['30_60'].reduce((s, i) => s + i.total, 0),
            '60_90': buckets['60_90'].reduce((s, i) => s + i.total, 0),
            '90_plus': buckets['90_plus'].reduce((s, i) => s + i.total, 0),
        };

        res.json({ buckets, totals, totalOutstanding: Object.values(totals).reduce((a, b) => a + b, 0) });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CASH FLOW — 30/60/90 day projection
// ═══════════════════════════════════════════════════════════
router.get('/cashflow', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const now = new Date();
        const future30 = new Date(now.getTime() + 30 * 86400000);
        const future60 = new Date(now.getTime() + 60 * 86400000);
        const future90 = new Date(now.getTime() + 90 * 86400000);

        const unpaid = await prisma.invoice.findMany({
            where: { userId: req.userId, status: { in: ['sent', 'pending'] } },
            select: { total: true, dueDate: true },
        });

        const next30 = unpaid.filter(i => i.dueDate <= future30).reduce((s, i) => s + Number(i.total), 0);
        const next60 = unpaid.filter(i => i.dueDate > future30 && i.dueDate <= future60).reduce((s, i) => s + Number(i.total), 0);
        const next90 = unpaid.filter(i => i.dueDate > future60 && i.dueDate <= future90).reduce((s, i) => s + Number(i.total), 0);
        const beyond = unpaid.filter(i => i.dueDate > future90).reduce((s, i) => s + Number(i.total), 0);

        // Historical monthly revenue (last 12 months)
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        const payments = await prisma.payment.findMany({
            where: { userId: req.userId, createdAt: { gte: yearAgo } },
            select: { amount: true, createdAt: true },
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyRevenue: { month: string; year: number; revenue: number }[] = [];
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
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// TOP CLIENTS — Revenue by client
// ═══════════════════════════════════════════════════════════
router.get('/top-clients', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const clients = await prisma.client.findMany({
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
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// GST SUMMARY — Monthly GST breakup
// ═══════════════════════════════════════════════════════════
router.get('/gst-summary', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { month, year } = req.query;
        const m = month ? Number(String(month)) : new Date().getMonth() + 1;
        const y = year ? Number(String(year)) : new Date().getFullYear();
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);

        const invoices = await prisma.invoice.findMany({
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
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default router;

