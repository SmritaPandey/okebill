import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Plus, Search, Receipt, TrendingDown, TrendingUp, IndianRupee,
  Calendar, Filter, Eye, Trash2, Upload, Tag, Building2,
  Car, Zap, Phone, ShoppingBag, Briefcase, Coffee, MoreHorizontal,
  PieChart, ArrowUpRight, ArrowDownRight, CheckCircle, Clock
} from 'lucide-react';

type ExpenseCategory = 'rent' | 'utilities' | 'travel' | 'office' | 'marketing' | 'salary' | 'inventory' | 'telecom' | 'food' | 'misc';

interface Expense {
  id: string; date: string; description: string; category: ExpenseCategory;
  amount: number; gst: number; vendor: string; paymentMode: string;
  receipt?: string; status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

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

const sampleExpenses: Expense[] = [
  { id: 'e1', date: '2026-04-24', description: 'Office rent - April 2026', category: 'rent', amount: 35000, gst: 6300, vendor: 'ABC Properties', paymentMode: 'Bank Transfer', status: 'approved' },
  { id: 'e2', date: '2026-04-22', description: 'Google Ads campaign Q2', category: 'marketing', amount: 15000, gst: 2700, vendor: 'Google India', paymentMode: 'Credit Card', status: 'approved' },
  { id: 'e3', date: '2026-04-21', description: 'Electricity bill - April', category: 'utilities', amount: 8500, gst: 1530, vendor: 'BSES Rajdhani', paymentMode: 'UPI', status: 'approved' },
  { id: 'e4', date: '2026-04-20', description: 'Client meeting travel - Mumbai', category: 'travel', amount: 12400, gst: 0, vendor: 'MakeMyTrip', paymentMode: 'Credit Card', status: 'approved' },
  { id: 'e5', date: '2026-04-19', description: 'Printer cartridges & paper', category: 'office', amount: 3200, gst: 576, vendor: 'Amazon Business', paymentMode: 'UPI', status: 'approved' },
  { id: 'e6', date: '2026-04-18', description: 'Internet - April', category: 'telecom', amount: 2999, gst: 540, vendor: 'Airtel Business', paymentMode: 'Auto-debit', status: 'approved' },
  { id: 'e7', date: '2026-04-25', description: 'Team lunch - client celebration', category: 'food', amount: 4500, gst: 225, vendor: 'Barbeque Nation', paymentMode: 'Credit Card', status: 'pending' },
  { id: 'e8', date: '2026-04-17', description: 'Stock purchase - USB cables batch', category: 'inventory', amount: 28000, gst: 5040, vendor: 'XYZ Wholesale', paymentMode: 'Bank Transfer', status: 'approved' },
  { id: 'e9', date: '2026-04-23', description: 'Staff salary - April (part)', category: 'salary', amount: 85000, gst: 0, vendor: 'Payroll', paymentMode: 'Bank Transfer', status: 'pending' },
];

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
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expenses] = useState<Expense[]>(sampleExpenses);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount + e.gst, 0);
  const totalGST = expenses.reduce((s, e) => s + e.gst, 0);
  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const topCategory = Object.entries(
    expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])[0];

  const filtered = expenses.filter(e => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.vendor.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || e.category === filterCategory;
    return matchSearch && matchCat;
  });

  // Category breakdown for mini chart
  const categoryTotals = Object.entries(
    expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount + e.gst; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Expenses</h1>
            <p className="text-sm text-zinc-500 mt-1">Track, categorize, and manage all business expenses</p>
          </div>
          <Button onClick={() => toast.success('New expense form opened')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Log Expense
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={TrendingDown} label="Total Expenses" value={`₹${totalExpenses.toLocaleString('en-IN')}`} sub="This month" color="bg-red-500" trend={{ value: '12%', up: true }} />
          <StatCard icon={IndianRupee} label="GST Input Credit" value={`₹${totalGST.toLocaleString('en-IN')}`} sub="Claimable" color="bg-blue-500" />
          <StatCard icon={Clock} label="Pending Approval" value={pendingCount.toString()} sub="Need review" color="bg-amber-500" />
          <StatCard icon={PieChart} label="Top Category" value={topCategory ? categoryConfig[topCategory[0] as ExpenseCategory]?.label : '—'} sub={topCategory ? `₹${topCategory[1].toLocaleString('en-IN')}` : ''} color="bg-purple-500" />
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {categoryTotals.slice(0, 5).map(([cat, amount]) => {
              const config = categoryConfig[cat as ExpenseCategory];
              const pct = ((amount / totalExpenses) * 100).toFixed(0);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <config.icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <span className="text-sm font-medium text-zinc-700 w-36">{config.label}</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full bg-emerald-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 w-28 text-right">₹{amount.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-zinc-400 w-12 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

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
                {filtered.map(exp => {
                  const config = categoryConfig[exp.category];
                  return (
                    <tr key={exp.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3.5 text-zinc-500 whitespace-nowrap">{exp.date}</td>
                      <td className="px-4 py-3.5 font-medium text-zinc-900 max-w-[250px] truncate">{exp.description}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                          <config.icon className="w-3 h-3" /> {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500">{exp.vendor}</td>
                      <td className="px-4 py-3.5">₹{exp.amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5 text-zinc-400">{exp.gst > 0 ? `₹${exp.gst.toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-4 py-3.5 font-bold">₹{(exp.amount + exp.gst).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5 text-xs text-zinc-500">{exp.paymentMode}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          exp.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          exp.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>{exp.status}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1">
                          {exp.status === 'pending' && (
                            <button onClick={() => toast.success(`Expense approved`)} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button className="p-1.5 hover:bg-zinc-100 rounded-lg"><Eye className="w-4 h-4 text-zinc-400" /></button>
                          <button className="p-1.5 hover:bg-zinc-100 rounded-lg"><Trash2 className="w-4 h-4 text-zinc-400" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* P&L Summary */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Profit & Loss Snapshot — April 2026</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-zinc-400">Total Revenue (Invoices)</p>
              <p className="text-3xl font-bold text-emerald-400">₹4,52,000</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total Expenses</p>
              <p className="text-3xl font-bold text-red-400">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Net Profit</p>
              <p className="text-3xl font-bold text-white">₹{(452000 - totalExpenses).toLocaleString('en-IN')}</p>
              <p className="text-xs text-emerald-400 mt-1">Margin: {((452000 - totalExpenses) / 452000 * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExpensesPage;
