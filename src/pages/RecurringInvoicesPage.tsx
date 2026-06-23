import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { recurringInvoicesApi, clientsApi, type RecurringInvoiceItem } from '@/lib/api-client';
import {
  Plus, Search, RefreshCw, Pause, Play, Trash2, IndianRupee,
  Calendar, Clock, TrendingUp, X, Loader2, AlertCircle
} from 'lucide-react';

const frequencyLabels: Record<string, string> = {
  weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
};

const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) => (
  <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm text-zinc-500 font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-zinc-900">{value}</p>
    {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
  </div>
);

const RecurringInvoicesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    clientId: '', frequency: 'monthly', nextDate: '', endDate: '',
    subtotal: '', taxRate: '', total: '', paymentTermsDays: '30', notes: '',
  });

  // Fetch recurring invoices
  const { data, isLoading } = useQuery({
    queryKey: ['recurring-invoices', filterStatus],
    queryFn: () => recurringInvoicesApi.list({
      status: filterStatus !== 'all' ? filterStatus : undefined,
      limit: 100,
    }),
  });

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['recurring-invoices-summary'],
    queryFn: () => recurringInvoicesApi.summary(),
  });

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients-for-ri'],
    queryFn: () => clientsApi.list({ limit: 200 }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<RecurringInvoiceItem>) => recurringInvoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices-summary'] });
      toast.success('Recurring invoice created');
      setShowCreateDialog(false);
      setNewItem({ clientId: '', frequency: 'monthly', nextDate: '', endDate: '', subtotal: '', taxRate: '', total: '', paymentTermsDays: '30', notes: '' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: (id: number) => recurringInvoicesApi.toggle(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices-summary'] });
      toast.success(`Invoice ${data.active ? 'activated' : 'paused'}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => recurringInvoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-invoices-summary'] });
      toast.success('Recurring invoice deleted');
    },
  });

  const items = data?.recurringInvoices || [];
  const clients = clientsData?.clients || [];

  const filtered = items.filter(item => {
    if (!search) return true;
    const clientName = clients.find(c => c.id === item.clientId)?.name || '';
    return clientName.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = () => {
    if (!newItem.clientId || !newItem.nextDate || !newItem.total) {
      toast.error('Client, next date, and total are required');
      return;
    }
    createMutation.mutate({
      clientId: parseInt(newItem.clientId),
      frequency: newItem.frequency,
      nextDate: newItem.nextDate,
      endDate: newItem.endDate || undefined,
      subtotal: parseFloat(newItem.subtotal || '0'),
      taxRate: parseFloat(newItem.taxRate || '0'),
      total: parseFloat(newItem.total),
      paymentTermsDays: parseInt(newItem.paymentTermsDays || '30'),
      notes: newItem.notes || undefined,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Recurring Invoices</h1>
            <p className="text-sm text-zinc-500 mt-1">Automate your billing with scheduled invoices</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> New Recurring Invoice
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={RefreshCw} label="Active" value={(summary?.activeCount || 0).toString()} sub="Auto-generating" color="bg-emerald-500" />
          <StatCard icon={Pause} label="Paused" value={(summary?.pausedCount || 0).toString()} color="bg-zinc-500" />
          <StatCard icon={IndianRupee} label="Est. Monthly Revenue" value={`₹${(summary?.estimatedMonthlyRevenue || 0).toLocaleString('en-IN')}`} color="bg-blue-500" />
          <StatCard icon={Calendar} label="Total Schedules" value={(summary?.totalCount || 0).toString()} color="bg-purple-500" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder="Search by client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-zinc-200" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {/* List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <span className="ml-2 text-zinc-500">Loading...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                <RefreshCw className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-800">No recurring invoices</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm">
                Set up automatic invoicing by creating a recurring schedule.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Create First Schedule
              </Button>
            </div>
          ) : (
            filtered.map(item => {
              const client = clients.find(c => c.id === item.clientId);
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {item.active ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                          {item.active ? 'Active' : 'Paused'}
                        </span>
                        <span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full">
                          {frequencyLabels[item.frequency] || item.frequency}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-zinc-900">
                        {client?.name || `Client #${item.clientId}`}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-zinc-500">
                        <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> ₹{Number(item.total).toLocaleString('en-IN')}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Next: {new Date(item.nextDate).toLocaleDateString('en-IN')}</span>
                        {item.endDate && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Ends: {new Date(item.endDate).toLocaleDateString('en-IN')}</span>}
                        <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {item.paymentTermsDays} day terms</span>
                      </div>
                      {item.notes && <p className="text-sm text-zinc-400 mt-2">{item.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleMutation.mutate(item.id)} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${
                        item.active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}>
                        {item.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => deleteMutation.mutate(item.id)} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateDialog(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <h2 className="text-lg font-semibold text-zinc-900">New Recurring Invoice</h2>
                <button onClick={() => setShowCreateDialog(false)} className="p-1 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Client *</label>
                  <select value={newItem.clientId} onChange={e => setNewItem({ ...newItem, clientId: e.target.value })} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm">
                    <option value="">Select a client</option>
                    {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Frequency</label>
                    <select value={newItem.frequency} onChange={e => setNewItem({ ...newItem, frequency: e.target.value })} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm">
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Payment Terms (days)</label>
                    <Input type="number" value={newItem.paymentTermsDays} onChange={e => setNewItem({ ...newItem, paymentTermsDays: e.target.value })} className="rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Next Invoice Date *</label>
                    <Input type="date" value={newItem.nextDate} onChange={e => setNewItem({ ...newItem, nextDate: e.target.value })} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">End Date</label>
                    <Input type="date" value={newItem.endDate} onChange={e => setNewItem({ ...newItem, endDate: e.target.value })} className="rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Subtotal (₹)</label>
                    <Input type="number" placeholder="0.00" value={newItem.subtotal} onChange={e => setNewItem({ ...newItem, subtotal: e.target.value })} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Tax Rate (%)</label>
                    <Input type="number" placeholder="18" value={newItem.taxRate} onChange={e => setNewItem({ ...newItem, taxRate: e.target.value })} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Total (₹) *</label>
                    <Input type="number" placeholder="0.00" value={newItem.total} onChange={e => setNewItem({ ...newItem, total: e.target.value })} className="rounded-xl font-bold" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Notes</label>
                  <textarea placeholder="Optional notes..." value={newItem.notes} onChange={e => setNewItem({ ...newItem, notes: e.target.value })} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm min-h-[80px] resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-zinc-100">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Schedule
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default RecurringInvoicesPage;
