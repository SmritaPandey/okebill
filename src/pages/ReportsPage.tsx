import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  const [selectedReport, setSelectedReport] = useState("");
  const [dateRange, setDateRange] = useState("this_month");
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Fetch real dashboard stats
  const { stats, kpi, cashFlow, topClients, isLoading } = useDashboardStats();

  const reportTypes = [
    { id: "sales_summary", name: "Sales Summary", description: "Overview of sales performance and trends", icon: BarChart3, category: "Sales" },
    { id: "inventory_report", name: "Inventory Report", description: "Stock levels, low stock alerts, and expiry tracking", icon: Package, category: "Inventory" },
    { id: "customer_analysis", name: "Customer Analysis", description: "Customer behavior and purchase patterns", icon: Users, category: "Customers" },
    { id: "financial_summary", name: "Financial Summary", description: "Revenue, expenses, and profit analysis", icon: IndianRupee, category: "Finance" },
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
        type: selectedReport,
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

        {/* Quick Stats — now from real data */}
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
                <Select defaultValue="pdf">
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportData && (
          <Card className="rounded-2xl border-zinc-200 bg-zinc-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Report Results
              </CardTitle>
              <CardDescription>Generated {new Date().toLocaleString('en-IN')}</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.summary ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-zinc-200">
                      <p className="text-xs text-zinc-500">Revenue</p>
                      <p className="text-xl font-bold text-zinc-900">₹{Number(reportData.summary.revenue).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-zinc-200">
                      <p className="text-xs text-zinc-500">Invoices</p>
                      <p className="text-xl font-bold text-zinc-900">{reportData.summary.invoices}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-zinc-200">
                      <p className="text-xs text-zinc-500">Clients</p>
                      <p className="text-xl font-bold text-zinc-900">{reportData.summary.clients}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-zinc-200">
                      <p className="text-xs text-zinc-500">Outstanding</p>
                      <p className="text-xl font-bold text-red-600">₹{Number(reportData.summary.outstanding).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  {reportData.summary.topClients?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-700 mb-3">Top Clients</h4>
                      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200">
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Client</th>
                              <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Revenue</th>
                              <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Invoices</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {reportData.summary.topClients.map((c: any) => (
                              <tr key={c.id} className="hover:bg-zinc-50">
                                <td className="px-4 py-2.5 font-medium">{c.name}</td>
                                <td className="px-4 py-2.5 text-right">₹{Number(c.totalRevenue).toLocaleString('en-IN')}</td>
                                <td className="px-4 py-2.5 text-right text-zinc-500">{c.invoiceCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {reportData.summary.monthlyRevenue?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-700 mb-3">Monthly Revenue Trend</h4>
                      <div className="bg-white rounded-xl border border-zinc-200 p-4">
                        <div className="flex items-end gap-2 h-40">
                          {reportData.summary.monthlyRevenue.slice(-6).map((m: any, i: number) => {
                            const maxRev = Math.max(...reportData.summary.monthlyRevenue.map((r: any) => r.revenue), 1);
                            const heightPct = (m.revenue / maxRev) * 100;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-zinc-400">₹{(m.revenue / 1000).toFixed(0)}K</span>
                                <div className="w-full bg-emerald-500 rounded-t-lg" style={{ height: `${Math.max(heightPct, 4)}%` }} />
                                <span className="text-[10px] text-zinc-500">{m.month}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
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
