import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Download, Calendar, TrendingUp, IndianRupee,
  Package, Users, Receipt, FileText, AlertTriangle, Loader2
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { analyticsApi } from "@/lib/api-client";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function ReportsPage() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState("sales_summary");
  const [dateRange, setDateRange] = useState("this_month");
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [format, setFormat] = useState("pdf");

  // Fetch real dashboard stats
  const { stats, kpi, cashFlow, topClients, isLoading } = useDashboardStats();

  const reportTypes = [
    { id: "sales_summary", name: "Sales Summary", description: "Overview of sales performance and trends", icon: BarChart3, category: "Sales" },
    { id: "inventory_report", name: "Inventory Report", description: "Stock levels, low stock alerts, and expiry tracking", icon: Package, category: "Inventory" },
    { id: "customer_analysis", name: "Customer Analysis", description: "Customer behavior and purchase patterns", icon: Users, category: "Customers" },
    { id: "financial_summary", name: "Financial Summary (P&L)", description: "Revenue, expenses, and profit analysis", icon: IndianRupee, category: "Finance" },
    { id: "balance_sheet", name: "Balance Sheet", description: "Assets, liabilities, and equity statement", icon: FileText, category: "Finance" },
    { id: "cash_flow", name: "Cash Flow Statement", description: "Cash inflows, outflows, and net changes", icon: TrendingUp, category: "Finance" },
    { id: "tax_report", name: "Tax Report", description: "GST calculations and compliance reports", icon: FileText, category: "Compliance" },
    { id: "product_performance", name: "Product Performance", description: "Best and worst performing products", icon: TrendingUp, category: "Products" },
  ];

  // Compute real quick stats from dashboard KPI
  const quickStats = [
    {
      title: "Revenue This Month",
      value: kpi ? `₹${kpi.revenueThisMonth.toLocaleString('en-IN')}` : '—',
      change: kpi ? `${kpi.revenueChange >= 0 ? '+' : ''}${kpi.revenueChange.toFixed(1)}%` : '',
      icon: IndianRupee,
      positive: (kpi?.revenueChange || 0) >= 0,
    },
    {
      title: "Total Invoices",
      value: kpi ? kpi.totalInvoices.toString() : '—',
      change: kpi ? `${kpi.invoicesChange >= 0 ? '+' : ''}${kpi.invoicesChange.toFixed(1)}%` : '',
      icon: Receipt,
      positive: (kpi?.invoicesChange || 0) >= 0,
    },
    {
      title: "Outstanding",
      value: kpi ? `₹${kpi.outstanding.toLocaleString('en-IN')}` : '—',
      change: kpi ? `${kpi.overdueCount} overdue` : '',
      icon: AlertTriangle,
      positive: (kpi?.overdueCount || 0) === 0,
    },
    {
      title: "Total Clients",
      value: kpi ? kpi.totalClients.toString() : '—',
      change: kpi ? `${kpi.clientsChange >= 0 ? '+' : ''}${kpi.clientsChange.toFixed(1)}%` : '',
      icon: Users,
      positive: (kpi?.clientsChange || 0) >= 0,
    },
  ];

  // Compute date range for report
  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;
    end = now;

    switch (dateRange) {
      case 'today': start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'yesterday': start = new Date(now.getTime() - 86400000); end = start; break;
      case 'this_week': start = new Date(now.getTime() - 7 * 86400000); break;
      case 'last_week': start = new Date(now.getTime() - 14 * 86400000); end = new Date(now.getTime() - 7 * 86400000); break;
      case 'this_month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'last_month': start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0); break;
      case 'this_quarter':
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), qMonth, 1);
        break;
      case 'this_year': start = new Date(now.getFullYear(), 0, 1); break;
      default: start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const generateReport = async () => {
    if (!selectedReport) return;

    setReportLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const data = await analyticsApi.generateReport({
        reportType: selectedReport,
        startDate,
        endDate,
      });
      setReportData(data);
      toast.success('Report generated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate report');
      // Fallback: show dashboard data as report
      setReportData({
        reportType: selectedReport,
        summary: {
          revenue: kpi?.revenueThisMonth || 0,
          invoices: kpi?.totalInvoices || 0,
          clients: kpi?.totalClients || 0,
          outstanding: kpi?.outstanding || 0,
          topClients: topClients?.slice(0, 5) || [],
          monthlyRevenue: cashFlow?.monthlyRevenue || [],
        }
      });
    } finally {
      setReportLoading(false);
    }
  };

  const downloadReportCSV = () => {
    if (!reportData) return;

    let headers: string[] = [];
    let rows: any[] = [];
    const rType = reportData.reportType;

    if (rType === 'sales_summary') {
      headers = ['Invoice Number', 'Client Name', 'Date', 'Status', 'Tax Amount', 'Total'];
      rows = (reportData.details || []).map((d: any) => [
        d.invoiceNumber,
        d.clientName,
        new Date(d.date).toLocaleDateString('en-IN'),
        d.status,
        d.taxAmount,
        d.total
      ]);
    } else if (rType === 'inventory_report') {
      headers = ['SKU', 'Name', 'Category', 'Stock', 'Cost Price', 'Selling Price', 'Valuation', 'Status'];
      rows = (reportData.details || []).map((d: any) => [
        d.sku,
        d.name,
        d.category,
        d.stock,
        d.costPrice,
        d.sellingPrice,
        d.valuation,
        d.status
      ]);
    } else if (rType === 'customer_analysis') {
      headers = ['Customer Name', 'Email', 'Phone', 'Total Invoices', 'Revenue Contributed', 'Outstanding Balance'];
      rows = (reportData.details || []).map((d: any) => [
        d.name,
        d.email,
        d.phone,
        d.totalInvoices,
        d.revenueContributed,
        d.outstandingBalance
      ]);
    } else if (rType === 'financial_summary') {
      headers = ['Type', 'Reference', 'Description', 'Amount', 'Date'];
      const revenue = reportData.details?.revenueItems || [];
      const expenses = reportData.details?.expenseItems || [];
      const combined = [...revenue, ...expenses].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      rows = combined.map((d: any) => [
        d.type,
        d.reference,
        d.description,
        d.amount,
        new Date(d.date).toLocaleDateString('en-IN')
      ]);
    } else if (rType === 'tax_report') {
      headers = ['Invoice Number', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Date'];
      rows = (reportData.details || []).map((d: any) => [
        d.invoiceNumber,
        d.taxableValue,
        d.cgst,
        d.sgst,
        d.igst,
        d.totalTax,
        new Date(d.date).toLocaleDateString('en-IN')
      ]);
    } else if (rType === 'product_performance') {
      headers = ['Product Name', 'Quantity Sold', 'Revenue Generated', 'Transactions'];
      rows = (reportData.details || []).map((d: any) => [
        d.name,
        d.quantity,
        d.revenue,
        d.transactions
      ]);
    } else if (rType === 'balance_sheet') {
      headers = ['Category', 'Account Item', 'Amount'];
      const assets = (reportData.details?.assets || []).map((d: any) => ['Asset', d.name, d.amount]);
      const liabilities = (reportData.details?.liabilities || []).map((d: any) => ['Liability', d.name, d.amount]);
      const equity = (reportData.details?.equity || []).map((d: any) => ['Equity', d.name, d.amount]);
      rows = [...assets, ...liabilities, ...equity];
    } else if (rType === 'cash_flow') {
      headers = ['Type', 'Date', 'Reference', 'Description', 'Amount'];
      const inflows = (reportData.details?.inflows || []).map((d: any) => ['Inflow', new Date(d.date).toLocaleDateString('en-IN'), d.reference, d.description, d.amount]);
      const outflows = (reportData.details?.outflows || []).map((d: any) => ['Outflow', new Date(d.date).toLocaleDateString('en-IN'), d.reference, d.description, d.amount]);
      rows = [...inflows, ...outflows].sort((a: any, b: any) => new Date(b[1]).getTime() - new Date(a[1]).getTime());
    } else {
      headers = ['ID', 'Total', 'Date'];
      rows = (reportData.details || []).map((d: any) => [
        d.id,
        d.total,
        new Date(d.createdAt || d.date).toLocaleDateString('en-IN')
      ]);
    }

    const csvString = [
      headers.join(','),
      ...rows.map(e => e.map((val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${rType}_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV report downloaded successfully');
  };

  const printReportPDF = () => {
    if (!reportData) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rType = reportData.reportType;
    const title = reportTypes.find(r => r.id === rType)?.name || 'Financial Report';
    const datesText = `Period: ${new Date(reportData.startDate).toLocaleDateString('en-IN')} to ${new Date(reportData.endDate).toLocaleDateString('en-IN')}`;

    let summaryHtml = '';
    let detailsHtml = '';

    const formatVal = (v: any) => {
      const num = Number(v);
      return isNaN(num) ? '—' : `₹${num.toLocaleString('en-IN')}`;
    };

    if (rType === 'sales_summary') {
      summaryHtml = `
        <div class="kpi-grid">
          <div class="kpi-card"><h3>Gross Revenue</h3><p>${formatVal(reportData.summary.totalSales)}</p></div>
          <div class="kpi-card"><h3>Tax Collected</h3><p>${formatVal(reportData.summary.totalTax)}</p></div>
          <div class="kpi-card"><h3>Paid Sales</h3><p>${formatVal(reportData.summary.paidSales)}</p></div>
          <div class="kpi-card"><h3>Outstanding</h3><p>${formatVal(reportData.summary.pendingSales + reportData.summary.overdueSales)}</p></div>
        </div>
      `;
      detailsHtml = `
        <h3>Invoice Details</h3>
        <table>
          <thead>
            <tr><th>Invoice No</th><th>Client Name</th><th>Date</th><th>Status</th><th class="text-right">Tax</th><th class="text-right">Total</th></tr>
          </thead>
          <tbody>
            ${(reportData.details || []).map((d: any) => `
              <tr>
                <td>${d.invoiceNumber}</td>
                <td>${d.clientName}</td>
                <td>${new Date(d.date).toLocaleDateString('en-IN')}</td>
                <td><span class="badge ${d.status}">${d.status}</span></td>
                <td class="text-right">${formatVal(d.taxAmount)}</td>
                <td class="text-right bold">${formatVal(d.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (rType === 'inventory_report') {
      summaryHtml = `
        <div class="kpi-grid">
          <div class="kpi-card"><h3>Total Products</h3><p>${reportData.summary.totalProducts}</p></div>
          <div class="kpi-card"><h3>Items in Stock</h3><p>${reportData.summary.totalItemsInStock}</p></div>
          <div class="kpi-card"><h3>Total Valuation</h3><p>${formatVal(reportData.summary.totalValuation)}</p></div>
          <div class="kpi-card"><h3>Low Stock Items</h3><p>${reportData.summary.lowStockCount}</p></div>
        </div>
      `;
      detailsHtml = `
        <h3>Product Stock Status</h3>
        <table>
          <thead>
            <tr><th>SKU</th><th>Product Name</th><th>Category</th><th>Stock</th><th class="text-right">Cost Price</th><th class="text-right">Selling Price</th><th class="text-right">Valuation</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${(reportData.details || []).map((d: any) => `
              <tr>
                <td>${d.sku}</td>
                <td class="bold">${d.name}</td>
                <td>${d.category}</td>
                <td>${d.stock}</td>
                <td class="text-right">${formatVal(d.costPrice)}</td>
                <td class="text-right">${formatVal(d.sellingPrice)}</td>
                <td class="text-right bold">${formatVal(d.valuation)}</td>
                <td><span class="badge ${d.status}">${d.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (rType === 'customer_analysis') {
      summaryHtml = `
        <div class="kpi-grid">
          <div class="kpi-card"><h3>Total Customers</h3><p>${reportData.summary.totalCustomers}</p></div>
          <div class="kpi-card"><h3>Active Customers</h3><p>${reportData.summary.activeCustomers}</p></div>
          <div class="kpi-card"><h3>Total Revenue</h3><p>${formatVal(reportData.summary.totalRevenue)}</p></div>
          <div class="kpi-card"><h3>Total Outstanding</h3><p>${formatVal(reportData.summary.totalOutstanding)}</p></div>
        </div>
      `;
      detailsHtml = `
        <h3>Customer Details</h3>
        <table>
          <thead>
            <tr><th>Customer Name</th><th>Email</th><th>Phone</th><th>Invoices</th><th class="text-right">Paid Revenue</th><th class="text-right">Outstanding</th></tr>
          </thead>
          <tbody>
            ${(reportData.details || []).map((d: any) => `
              <tr>
                <td class="bold">${d.name}</td>
                <td>${d.email}</td>
                <td>${d.phone}</td>
                <td>${d.totalInvoices}</td>
                <td class="text-right text-emerald">${formatVal(d.revenueContributed)}</td>
                <td class="text-right text-red">${formatVal(d.outstandingBalance)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (rType === 'financial_summary') {
      summaryHtml = `
        <div class="kpi-grid">
          <div class="kpi-card"><h3>Paid Revenue</h3><p class="text-emerald">${formatVal(reportData.summary.totalRevenue)}</p></div>
          <div class="kpi-card"><h3>Total Expenses</h3><p class="text-red">${formatVal(reportData.summary.totalExpenses)}</p></div>
          <div class="kpi-card"><h3>Net Profit</h3><p class="bold ${reportData.summary.netProfit >= 0 ? 'text-emerald' : 'text-red'}">${formatVal(reportData.summary.netProfit)}</p></div>
          <div class="kpi-card"><h3>Profit Margin</h3><p>${Number(reportData.summary.profitMargin).toFixed(1)}%</p></div>
        </div>
      `;
      const revItems = reportData.details?.revenueItems || [];
      const expItems = reportData.details?.expenseItems || [];
      detailsHtml = `
        <h3>Revenue Transactions</h3>
        <table>
          <thead><tr><th>Reference</th><th>Description</th><th>Date</th><th class="text-right">Amount</th></tr></thead>
          <tbody>
            ${revItems.map((d: any) => `
              <tr><td>${d.reference}</td><td>${d.description}</td><td>${new Date(d.date).toLocaleDateString('en-IN')}</td><td class="text-right text-emerald">${formatVal(d.amount)}</td></tr>
            `).join('')}
          </tbody>
        </table>
        <br/>
        <h3>Expense Transactions</h3>
        <table>
          <thead><tr><th>Vendor / Ref</th><th>Description</th><th>Date</th><th class="text-right">Amount</th></tr></thead>
          <tbody>
            ${expItems.map((d: any) => `
              <tr><td>${d.reference}</td><td>${d.description}</td><td>${new Date(d.date).toLocaleDateString('en-IN')}</td><td class="text-right text-red">${formatVal(d.amount)}</td></tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (rType === 'tax_report') {
      summaryHtml = `
        <div class="kpi-grid">
          <div class="kpi-card"><h3>Taxable Value</h3><p>${formatVal(reportData.summary.taxableValue)}</p></div>
          <div class="kpi-card"><h3>CGST Total</h3><p>${formatVal(reportData.summary.cgstTotal)}</p></div>
          <div class="kpi-card"><h3>SGST Total</h3><p>${formatVal(reportData.summary.sgstTotal)}</p></div>
          <div class="kpi-card"><h3>IGST Total</h3><p>${formatVal(reportData.summary.igstTotal)}</p></div>
        </div>
      `;
      detailsHtml = `
        <h3>Tax Details Breakdown</h3>
        <table>
          <thead>
            <tr><th>Invoice No</th><th>Date</th><th class="text-right">Taxable Value</th><th class="text-right">CGST</th><th class="text-right">SGST</th><th class="text-right">IGST</th><th class="text-right">Total Tax</th></tr>
          </thead>
          <tbody>
            ${(reportData.details || []).map((d: any) => `
              <tr>
                <td>${d.invoiceNumber}</td>
                <td>${new Date(d.date).toLocaleDateString('en-IN')}</td>
                <td class="text-right">${formatVal(d.taxableValue)}</td>
                <td class="text-right">${formatVal(d.cgst)}</td>
                <td class="text-right">${formatVal(d.sgst)}</td>
                <td class="text-right">${formatVal(d.igst)}</td>
                <td class="text-right bold">${formatVal(d.totalTax)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (rType === 'product_performance') {
      summaryHtml = `
        <div class="kpi-grid">
          <div class="kpi-card"><h3>Products Sold</h3><p>${reportData.summary.totalProductsSold}</p></div>
          <div class="kpi-card"><h3>Total Quantity</h3><p>${reportData.summary.totalQuantitySold}</p></div>
          <div class="kpi-card"><h3>Total Revenue</h3><p>${formatVal(reportData.summary.totalRevenueGenerated)}</p></div>
        </div>
      `;
      detailsHtml = `
        <h3>Product Rankings</h3>
        <table>
          <thead>
            <tr><th>Product Name</th><th>Quantity Sold</th><th>Transactions</th><th class="text-right">Revenue Generated</th></tr>
          </thead>
          <tbody>
            ${(reportData.details || []).map((d: any) => `
              <tr>
                <td class="bold">${d.name}</td>
                <td>${d.quantity}</td>
                <td>${d.transactions}</td>
                <td class="text-right bold">${formatVal(d.revenue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (rType === 'balance_sheet') {
      summaryHtml = `
        <div class="kpi-grid">
          <div class="kpi-card"><h3>Total Assets</h3><p class="text-emerald">${formatVal(reportData.summary.totalAssets)}</p></div>
          <div class="kpi-card"><h3>Total Liabilities</h3><p class="text-red">${formatVal(reportData.summary.totalLiabilities)}</p></div>
          <div class="kpi-card"><h3>Owner's Equity</h3><p class="text-blue-600">${formatVal(reportData.summary.retainedEarnings)}</p></div>
          <div class="kpi-card"><h3>Liab & Equity</h3><p class="bold">${formatVal(reportData.summary.totalLiabilitiesAndEquity)}</p></div>
        </div>
      `;
      detailsHtml = `
        <div class="balance-sheet-container" style="display: flex; gap: 40px; margin-top: 20px;">
          <div style="flex: 1;">
            <h3 style="border-bottom: 2px solid #10b981; padding-bottom: 5px; color: #10b981;">ASSETS</h3>
            <table class="simple-table">
              ${(reportData.details?.assets || []).map((a: any) => `
                <tr><td>${a.name}</td><td class="text-right bold">${formatVal(a.amount)}</td></tr>
              `).join('')}
              <tr style="border-top: 1px solid #000; font-weight: bold;">
                <td>TOTAL ASSETS</td><td class="text-right">${formatVal(reportData.summary.totalAssets)}</td>
              </tr>
            </table>
          </div>
          <div style="flex: 1;">
            <h3 style="border-bottom: 2px solid #ef4444; padding-bottom: 5px; color: #ef4444;">LIABILITIES & EQUITY</h3>
            <table class="simple-table">
              <tr><td colspan="2" class="bold" style="background: #f4f4f5; font-size: 11px;">Liabilities</td></tr>
              ${(reportData.details?.liabilities || []).map((l: any) => `
                <tr><td>${l.name}</td><td class="text-right bold">${formatVal(l.amount)}</td></tr>
              `).join('')}
              <tr style="border-top: 1px solid #e4e4e7; font-weight: bold;">
                <td>Total Liabilities</td><td class="text-right">${formatVal(reportData.summary.totalLiabilities)}</td>
              </tr>
              <tr><td colspan="2" class="bold" style="background: #f4f4f5; font-size: 11px; padding-top: 8px;">Owner's Equity</td></tr>
              ${(reportData.details?.equity || []).map((e: any) => `
                <tr><td>${e.name}</td><td class="text-right bold">${formatVal(e.amount)}</td></tr>
              `).join('')}
              <tr style="border-top: 1px solid #000; font-weight: bold; font-size: 12px; background: #e4e4e7;">
                <td>TOTAL LIABILITIES & EQUITY</td><td class="text-right">${formatVal(reportData.summary.totalLiabilitiesAndEquity)}</td>
              </tr>
            </table>
          </div>
        </div>
      `;
    } else if (rType === 'cash_flow') {
      summaryHtml = `
        <div class="kpi-grid">
          <div class="kpi-card"><h3>Opening Cash</h3><p>${formatVal(reportData.summary.openingBalance)}</p></div>
          <div class="kpi-card"><h3>Cash Inflow</h3><p class="text-emerald">${formatVal(reportData.summary.totalInflow)}</p></div>
          <div class="kpi-card"><h3>Cash Outflow</h3><p class="text-red">${formatVal(reportData.summary.totalOutflow)}</p></div>
          <div class="kpi-card"><h3>Closing Cash</h3><p class="bold">${formatVal(reportData.summary.closingBalance)}</p></div>
        </div>
      `;
      const inflows = reportData.details?.inflows || [];
      const outflows = reportData.details?.outflows || [];
      detailsHtml = `
        <h3>Cash Inflows (Receipts)</h3>
        <table>
          <thead><tr><th>Date</th><th>Ref</th><th>Description</th><th class="text-right">Amount</th></tr></thead>
          <tbody>
            ${inflows.map((i: any) => `
              <tr><td>${new Date(i.date).toLocaleDateString('en-IN')}</td><td>${i.reference}</td><td>${i.description}</td><td class="text-right text-emerald">${formatVal(i.amount)}</td></tr>
            `).join('')}
            <tr style="font-weight: bold; background: #f4f4f5;"><td colspan="3">Total Inflows</td><td class="text-right text-emerald">${formatVal(reportData.summary.totalInflow)}</td></tr>
          </tbody>
        </table>
        <br/>
        <h3>Cash Outflows (Payments)</h3>
        <table>
          <thead><tr><th>Date</th><th>Ref / Vendor</th><th>Description</th><th class="text-right">Amount</th></tr></thead>
          <tbody>
            ${outflows.map((o: any) => `
              <tr><td>${new Date(o.date).toLocaleDateString('en-IN')}</td><td>${o.reference}</td><td>${o.description}</td><td class="text-right text-red">${formatVal(o.amount)}</td></tr>
            `).join('')}
            <tr style="font-weight: bold; background: #f4f4f5;"><td colspan="3">Total Outflows</td><td class="text-right text-red">${formatVal(reportData.summary.totalOutflow)}</td></tr>
          </tbody>
        </table>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #1f2937; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { font-size: 24px; color: #111827; margin: 0; }
            .header p { font-size: 14px; color: #6b7280; margin: 5px 0 0 0; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
            .kpi-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 15px; }
            .kpi-card h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; margin: 0 0 5px 0; }
            .kpi-card p { font-size: 18px; font-weight: bold; margin: 0; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th { background: #f3f4f6; color: #374151; font-weight: bold; text-align: left; padding: 8px 10px; border-bottom: 1px solid #d1d5db; font-size: 11px; }
            td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .text-emerald { color: #10b981; }
            .text-red { color: #ef4444; }
            .badge { display: inline-block; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; text-transform: uppercase; }
            .badge.paid { background: #d1fae5; color: #065f46; }
            .badge.pending, .badge.sent { background: #fef3c7; color: #92400e; }
            .badge.overdue { background: #fee2e2; color: #991b1b; }
            .simple-table { width: 100%; border-collapse: collapse; }
            .simple-table td { padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>${datesText}</p>
            <p style="font-size: 11px;">Company: ${user?.companyName || ''} | Generated on ${new Date().toLocaleString('en-IN')}</p>
          </div>

          ${summaryHtml}
          ${detailsHtml}

          <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px;">
            OkeBill Accounting Report — Confidential & Proprietary
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  const handleDownloadExport = () => {
    if (format === 'pdf') {
      printReportPDF();
    } else {
      downloadReportCSV();
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Generate insights and reports for your business
            </p>
          </div>
          <Button onClick={generateReport} disabled={!selectedReport || reportLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
            {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Generate Report
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="rounded-2xl border-zinc-200 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-500">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-zinc-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-zinc-900">{isLoading ? '...' : stat.value}</div>
                  <div className="flex items-center text-xs">
                    <span className={stat.positive ? "text-green-600" : "text-red-600"}>
                      {stat.change}
                    </span>
                    <span className="text-zinc-400 ml-1">from last period</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Report Configuration */}
        <Card className="rounded-2xl border-zinc-200">
          <CardHeader>
            <CardTitle className="text-base">Report Configuration</CardTitle>
            <CardDescription>
              Select report type and date range to generate analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select report type" /></SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((report) => (
                      <SelectItem key={report.id} value={report.id}>{report.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="last_week">Last Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="this_quarter">This Quarter</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF / Print</SelectItem>
                    <SelectItem value="excel">Excel (CSV)</SelectItem>
                    <SelectItem value="csv">CSV File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportData && (
          <Card className="rounded-2xl border-zinc-200 bg-zinc-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Report Results
                </CardTitle>
                <CardDescription>Generated {new Date().toLocaleString('en-IN')}</CardDescription>
              </div>
              <Button onClick={handleDownloadExport} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 text-xs h-9">
                <Download className="w-3.5 h-3.5" />
                Export {format.toUpperCase()}
              </Button>
            </CardHeader>
            <CardContent>
              {reportData.summary ? (
                <div className="space-y-6">
                  
                  {/* 1. SALES SUMMARY */}
                  {reportData.reportType === 'sales_summary' && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Gross Revenue</p>
                          <p className="text-xl font-bold text-zinc-900">₹{Number(reportData.summary.totalSales).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Tax Collected</p>
                          <p className="text-xl font-bold text-zinc-900">₹{Number(reportData.summary.totalTax).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Paid Sales</p>
                          <p className="text-xl font-bold text-emerald-600">₹{Number(reportData.summary.paidSales).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium font-semibold">Outstanding Balance</p>
                          <p className="text-xl font-bold text-red-600">₹{Number(reportData.summary.pendingSales + reportData.summary.overdueSales).toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-zinc-700 mb-3">Invoice Details</h4>
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-zinc-50 border-b border-zinc-200">
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Invoice No</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Client Name</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Date</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Status</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Tax</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {(reportData.details || []).map((d: any) => (
                                <tr key={d.id} className="hover:bg-zinc-50">
                                  <td className="px-4 py-2.5 font-medium">{d.invoiceNumber}</td>
                                  <td className="px-4 py-2.5">{d.clientName}</td>
                                  <td className="px-4 py-2.5 text-zinc-500">{new Date(d.date).toLocaleDateString('en-IN')}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                                      d.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                                      d.status === 'overdue' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                    }`}>{d.status}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-zinc-500">₹{Number(d.taxAmount).toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2.5 text-right font-bold text-zinc-900">₹{Number(d.total).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 2. INVENTORY REPORT */}
                  {reportData.reportType === 'inventory_report' && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Total Products</p>
                          <p className="text-xl font-bold text-zinc-900">{reportData.summary.totalProducts}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Items in Stock</p>
                          <p className="text-xl font-bold text-zinc-900">{reportData.summary.totalItemsInStock}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Stock Valuation</p>
                          <p className="text-xl font-bold text-emerald-600">₹{Number(reportData.summary.totalValuation).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Low Stock Alerts</p>
                          <p className="text-xl font-bold text-amber-600">{reportData.summary.lowStockCount}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-zinc-700 mb-3">Product Inventory Valuation</h4>
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-zinc-50 border-b border-zinc-200">
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">SKU</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Product Name</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Category</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Stock Qty</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Cost Price</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Selling Price</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Valuation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {(reportData.details || []).map((d: any) => (
                                <tr key={d.id} className="hover:bg-zinc-50">
                                  <td className="px-4 py-2.5 text-zinc-500 font-mono">{d.sku}</td>
                                  <td className="px-4 py-2.5 font-medium text-zinc-900">{d.name}</td>
                                  <td className="px-4 py-2.5 text-zinc-500">{d.category}</td>
                                  <td className="px-4 py-2.5 font-semibold">{d.stock}</td>
                                  <td className="px-4 py-2.5 text-right text-zinc-500">₹{Number(d.costPrice).toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2.5 text-right text-zinc-500">₹{Number(d.sellingPrice).toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2.5 text-right font-bold text-zinc-900">₹{Number(d.valuation).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 3. CUSTOMER ANALYSIS */}
                  {reportData.reportType === 'customer_analysis' && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Total Customers</p>
                          <p className="text-xl font-bold text-zinc-900">{reportData.summary.totalCustomers}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Active Customers</p>
                          <p className="text-xl font-bold text-zinc-900">{reportData.summary.activeCustomers}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Total Sales Revenue</p>
                          <p className="text-xl font-bold text-emerald-600">₹{Number(reportData.summary.totalRevenue).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Outstanding Balances</p>
                          <p className="text-xl font-bold text-red-600">₹{Number(reportData.summary.totalOutstanding).toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-zinc-700 mb-3">Customer Billing & Contributions</h4>
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-zinc-50 border-b border-zinc-200">
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Customer</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Email</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Invoices</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Paid Revenue</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Outstanding</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {(reportData.details || []).map((d: any) => (
                                <tr key={d.id} className="hover:bg-zinc-50">
                                  <td className="px-4 py-2.5 font-semibold text-zinc-900">{d.name}</td>
                                  <td className="px-4 py-2.5 text-zinc-500">{d.email}</td>
                                  <td className="px-4 py-2.5 text-zinc-500">{d.totalInvoices}</td>
                                  <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">₹{Number(d.revenueContributed).toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2.5 text-right text-red-600 font-medium">₹{Number(d.outstandingBalance).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 4. FINANCIAL SUMMARY (PL) */}
                  {reportData.reportType === 'financial_summary' && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Total Paid Revenue</p>
                          <p className="text-xl font-bold text-emerald-600">₹{Number(reportData.summary.totalRevenue).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Total Expenses</p>
                          <p className="text-xl font-bold text-red-600">₹{Number(reportData.summary.totalExpenses).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Net Profit / Loss</p>
                          <p className={`text-xl font-bold ${reportData.summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ₹{Number(reportData.summary.netProfit).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Profit Margin</p>
                          <p className="text-xl font-bold text-zinc-900">{Number(reportData.summary.profitMargin).toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-emerald-700 mb-3">Revenue Transactions</h4>
                          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-emerald-50/50 border-b border-zinc-200">
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600">Ref</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600">Date</th>
                                  <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-600">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100">
                                {(reportData.details?.revenueItems || []).map((d: any) => (
                                  <tr key={d.id} className="hover:bg-zinc-50">
                                    <td className="px-4 py-2 font-medium">{d.reference}</td>
                                    <td className="px-4 py-2 text-zinc-500">{new Date(d.date).toLocaleDateString('en-IN')}</td>
                                    <td className="px-4 py-2 text-right text-emerald-600 font-semibold">₹{Number(d.amount).toLocaleString('en-IN')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-red-700 mb-3">Expense Transactions</h4>
                          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-red-50/50 border-b border-zinc-200">
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600">Vendor / Desc</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600">Date</th>
                                  <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-600">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100">
                                {(reportData.details?.expenseItems || []).map((d: any) => (
                                  <tr key={d.id} className="hover:bg-zinc-50">
                                    <td className="px-4 py-2 font-medium">
                                      <div className="font-semibold text-zinc-800">{d.reference}</div>
                                      <div className="text-xs text-zinc-500">{d.description}</div>
                                    </td>
                                    <td className="px-4 py-2 text-zinc-500">{new Date(d.date).toLocaleDateString('en-IN')}</td>
                                    <td className="px-4 py-2 text-right text-red-600 font-semibold">₹{Number(d.amount).toLocaleString('en-IN')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 5. TAX REPORT */}
                  {reportData.reportType === 'tax_report' && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Taxable Value</p>
                          <p className="text-lg font-bold text-zinc-900">₹{Number(reportData.summary.taxableValue).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">CGST Collected</p>
                          <p className="text-lg font-bold text-blue-600">₹{Number(reportData.summary.cgstTotal).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">SGST Collected</p>
                          <p className="text-lg font-bold text-purple-600">₹{Number(reportData.summary.sgstTotal).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">IGST Collected</p>
                          <p className="text-lg font-bold text-indigo-600">₹{Number(reportData.summary.igstTotal).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium font-semibold">Total Tax Collected</p>
                          <p className="text-lg font-bold text-emerald-600">₹{Number(reportData.summary.totalTaxCollected).toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-zinc-700 mb-3">GST Tax Details</h4>
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-zinc-50 border-b border-zinc-200">
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Invoice Number</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Date</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Taxable Value</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">CGST</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">SGST</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">IGST</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Total GST</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {(reportData.details || []).map((d: any) => (
                                <tr key={d.id} className="hover:bg-zinc-50">
                                  <td className="px-4 py-2.5 font-medium">{d.invoiceNumber}</td>
                                  <td className="px-4 py-2.5 text-zinc-500">{new Date(d.date).toLocaleDateString('en-IN')}</td>
                                  <td className="px-4 py-2.5 text-right">₹{Number(d.taxableValue).toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2.5 text-right text-blue-600">₹{Number(d.cgst).toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2.5 text-right text-purple-600">₹{Number(d.sgst).toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2.5 text-right text-indigo-600">₹{Number(d.igst).toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2.5 text-right font-bold text-zinc-900">₹{Number(d.totalTax).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 6. PRODUCT PERFORMANCE */}
                  {reportData.reportType === 'product_performance' && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Distinct Products Sold</p>
                          <p className="text-xl font-bold text-zinc-900">{reportData.summary.totalProductsSold}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Total Quantity Sold</p>
                          <p className="text-xl font-bold text-zinc-900">{reportData.summary.totalQuantitySold}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Total Revenue Generated</p>
                          <p className="text-xl font-bold text-emerald-600">₹{Number(reportData.summary.totalRevenueGenerated).toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-zinc-700 mb-3">Product Sales Ranks</h4>
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-zinc-50 border-b border-zinc-200">
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Product Name</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Quantity Sold</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Transactions</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Revenue Generated</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {(reportData.details || []).map((d: any, index: number) => (
                                <tr key={index} className="hover:bg-zinc-50">
                                  <td className="px-4 py-2.5 font-semibold text-zinc-950">{d.name}</td>
                                  <td className="px-4 py-2.5 text-zinc-500">{d.quantity}</td>
                                  <td className="px-4 py-2.5 text-zinc-400">{d.transactions}</td>
                                  <td className="px-4 py-2.5 text-right font-bold text-emerald-600">₹{Number(d.revenue).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 7. BALANCE SHEET */}
                  {reportData.reportType === 'balance_sheet' && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Total Assets</p>
                          <p className="text-xl font-bold text-emerald-600">₹{Number(reportData.summary.totalAssets).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Total Liabilities</p>
                          <p className="text-xl font-bold text-red-600">₹{Number(reportData.summary.totalLiabilities).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Retained Earnings (Equity)</p>
                          <p className="text-xl font-bold text-blue-600">₹{Number(reportData.summary.retainedEarnings).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200 font-semibold border-zinc-300">
                          <p className="text-xs text-zinc-500 font-medium font-bold text-zinc-950">Liabilities & Equity</p>
                          <p className="text-xl font-bold text-zinc-900">₹{Number(reportData.summary.totalLiabilitiesAndEquity).toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-sm font-semibold text-emerald-700 border-b-2 border-emerald-500 pb-2 mb-3">Assets</h4>
                          <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
                            {(reportData.details?.assets || []).map((a: any, index: number) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-zinc-700">{a.name}</span>
                                <span className="font-semibold text-zinc-900">₹{Number(a.amount).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                            <div className="border-t border-zinc-200 pt-3 flex justify-between items-center text-sm font-bold text-emerald-800">
                              <span>TOTAL ASSETS</span>
                              <span>₹{Number(reportData.summary.totalAssets).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-red-700 border-b-2 border-red-500 pb-2 mb-3">Liabilities & Equity</h4>
                          <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-4">
                            <div>
                              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Liabilities</span>
                              <div className="space-y-2">
                                {(reportData.details?.liabilities || []).map((l: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-700">{l.name}</span>
                                    <span className="font-semibold text-zinc-900">₹{Number(l.amount).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center text-xs font-bold text-zinc-500 border-t border-zinc-100 pt-2">
                                  <span>Total Liabilities</span>
                                  <span>₹{Number(reportData.summary.totalLiabilities).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Equity</span>
                              <div className="space-y-2">
                                {(reportData.details?.equity || []).map((e: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-700">{e.name}</span>
                                    <span className="font-semibold text-zinc-900">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-zinc-300 pt-3 flex justify-between items-center text-sm font-bold text-zinc-950 bg-zinc-50 -mx-4 -mb-4 p-4 rounded-b-xl border-t">
                              <span>TOTAL LIABILITIES & EQUITY</span>
                              <span>₹{Number(reportData.summary.totalLiabilitiesAndEquity).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 8. CASH FLOW STATEMENT */}
                  {reportData.reportType === 'cash_flow' && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Opening Cash</p>
                          <p className="text-lg font-bold text-zinc-950">₹{Number(reportData.summary.openingBalance).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Total Inflows</p>
                          <p className="text-lg font-bold text-emerald-600">₹{Number(reportData.summary.totalInflow).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium">Total Outflows</p>
                          <p className="text-lg font-bold text-red-600">₹{Number(reportData.summary.totalOutflow).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200">
                          <p className="text-xs text-zinc-500 font-medium font-semibold">Net Cash Flow</p>
                          <p className={`text-lg font-bold ${reportData.summary.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ₹{Number(reportData.summary.netCashFlow).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200 font-semibold">
                          <p className="text-xs text-zinc-500 font-medium font-bold text-zinc-950">Closing Cash Balance</p>
                          <p className="text-lg font-bold text-zinc-950">₹{Number(reportData.summary.closingBalance).toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-zinc-700 mb-3">Cash Inflow Receipts</h4>
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-6">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-emerald-50/30 border-b border-zinc-200">
                                <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600">Reference</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600">Description</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-600">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {(reportData.details?.inflows || []).map((d: any) => (
                                <tr key={d.id} className="hover:bg-zinc-50">
                                  <td className="px-4 py-2 text-zinc-500">{new Date(d.date).toLocaleDateString('en-IN')}</td>
                                  <td className="px-4 py-2 font-medium">{d.reference}</td>
                                  <td className="px-4 py-2 text-zinc-500">{d.description}</td>
                                  <td className="px-4 py-2 text-right text-emerald-600 font-semibold">₹{Number(d.amount).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                              <tr className="font-bold bg-zinc-50">
                                <td colSpan={3} className="px-4 py-2 text-zinc-700">Total Customer Inflow Receipts</td>
                                <td className="px-4 py-2 text-right text-emerald-600">₹{Number(reportData.summary.totalInflow).toLocaleString('en-IN')}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <h4 className="text-sm font-semibold text-zinc-700 mb-3">Cash Outflow Payments</h4>
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-red-50/30 border-b border-zinc-200">
                                <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600">Reference / Vendor</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600">Description</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-600">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {(reportData.details?.outflows || []).map((d: any) => (
                                <tr key={d.id} className="hover:bg-zinc-50">
                                  <td className="px-4 py-2 text-zinc-500">{new Date(d.date).toLocaleDateString('en-IN')}</td>
                                  <td className="px-4 py-2 font-medium">{d.reference}</td>
                                  <td className="px-4 py-2 text-zinc-500">{d.description}</td>
                                  <td className="px-4 py-2 text-right text-red-600 font-semibold">₹{Number(d.amount).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                              <tr className="font-bold bg-zinc-50">
                                <td colSpan={3} className="px-4 py-2 text-zinc-700">Total Operating Cash Outflows</td>
                                <td className="px-4 py-2 text-right text-red-600">₹{Number(reportData.summary.totalOutflow).toLocaleString('en-IN')}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              ) : (
                <pre className="text-sm text-zinc-600 whitespace-pre-wrap">{JSON.stringify(reportData, null, 2)}</pre>
              )}
            </CardContent>
          </Card>
        )}

        {/* Available Reports */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Available Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.id}
                  className={`cursor-pointer transition-all hover:shadow-md rounded-2xl ${selectedReport === report.id ? "ring-2 ring-emerald-500 bg-emerald-50" : "border-zinc-200"}`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Icon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{report.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">{report.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{report.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default ReportsPage;
