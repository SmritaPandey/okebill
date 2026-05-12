import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Truck, Plus, Search, FileText, ArrowRight, Eye, Download,
  CheckCircle, Clock, XCircle, IndianRupee, Package,
  Send, Ban, RefreshCw, MoreHorizontal
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface DeliveryChallan {
  id: number; challanNumber: string; clientId: number; challanType: string;
  status: string; items: any[]; subtotal: number; taxAmount: number; total: number;
  transportMode: string | null; vehicleNumber: string | null;
  transporterName: string | null; ewayBillNumber: string | null;
  issueDate: string; notes: string | null; convertedToInvoiceId: number | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600', sent: 'bg-blue-100 text-blue-700',
  converted: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700',
};

const challanTypes: Record<string, { label: string; color: string }> = {
  supply: { label: 'Supply', color: 'bg-blue-50 text-blue-600' },
  job_work: { label: 'Job Work', color: 'bg-purple-50 text-purple-600' },
  sample: { label: 'Sample', color: 'bg-amber-50 text-amber-600' },
  exhibition: { label: 'Exhibition', color: 'bg-teal-50 text-teal-600' },
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

const DeliveryChallansPage: React.FC = () => {
  const { token } = useAuth();
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    clientId: '', challanType: 'supply', items: [{ description: '', quantity: 1, unitPrice: 0, hsnCode: '' }],
    vehicleNumber: '', transporterName: '', notes: '',
  });

  const fetchChallans = async () => {
    try {
      const res = await fetch(`${API}/delivery-challans`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setChallans(data.challans || []);
    } catch { toast.error('Failed to load delivery challans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchChallans(); }, []);

  const handleCreate = async () => {
    const items = form.items.map(i => ({ ...i, total: i.quantity * i.unitPrice }));
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const taxAmount = subtotal * 0.18;
    const total = subtotal + taxAmount;

    try {
      const res = await fetch(`${API}/delivery-challans`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, clientId: Number(form.clientId), items, subtotal, taxAmount, total }),
      });
      if (res.ok) {
        toast.success('Delivery challan created');
        setShowCreate(false);
        setForm({ clientId: '', challanType: 'supply', items: [{ description: '', quantity: 1, unitPrice: 0, hsnCode: '' }], vehicleNumber: '', transporterName: '', notes: '' });
        fetchChallans();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to create');
      }
    } catch { toast.error('Network error'); }
  };

  const handleConvert = async (id: number) => {
    try {
      const res = await fetch(`${API}/delivery-challans/${id}/convert-to-invoice`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Converted to invoice');
        fetchChallans();
      } else {
        const err = await res.json();
        toast.error(err.message);
      }
    } catch { toast.error('Network error'); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API}/delivery-challans/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success(`Status updated to ${status}`); fetchChallans(); }
    } catch { toast.error('Network error'); }
  };

  const filtered = challans.filter(c =>
    c.challanNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.challanType.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: challans.length,
    draft: challans.filter(c => c.status === 'draft').length,
    sent: challans.filter(c => c.status === 'sent').length,
    converted: challans.filter(c => c.status === 'converted').length,
    totalValue: challans.reduce((s, c) => s + Number(c.total), 0),
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Delivery Challans</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Create challans for goods movement — job work, samples, exhibitions, and more
            </p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> New Delivery Challan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Total Challans" value={stats.total.toString()} color="bg-blue-500" />
          <StatCard icon={IndianRupee} label="Total Value" value={`₹${stats.totalValue.toLocaleString('en-IN')}`} color="bg-emerald-500" />
          <StatCard icon={Clock} label="Pending" value={`${stats.draft + stats.sent}`} sub="Draft + Sent" color="bg-amber-500" />
          <StatCard icon={CheckCircle} label="Converted" value={stats.converted.toString()} sub="To invoice" color="bg-teal-500" />
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold">New Delivery Challan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Client ID</label>
                <Input value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} placeholder="Client ID" className="rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Challan Type</label>
                <select value={form.challanType} onChange={e => setForm({ ...form, challanType: e.target.value })} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm">
                  <option value="supply">Supply</option>
                  <option value="job_work">Job Work</option>
                  <option value="sample">Sample / Approval</option>
                  <option value="exhibition">Exhibition</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Vehicle Number</label>
                <Input value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="MH-12-AB-1234" className="rounded-xl" />
              </div>
            </div>

            {/* Items */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2">Items</label>
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                  <Input value={item.description} onChange={e => { const items = [...form.items]; items[idx].description = e.target.value; setForm({ ...form, items }); }} placeholder="Description" className="rounded-xl" />
                  <Input type="number" value={item.quantity} onChange={e => { const items = [...form.items]; items[idx].quantity = Number(e.target.value); setForm({ ...form, items }); }} placeholder="Qty" className="rounded-xl" />
                  <Input type="number" value={item.unitPrice} onChange={e => { const items = [...form.items]; items[idx].unitPrice = Number(e.target.value); setForm({ ...form, items }); }} placeholder="Unit Price" className="rounded-xl" />
                  <Input value={item.hsnCode} onChange={e => { const items = [...form.items]; items[idx].hsnCode = e.target.value; setForm({ ...form, items }); }} placeholder="HSN Code" className="rounded-xl" />
                </div>
              ))}
              <button onClick={() => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0, hsnCode: '' }] })} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                + Add Item
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Notes</label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." className="rounded-xl" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Create Challan</Button>
              <Button onClick={() => setShowCreate(false)} variant="outline" className="rounded-xl">Cancel</Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder="Search challans..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-zinc-200" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Truck className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No delivery challans yet</p>
              <p className="text-xs mt-1">Create your first delivery challan to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    {['Challan #', 'Date', 'Type', 'Total', 'Transport', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map(dc => (
                    <tr key={dc.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-blue-600">{dc.challanNumber}</td>
                      <td className="px-4 py-3.5 text-zinc-500">{new Date(dc.issueDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${challanTypes[dc.challanType]?.color || 'bg-zinc-100'}`}>
                          {challanTypes[dc.challanType]?.label || dc.challanType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold">₹{Number(dc.total).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5 text-zinc-500 text-xs">
                        {dc.vehicleNumber && <span className="bg-zinc-100 px-2 py-0.5 rounded">{dc.vehicleNumber}</span>}
                        {dc.transporterName && <span className="ml-1">{dc.transporterName}</span>}
                        {!dc.vehicleNumber && !dc.transporterName && <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[dc.status] || ''}`}>
                          {dc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1">
                          {dc.status === 'draft' && (
                            <button onClick={() => handleStatusChange(dc.id, 'sent')} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100" title="Send">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(dc.status === 'draft' || dc.status === 'sent') && (
                            <button onClick={() => handleConvert(dc.id)} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 flex items-center gap-1" title="Convert to Invoice">
                              <ArrowRight className="w-3.5 h-3.5" /> Invoice
                            </button>
                          )}
                          {dc.status === 'draft' && (
                            <button onClick={() => handleStatusChange(dc.id, 'cancelled')} className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100" title="Cancel">
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {dc.convertedToInvoiceId && (
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-mono">
                              INV #{dc.convertedToInvoiceId}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DeliveryChallansPage;
