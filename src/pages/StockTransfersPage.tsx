import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowRightLeft, Plus, Search, Truck, Package,
  CheckCircle, Clock, XCircle, RefreshCw,
  Send, ArrowRight, MapPin
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface StockTransfer {
  id: number; transferNumber: string; fromOutletName: string; toOutletName: string;
  status: string; items: any[]; totalItems: number; totalQuantity: number;
  transportMode: string | null; vehicleNumber: string | null; driverName: string | null;
  notes: string | null; transferDate: string; receivedDate: string | null;
  receivedBy: string | null; createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', in_transit: 'bg-blue-100 text-blue-700',
  received: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700',
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

const StockTransfersPage: React.FC = () => {
  const { token } = useAuth();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    fromOutletName: '', toOutletName: '',
    items: [{ productName: '', sku: '', quantity: 1, unit: 'pcs' }],
    vehicleNumber: '', driverName: '', notes: '',
  });

  const fetchTransfers = async () => {
    try {
      const res = await fetch(`${API}/stock-transfers`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTransfers(data.transfers || []);
    } catch { toast.error('Failed to load transfers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransfers(); }, []);

  const handleCreate = async () => {
    if (!form.fromOutletName || !form.toOutletName) {
      toast.error('Source and destination are required'); return;
    }
    const items = form.items.filter(i => i.productName).map(i => ({
      productName: i.productName, sku: i.sku, quantity: Number(i.quantity), unit: i.unit,
    }));

    try {
      const res = await fetch(`${API}/stock-transfers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form, fromOutletId: 0, toOutletId: 0, items,
        }),
      });
      if (res.ok) {
        toast.success('Stock transfer created');
        setShowCreate(false);
        setForm({ fromOutletName: '', toOutletName: '', items: [{ productName: '', sku: '', quantity: 1, unit: 'pcs' }], vehicleNumber: '', driverName: '', notes: '' });
        fetchTransfers();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to create');
      }
    } catch { toast.error('Network error'); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API}/stock-transfers/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, receivedBy: 'Current User' }),
      });
      if (res.ok) { toast.success(`Status updated to ${status.replace('_', ' ')}`); fetchTransfers(); }
    } catch { toast.error('Network error'); }
  };

  const filtered = transfers.filter(t =>
    t.transferNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.fromOutletName.toLowerCase().includes(search.toLowerCase()) ||
    t.toOutletName.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === 'pending').length,
    inTransit: transfers.filter(t => t.status === 'in_transit').length,
    received: transfers.filter(t => t.status === 'received').length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Stock Transfers</h1>
            <p className="text-sm text-zinc-500 mt-1">Transfer inventory between godowns, warehouses, and outlets</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> New Transfer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={ArrowRightLeft} label="Total Transfers" value={stats.total.toString()} color="bg-blue-500" />
          <StatCard icon={Clock} label="Pending" value={stats.pending.toString()} color="bg-amber-500" />
          <StatCard icon={Truck} label="In Transit" value={stats.inTransit.toString()} color="bg-indigo-500" />
          <StatCard icon={CheckCircle} label="Received" value={stats.received.toString()} color="bg-emerald-500" />
        </div>

        {showCreate && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold">New Stock Transfer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">From (Source) *</label>
                <Input value={form.fromOutletName} onChange={e => setForm({ ...form, fromOutletName: e.target.value })} placeholder="Main Warehouse" className="rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">To (Destination) *</label>
                <Input value={form.toOutletName} onChange={e => setForm({ ...form, toOutletName: e.target.value })} placeholder="Shop #2" className="rounded-xl" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2">Items to Transfer</label>
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                  <Input value={item.productName} onChange={e => { const items = [...form.items]; items[idx].productName = e.target.value; setForm({ ...form, items }); }} placeholder="Product Name" className="rounded-xl" />
                  <Input value={item.sku} onChange={e => { const items = [...form.items]; items[idx].sku = e.target.value; setForm({ ...form, items }); }} placeholder="SKU" className="rounded-xl" />
                  <Input type="number" value={item.quantity} onChange={e => { const items = [...form.items]; items[idx].quantity = Number(e.target.value); setForm({ ...form, items }); }} placeholder="Qty" className="rounded-xl" />
                  <Input value={item.unit} onChange={e => { const items = [...form.items]; items[idx].unit = e.target.value; setForm({ ...form, items }); }} placeholder="Unit" className="rounded-xl" />
                </div>
              ))}
              <button onClick={() => setForm({ ...form, items: [...form.items, { productName: '', sku: '', quantity: 1, unit: 'pcs' }] })} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                + Add Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Vehicle Number</label>
                <Input value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="MH-12-AB-1234" className="rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Driver Name</label>
                <Input value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} placeholder="Driver name" className="rounded-xl" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Create Transfer</Button>
              <Button onClick={() => setShowCreate(false)} variant="outline" className="rounded-xl">Cancel</Button>
            </div>
          </div>
        )}

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder="Search transfers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-zinc-200" />
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <ArrowRightLeft className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No stock transfers yet</p>
              <p className="text-xs mt-1">Create your first transfer to move inventory between locations</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    {['Transfer #', 'Date', 'From', 'To', 'Items', 'Total Qty', 'Vehicle', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-blue-600">{t.transferNumber}</td>
                      <td className="px-4 py-3.5 text-zinc-500">{new Date(t.transferDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-400" />
                          <span className="font-medium">{t.fromOutletName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-medium">{t.toOutletName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500">{t.totalItems} items</td>
                      <td className="px-4 py-3.5 font-bold">{Number(t.totalQuantity)}</td>
                      <td className="px-4 py-3.5 text-xs text-zinc-400">{t.vehicleNumber || '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[t.status] || ''}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1">
                          {t.status === 'pending' && (
                            <button onClick={() => handleStatusChange(t.id, 'in_transit')} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 flex items-center gap-1">
                              <Send className="w-3.5 h-3.5" /> Dispatch
                            </button>
                          )}
                          {t.status === 'in_transit' && (
                            <button onClick={() => handleStatusChange(t.id, 'received')} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Received
                            </button>
                          )}
                          {t.status === 'pending' && (
                            <button onClick={() => handleStatusChange(t.id, 'cancelled')} className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {t.receivedBy && (
                            <span className="text-xs text-zinc-400">by {t.receivedBy}</span>
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

export default StockTransfersPage;
