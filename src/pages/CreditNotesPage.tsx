import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { creditNotesApi, clientsApi, type CreditNoteItem } from '@/lib/api-client';
import {
  Plus, Search, ArrowDownLeft, ArrowUpRight, IndianRupee,
  CheckCircle, Clock, RotateCcw, RefreshCw, Trash2, Eye,
  X, Loader2, FileText
} from 'lucide-react';

const statusStyles: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  issued: 'bg-blue-100 text-blue-700',
  applied: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm text-zinc-500 font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold text-zinc-900">{value}</p>
  </div>
);

const CreditNotesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'credit' | 'debit'>('credit');
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newNote, setNewNote] = useState({
    type: 'credit' as 'credit' | 'debit',
    clientId: '', invoiceId: '', reason: '', subtotal: '', taxAmount: '', total: '', notes: '',
  });

  // Fetch credit notes
  const { data, isLoading } = useQuery({
    queryKey: ['credit-notes', search, activeTab],
    queryFn: () => creditNotesApi.list({
      search: search || undefined,
      type: activeTab,
      limit: 100,
    }),
  });

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['credit-notes-summary'],
    queryFn: () => creditNotesApi.summary(),
  });

  // Fetch clients for dropdown
  const { data: clientsData } = useQuery({
    queryKey: ['clients-for-cn'],
    queryFn: () => clientsApi.list({ limit: 200 }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<CreditNoteItem>) => creditNotesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['credit-notes-summary'] });
      toast.success(`${newNote.type === 'credit' ? 'Credit' : 'Debit'} note created`);
      setShowCreateDialog(false);
      setNewNote({ type: 'credit', clientId: '', invoiceId: '', reason: '', subtotal: '', taxAmount: '', total: '', notes: '' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => creditNotesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['credit-notes-summary'] });
      toast.success('Status updated');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => creditNotesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['credit-notes-summary'] });
      toast.success('Note deleted');
    },
  });

  const notes = data?.creditNotes || [];
  const clients = clientsData?.clients || [];

  const handleCreate = () => {
    if (!newNote.total || parseFloat(newNote.total) <= 0) {
      toast.error('Total amount is required');
      return;
    }
    createMutation.mutate({
      type: newNote.type,
      clientId: newNote.clientId ? parseInt(newNote.clientId) : undefined,
      invoiceId: newNote.invoiceId ? parseInt(newNote.invoiceId) : undefined,
      reason: newNote.reason,
      subtotal: parseFloat(newNote.subtotal || '0'),
      taxAmount: parseFloat(newNote.taxAmount || '0'),
      total: parseFloat(newNote.total),
      notes: newNote.notes || undefined,
    });
  };

  const tabs = [
    { id: 'credit' as const, label: 'Credit Notes', icon: ArrowDownLeft, count: summary?.creditNotesCount || 0 },
    { id: 'debit' as const, label: 'Debit Notes', icon: ArrowUpRight, count: summary?.debitNotesCount || 0 },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Credit & Debit Notes</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage adjustments, returns, and corrections</p>
          </div>
          <Button onClick={() => { setNewNote({ ...newNote, type: activeTab }); setShowCreateDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> New {activeTab === 'credit' ? 'Credit' : 'Debit'} Note
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={ArrowDownLeft} label="Total Credit Notes" value={(summary?.creditNotesCount || 0).toString()} color="bg-blue-500" />
          <StatCard icon={IndianRupee} label="Credit Value" value={`₹${(summary?.creditNotesTotal || 0).toLocaleString('en-IN')}`} color="bg-emerald-500" />
          <StatCard icon={CheckCircle} label="Applied" value={(summary?.creditNotesApplied || 0).toString()} color="bg-teal-500" />
          <StatCard icon={Clock} label="Pending" value={(summary?.creditNotesPending || 0).toString()} color="bg-amber-500" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-200 pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder={`Search ${activeTab} notes...`} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-zinc-200" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <span className="ml-2 text-zinc-500">Loading...</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-800">No {activeTab} notes yet</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm">
                Create your first {activeTab} note to track adjustments and corrections.
              </p>
              <Button onClick={() => { setNewNote({ ...newNote, type: activeTab }); setShowCreateDialog(true); }} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Create First {activeTab === 'credit' ? 'Credit' : 'Debit'} Note
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    {['Number', 'Date', 'Reason', 'Subtotal', 'Tax', 'Total', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {notes.map(note => (
                    <tr key={note.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-zinc-900">{note.creditNoteNumber}</td>
                      <td className="px-4 py-3.5 text-zinc-500">{new Date(note.issueDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3.5 text-zinc-600 max-w-[200px] truncate">{note.reason || '—'}</td>
                      <td className="px-4 py-3.5">₹{Number(note.subtotal).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5 text-zinc-400">₹{Number(note.taxAmount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5 font-bold">₹{Number(note.total).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[note.status] || statusStyles.draft}`}>
                          {note.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1">
                          {note.status === 'draft' && (
                            <button onClick={() => statusMutation.mutate({ id: note.id, status: 'issued' })} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100" title="Issue">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {note.status === 'issued' && (
                            <button onClick={() => statusMutation.mutate({ id: note.id, status: 'applied' })} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100" title="Apply">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => deleteMutation.mutate(note.id)} className="p-1.5 hover:bg-zinc-100 rounded-lg">
                            <Trash2 className="w-4 h-4 text-zinc-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateDialog(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <h2 className="text-lg font-semibold text-zinc-900">
                  New {newNote.type === 'credit' ? 'Credit' : 'Debit'} Note
                </h2>
                <button onClick={() => setShowCreateDialog(false)} className="p-1 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Type</label>
                  <select value={newNote.type} onChange={e => setNewNote({ ...newNote, type: e.target.value as 'credit' | 'debit' })} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm">
                    <option value="credit">Credit Note</option>
                    <option value="debit">Debit Note</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Client</label>
                  <select value={newNote.clientId} onChange={e => setNewNote({ ...newNote, clientId: e.target.value })} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm">
                    <option value="">Select a client (optional)</option>
                    {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Reason</label>
                  <textarea placeholder="Reason for this note..." value={newNote.reason} onChange={e => setNewNote({ ...newNote, reason: e.target.value })} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm min-h-[80px] resize-none" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Subtotal (₹)</label>
                    <Input type="number" placeholder="0.00" value={newNote.subtotal} onChange={e => {
                      const sub = e.target.value;
                      const tax = newNote.taxAmount || '0';
                      setNewNote({ ...newNote, subtotal: sub, total: (parseFloat(sub || '0') + parseFloat(tax)).toString() });
                    }} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Tax (₹)</label>
                    <Input type="number" placeholder="0.00" value={newNote.taxAmount} onChange={e => {
                      const tax = e.target.value;
                      const sub = newNote.subtotal || '0';
                      setNewNote({ ...newNote, taxAmount: tax, total: (parseFloat(sub) + parseFloat(tax || '0')).toString() });
                    }} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Total (₹) *</label>
                    <Input type="number" placeholder="0.00" value={newNote.total} onChange={e => setNewNote({ ...newNote, total: e.target.value })} className="rounded-xl font-bold" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Notes</label>
                  <Input placeholder="Optional notes..." value={newNote.notes} onChange={e => setNewNote({ ...newNote, notes: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-zinc-100">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CreditNotesPage;
