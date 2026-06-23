import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { expensesApi, type Expense } from '@/lib/api-client';
import {
  Plus, Search, TrendingDown, TrendingUp, IndianRupee,
  Calendar, Eye, Trash2, Tag, Building2,
  Car, Zap, Phone, ShoppingBag, Briefcase, Coffee,
  PieChart, ArrowUpRight, ArrowDownRight, CheckCircle, Clock, X, Loader2
} from 'lucide-react';

type ExpenseCategory = 'rent' | 'utilities' | 'travel' | 'office' | 'marketing' | 'salary' | 'inventory' | 'telecom' | 'food' | 'misc';

const categoryConfig: Record<ExpenseCategory, { label: string; icon: any; color: string; bg: string }> = {
  rent: { label: 'Rent', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
  utilities: { label: 'Utilities', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
  travel: { label: 'Travel', icon: Car, color: 'text-purple-600', bg: 'bg-purple-100' },
  office: { label: 'Office Supplies', icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-pink-100' },
  marketing: { label: 'Marketing', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  salary: { label: 'Salary & Wages', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  inventory: { label: 'Inventory Purchase', icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-100' },
  telecom: { label: 'Telecom & Internet', icon: Phone, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  food: { label: 'Food & Beverages', icon: Coffee, color: 'text-red-600', bg: 'bg-red-100' },
  misc: { label: 'Miscellaneous', icon: Tag, color: 'text-zinc-600', bg: 'bg-zinc-100' },
};

const StatCard = ({ icon: Icon, label, value, sub, color, trend }: { icon: any; label: string; value: string; sub?: string; color: string; trend?: { value: string; up: boolean } }) => (
  <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm text-zinc-500 font-medium">{label}</span>
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-semibold ${trend.up ? 'text-red-500' : 'text-emerald-500'}`}>
          {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend.value}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-zinc-900">{value}</p>
    {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
  </div>
);

const ExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '', category: 'misc' as ExpenseCategory, amount: '',
    gst: '', vendor: '', paymentMode: 'cash', notes: '',
  });

  // Fetch expenses
  const { data, isLoading } = useQuery({
    queryKey: ['expenses', search, filterCategory],
    queryFn: () => expensesApi.list({
      search: search || undefined,
      category: filterCategory !== 'all' ? filterCategory : undefined,
      limit: 100,
    }),
  });

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['expenses-summary'],
    queryFn: () => expensesApi.summary(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Expense>) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      toast.success('Expense logged successfully');
      setShowCreateDialog(false);
      setNewExpense({ date: new Date().toISOString().split('T')[0], description: '', category: 'misc', amount: '', gst: '', vendor: '', paymentMode: 'cash', notes: '' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: number) => expensesApi.updateStatus(id, 'approved'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      toast.success('Expense approved');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      toast.success('Expense deleted');
    },
  });

  const expenses = data?.expenses || [];
  const totalExpenses = summary?.totalWithGst || 0;
  const totalGST = summary?.totalGst || 0;
  const pendingCount = summary?.pendingCount || 0;
  const categoryBreakdown = summary?.categoryBreakdown || {};
  const categoryTotals = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);

  const topCategory = categoryTotals.length > 0 ? categoryTotals[0] : null;

  const handleCreateExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error('Description and amount are required');
      return;
    }
    createMutation.mutate({
      date: newExpense.date,
      description: newExpense.description,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      gst: newExpense.gst ? parseFloat(newExpense.gst) : 0,
      vendor: newExpense.vendor,
      paymentMode: newExpense.paymentMode,
      notes: newExpense.notes || undefined,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Expenses</h1>
            <p className="text-sm text-zinc-500 mt-1">Track, categorize, and manage all business expenses</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Log Expense
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={TrendingDown} label="Total Expenses" value={`₹${totalExpenses.toLocaleString('en-IN')}`} sub="This month" color="bg-red-500" />
          <StatCard icon={IndianRupee} label="GST Input Credit" value={`₹${totalGST.toLocaleString('en-IN')}`} sub="Claimable" color="bg-blue-500" />
          <StatCard icon={Clock} label="Pending Approval" value={pendingCount.toString()} sub="Need review" color="bg-amber-500" />
          <StatCard icon={PieChart} label="Top Category" value={topCategory ? categoryConfig[topCategory[0] as ExpenseCategory]?.label || topCategory[0] : '—'} sub={topCategory ? `₹${topCategory[1].toLocaleString('en-IN')}` : ''} color="bg-purple-500" />
        </div>

        {/* Category Breakdown */}
        {categoryTotals.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">Category Breakdown</h3>
            <div className="space-y-3">
              {categoryTotals.slice(0, 5).map(([cat, amount]) => {
                const config = categoryConfig[cat as ExpenseCategory] || categoryConfig.misc;
                const pct = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(0) : '0';
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                      <config.icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 w-36">{config.label}</span>
                    <div className="flex-1 bg-zinc-100 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 w-28 text-right">₹{amount.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-zinc-400 w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-zinc-200" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm">
            <option value="all">All Categories</option>
            {Object.entries(categoryConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <span className="ml-2 text-zinc-500">Loading expenses...</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                <TrendingDown className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-800">No expenses yet</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm">Start tracking your business expenses by clicking "Log Expense" above.</p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Log Your First Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    {['Date', 'Description', 'Category', 'Vendor', 'Amount', 'GST', 'Total', 'Payment', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {expenses.map(exp => {
                    const config = categoryConfig[exp.category as ExpenseCategory] || categoryConfig.misc;
                    return (
                      <tr key={exp.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3.5 text-zinc-500 whitespace-nowrap">{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3.5 font-medium text-zinc-900 max-w-[250px] truncate">{exp.description}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                            <config.icon className="w-3 h-3" /> {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-500">{exp.vendor || '—'}</td>
                        <td className="px-4 py-3.5">₹{Number(exp.amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5 text-zinc-400">{Number(exp.gst) > 0 ? `₹${Number(exp.gst).toLocaleString('en-IN')}` : '—'}</td>
                        <td className="px-4 py-3.5 font-bold">₹{(Number(exp.amount) + Number(exp.gst)).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5 text-xs text-zinc-500 capitalize">{exp.paymentMode}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            exp.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            exp.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>{exp.status}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1">
                            {exp.status === 'pending' && (
                              <button onClick={() => approveMutation.mutate(exp.id)} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => deleteMutation.mutate(exp.id)} className="p-1.5 hover:bg-zinc-100 rounded-lg">
                              <Trash2 className="w-4 h-4 text-zinc-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* P&L Summary */}
        {expenses.length > 0 && (
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Expense Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-zinc-400">Total Expenses</p>
                <p className="text-3xl font-bold text-red-400">₹{totalExpenses.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">GST Input Credit</p>
                <p className="text-3xl font-bold text-blue-400">₹{totalGST.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Categories</p>
                <p className="text-3xl font-bold text-white">{categoryTotals.length}</p>
                <p className="text-xs text-zinc-400 mt-1">Tracked this period</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateDialog(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <h2 className="text-lg font-semibold text-zinc-900">Log New Expense</h2>
                <button onClick={() => setShowCreateDialog(false)} className="p-1 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Date</label>
                    <Input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Category</label>
                    <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm">
                      {Object.entries(categoryConfig).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Description *</label>
                  <Input placeholder="e.g. Office rent for June" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Vendor</label>
                  <Input placeholder="Vendor or payee name" value={newExpense.vendor} onChange={e => setNewExpense({ ...newExpense, vendor: e.target.value })} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Amount (₹) *</label>
                    <Input type="number" placeholder="0.00" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">GST (₹)</label>
                    <Input type="number" placeholder="0.00" value={newExpense.gst} onChange={e => setNewExpense({ ...newExpense, gst: e.target.value })} className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Payment Mode</label>
                  <select value={newExpense.paymentMode} onChange={e => setNewExpense({ ...newExpense, paymentMode: e.target.value })} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Notes</label>
                  <textarea placeholder="Optional notes..." value={newExpense.notes} onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm min-h-[80px] resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-zinc-100">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleCreateExpense} disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Log Expense
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ExpensesPage;
