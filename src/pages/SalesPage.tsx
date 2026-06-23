import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Receipt, Search, Filter, Download, Eye, Calendar,
  IndianRupee, User, CreditCard, Loader2, ShoppingCart
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { posApi } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

export function SalesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Get tenant ID from user settings (default to 1 for now)
  const tenantId = 1;

  // Fetch real transactions from POS API
  const { data, isLoading } = useQuery({
    queryKey: ['sales-transactions', tenantId],
    queryFn: () => posApi.listTransactions({ tenantId, transactionType: 'sale', limit: 200 }),
    enabled: !!user,
  });

  const transactions = data?.transactions || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed":
      case "voided": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "card": return <CreditCard className="h-4 w-4" />;
      case "cash": return <IndianRupee className="h-4 w-4" />;
      default: return <IndianRupee className="h-4 w-4" />;
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
  };

  // Filter sales
  const filteredSales = transactions.filter(sale => {
    const matchesSearch = searchTerm === "" ||
      sale.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale as any).customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || sale.paymentStatus === statusFilter || sale.status === statusFilter;

    const matchesDate = dateFilter === "all" || (() => {
      const saleDate = new Date(sale.transactionDate);
      const now = new Date();
      switch (dateFilter) {
        case "today": return saleDate.toDateString() === now.toDateString();
        case "week": return saleDate >= new Date(now.getTime() - 7 * 86400000);
        case "month": return saleDate >= new Date(now.getTime() - 30 * 86400000);
        default: return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Compute stats from real data
  const today = new Date();
  const todaySales = transactions
    .filter(t => new Date(t.transactionDate).toDateString() === today.toDateString())
    .reduce((sum, t) => sum + Number(t.totalAmount), 0);
  const todayCount = transactions.filter(t => new Date(t.transactionDate).toDateString() === today.toDateString()).length;

  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const weekSales = transactions
    .filter(t => new Date(t.transactionDate) >= weekAgo)
    .reduce((sum, t) => sum + Number(t.totalAmount), 0);
  const weekCount = transactions.filter(t => new Date(t.transactionDate) >= weekAgo).length;

  const avgSale = transactions.length > 0
    ? transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0) / transactions.length
    : 0;

  const pendingCount = transactions.filter(t => t.paymentStatus === 'pending').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Sales</h1>
            <p className="mt-1 text-sm text-zinc-500">
              View and manage all sales transactions
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Today's Sales</CardTitle>
              <Receipt className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">{formatCurrency(todaySales)}</div>
              <p className="text-xs text-zinc-400">{todayCount} transactions</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">{formatCurrency(weekSales)}</div>
              <p className="text-xs text-zinc-400">{weekCount} transactions</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Average Sale</CardTitle>
              <IndianRupee className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">{formatCurrency(avgSale)}</div>
              <p className="text-xs text-zinc-400">Per transaction</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Pending</CardTitle>
              <Receipt className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              <p className="text-xs text-zinc-400">Awaiting payment</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-zinc-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                <Input placeholder="Search transactions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 rounded-xl" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="All Dates" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleClearFilters} className="rounded-xl">Clear Filters</Button>
            </div>
          </CardContent>
        </Card>

        {/* Sales List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            <span className="ml-2 text-zinc-500">Loading sales...</span>
          </div>
        ) : filteredSales.length > 0 ? (
          <div className="space-y-4">
            {filteredSales.map((sale) => (
              <Card key={sale.id} className="hover:shadow-md transition-shadow rounded-2xl border-zinc-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{sale.transactionNumber}</CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(sale.transactionDate).toLocaleString('en-IN')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(sale.paymentStatus || sale.status)}>
                        {sale.paymentStatus || sale.status}
                      </Badge>
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">{(sale as any).customer?.name || 'Walk-in Customer'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <IndianRupee className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm font-semibold">{formatCurrency(Number(sale.totalAmount))}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(sale.paymentMethod || 'cash')}
                      <span className="text-sm capitalize">{sale.paymentMethod || 'cash'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Receipt className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">{sale.items?.length || 0} items</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-800">No sales found</h3>
            <p className="mt-1 text-sm text-zinc-500 max-w-sm">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                ? "No sales match your current filters"
                : "Sales transactions will appear here once you start making sales from the POS"
              }
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default SalesPage;
