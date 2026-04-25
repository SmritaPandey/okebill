import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Plus, Search, RefreshCw, Calendar, IndianRupee, CheckCircle,
  Clock, Pause, Play, Eye, Trash2, Edit, AlertTriangle,
  ArrowRight, Users, FileText, Bell, XCircle, MoreHorizontal
} from 'lucide-react';

type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type RStatus = 'active' | 'paused' | 'completed' | 'draft';

interface RecurringInvoice {
  id: string; name: string; client: string; frequency: Frequency;
  amount: number; gst: number; nextDate: string; lastSent: string;
  startDate: string; endDate?: string; totalSent: number;
  status: RStatus; autoSend: boolean; paymentLink: boolean;
  items: { desc: string; qty: number; rate: number }[];
}

const freqLabels: Record<Frequency, { label: string; color: string; bg: string }> = {
  weekly: { label: 'Weekly', color: 'text-blue-700', bg: 'bg-blue-100' },
  monthly: { label: 'Monthly', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  quarterly: { label: 'Quarterly', color: 'text-purple-700', bg: 'bg-purple-100' },
  yearly: { label: 'Yearly', color: 'text-amber-700', bg: 'bg-amber-100' },
};

const statusConfig: Record<RStatus, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: Play },
  paused: { label: 'Paused', color: 'text-amber-700', bg: 'bg-amber-100', icon: Pause },
  completed: { label: 'Completed', color: 'text-zinc-500', bg: 'bg-zinc-100', icon: CheckCircle },
  draft: { label: 'Draft', color: 'text-blue-700', bg: 'bg-blue-100', icon: Edit },
};

const sample: RecurringInvoice[] = [
  { id: 'ri1', name: 'Monthly Retainer - Sharma Electronics', client: 'Sharma Electronics', frequency: 'monthly', amount: 25000, gst: 4500, nextDate: '2026-05-01', lastSent: '2026-04-01', startDate: '2026-01-01', totalSent: 4, status: 'active', autoSend: true, paymentLink: true, items: [{ desc: 'IT Support Retainer', qty: 1, rate: 25000 }] },
  { id: 'ri2', name: 'Quarterly Maintenance - Patel Traders', client: 'Patel Traders', frequency: 'quarterly', amount: 45000, gst: 8100, nextDate: '2026-07-01', lastSent: '2026-04-01', startDate: '2025-07-01', totalSent: 4, status: 'active', autoSend: true, paymentLink: true, items: [{ desc: 'AMC - Hardware', qty: 1, rate: 30000 }, { desc: 'AMC - Software', qty: 1, rate: 15000 }] },
  { id: 'ri3', name: 'Weekly Delivery - Fresh Foods Co', client: 'Fresh Foods Co', frequency: 'weekly', amount: 8500, gst: 425, nextDate: '2026-04-28', lastSent: '2026-04-21', startDate: '2026-03-01', totalSent: 8, status: 'active', autoSend: false, paymentLink: true, items: [{ desc: 'Vegetable Supply', qty: 1, rate: 5000 }, { desc: 'Fruit Supply', qty: 1, rate: 3500 }] },
  { id: 'ri4', name: 'Annual License - Kumar Enterprises', client: 'Kumar Enterprises', frequency: 'yearly', amount: 120000, gst: 21600, nextDate: '2027-01-01', lastSent: '2026-01-01', startDate: '2024-01-01', totalSent: 3, status: 'active', autoSend: true, paymentLink: true, items: [{ desc: 'Software License - Enterprise', qty: 1, rate: 120000 }] },
  { id: 'ri5', name: 'Monthly Rent - Office Space', client: 'ABC Properties', frequency: 'monthly', amount: 35000, gst: 6300, nextDate: '2026-05-01', lastSent: '2026-04-01', startDate: '2025-06-01', totalSent: 11, status: 'paused', autoSend: true, paymentLink: false, items: [{ desc: 'Office Rent - Unit 204', qty: 1, rate: 35000 }] },
  { id: 'ri6', name: 'Monthly SEO Package', client: 'Gupta Mobiles', frequency: 'monthly', amount: 15000, gst: 2700, nextDate: '', lastSent: '2026-03-01', startDate: '2025-09-01', endDate: '2026-03-01', totalSent: 7, status: 'completed', autoSend: true, paymentLink: true, items: [{ desc: 'SEO & Content Marketing', qty: 1, rate: 15000 }] },
];

const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) => (
  <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
      <span className="text-sm text-zinc-500 font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-zinc-900">{value}</p>
    {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
  </div>
);

const RecurringInvoicesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [items] = useState(sample);

  const active = items.filter(i => i.status === 'active');
  const monthlyRevenue = active.reduce((s, i) => {
    const mult = i.frequency === 'weekly' ? 4 : i.frequency === 'monthly' ? 1 : i.frequency === 'quarterly' ? 1/3 : 1/12;
    return s + (i.amount + i.gst) * mult;
  }, 0);

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const daysUntil = (d: string) => {
    if (!d) return null;
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    return diff;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Recurring Invoices</h1>
            <p className="text-sm text-zinc-500 mt-1">Automate billing for retainers, subscriptions, and recurring services</p>
          </div>
          <Button onClick={() => toast.success('New recurring invoice form opened')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> New Schedule
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={RefreshCw} label="Active Schedules" value={active.length.toString()} sub={`${items.filter(i=>i.status==='paused').length} paused`} color="bg-emerald-500" />
          <StatCard icon={IndianRupee} label="Monthly Revenue" value={`₹${Math.round(monthlyRevenue).toLocaleString('en-IN')}`} sub="From recurring" color="bg-blue-500" />
          <StatCard icon={FileText} label="Total Invoices Sent" value={items.reduce((s,i) => s + i.totalSent, 0).toString()} sub="All time" color="bg-purple-500" />
          <StatCard icon={Calendar} label="Next Due" value={(() => { const next = active.filter(i=>i.nextDate).sort((a,b) => a.nextDate.localeCompare(b.nextDate))[0]; return next ? next.nextDate : '—'; })()} sub={(() => { const next = active.filter(i=>i.nextDate).sort((a,b) => a.nextDate.localeCompare(b.nextDate))[0]; if (!next) return ''; const d = daysUntil(next.nextDate); return d !== null ? `${d} days away` : ''; })()} color="bg-amber-500" />
        </div>

        {/* Upcoming schedule */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-5">
          <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2"><Bell className="w-4 h-4" /> Upcoming This Week</h3>
          <div className="flex flex-wrap gap-3">
            {active.filter(i => { const d = daysUntil(i.nextDate); return d !== null && d >= 0 && d <= 7; }).map(i => (
              <div key={i.id} className="bg-white rounded-xl px-4 py-3 border border-emerald-200 flex items-center gap-3">
                <div className="text-sm">
                  <span className="font-semibold text-zinc-900">{i.client}</span>
                  <span className="text-zinc-400 mx-2">·</span>
                  <span className="text-emerald-600 font-bold">₹{(i.amount + i.gst).toLocaleString('en-IN')}</span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{i.nextDate}</span>
                {i.autoSend && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Auto-send</span>}
              </div>
            ))}
            {active.filter(i => { const d = daysUntil(i.nextDate); return d !== null && d >= 0 && d <= 7; }).length === 0 && (
              <p className="text-sm text-emerald-600">No invoices due this week ✅</p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder="Search schedules..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-zinc-200" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-zinc-50 border-b border-zinc-200">
                {['Schedule', 'Client', 'Frequency', 'Amount', 'Next Invoice', 'Sent', 'Auto', 'Pay Link', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map(ri => {
                  const sc = statusConfig[ri.status];
                  const fc = freqLabels[ri.frequency];
                  const days = daysUntil(ri.nextDate);
                  return (
                    <tr key={ri.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-zinc-900 truncate max-w-[220px]">{ri.name}</p>
                        <p className="text-xs text-zinc-400">Since {ri.startDate}</p>
                      </td>
                      <td className="px-4 py-3.5 font-medium">{ri.client}</td>
                      <td className="px-4 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${fc.bg} ${fc.color}`}>{fc.label}</span></td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold">₹{(ri.amount + ri.gst).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-zinc-400">+ ₹{ri.gst.toLocaleString('en-IN')} GST</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {ri.nextDate ? (
                          <div>
                            <p className="text-zinc-700">{ri.nextDate}</p>
                            {days !== null && days >= 0 && <p className={`text-xs ${days <= 3 ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}>{days === 0 ? 'Today!' : `${days}d away`}</p>}
                          </div>
                        ) : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500">{ri.totalSent} invoices</td>
                      <td className="px-4 py-3.5">{ri.autoSend ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-zinc-300" />}</td>
                      <td className="px-4 py-3.5">{ri.paymentLink ? <CheckCircle className="w-4 h-4 text-blue-500" /> : <XCircle className="w-4 h-4 text-zinc-300" />}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}>
                          <sc.icon className="w-3 h-3" /> {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1">
                          {ri.status === 'active' && <button onClick={() => toast.info(`${ri.name} paused`)} className="p-1.5 hover:bg-amber-50 rounded-lg" title="Pause"><Pause className="w-4 h-4 text-amber-500" /></button>}
                          {ri.status === 'paused' && <button onClick={() => toast.success(`${ri.name} resumed`)} className="p-1.5 hover:bg-emerald-50 rounded-lg" title="Resume"><Play className="w-4 h-4 text-emerald-500" /></button>}
                          <button className="p-1.5 hover:bg-zinc-100 rounded-lg"><Eye className="w-4 h-4 text-zinc-400" /></button>
                          <button className="p-1.5 hover:bg-zinc-100 rounded-lg"><Edit className="w-4 h-4 text-zinc-400" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dunning info */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <h3 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Payment Reminder Schedule (Dunning)</h3>
          <div className="flex gap-3 flex-wrap">
            {[{ day: 'Day 1', desc: 'Friendly reminder', color: 'bg-blue-100 text-blue-700' },
              { day: 'Day 3', desc: 'Second notice', color: 'bg-amber-100 text-amber-700' },
              { day: 'Day 7', desc: 'Urgent reminder', color: 'bg-orange-100 text-orange-700' },
              { day: 'Day 14', desc: 'Final notice', color: 'bg-red-100 text-red-700' },
            ].map(d => (
              <div key={d.day} className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${d.color}`}>{d.day}</span>
                <ArrowRight className="w-3 h-3 text-zinc-300" />
                <span className="text-xs text-zinc-500">{d.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-3">Automatic payment reminders are sent via email for overdue recurring invoices. Configure in Settings → Notifications.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default RecurringInvoicesPage;
