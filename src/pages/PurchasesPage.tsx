import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingBag, Plus, Search, FileText, ArrowLeft,
  CheckCircle, Clock, XCircle, IndianRupee, Package,
  RefreshCw, CreditCard, RotateCcw, TrendingDown
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type Tab = 'purchases' | 'returns';

interface PurchaseInvoice {
  id: number; supplierName: string; supplierGstin: string | null;
  invoiceNumber: string; purchaseType: string; status: string;
  items: any[]; subtotal: number; taxAmount: number; total: number;
  paymentStatus: string; amountPaid: number;
  invoiceDate: string; dueDate: string | null; notes: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600', received: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700',
  unpaid: 'bg-amber-100 text-amber-700', partial: 'bg-orange-100 text-orange-700',
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

const PurchasesPage: React.FC = () => {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('purchases');
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    supplierName: '', supplierGstin: '', invoiceNumber: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, hsnCode: '', taxRate: 18 }],
    paymentMethod: '', dueDate: '', notes: '',
  });

  const fetchPurchases = async () => {
    try {
      const res = await fetch(`${API}/purchases`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPurchases(data.purchases || []);
    } catch { toast.error('Failed to load purchases'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPurchases(); }, []);

  const handleCreate = async () => {
    if (!form.supplierName || !form.invoiceNumber) {
      toast.error('Supplier name and invoice number are required'); return;
    }
    const items = form.items.map(i => ({
      ...i, total: i.quantity * i.unitPrice,
      taxAmount: i.quantity * i.unitPrice * (i.taxRate / 100),
    }));
    const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    const taxAmount = items.reduce((s, i) => s + i.taxAmount, 0);
    const total = subtotal + taxAmount;

    try {
      const res = await fetch(`${API}/purchases`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, items, subtotal, taxAmount, total }),
      });
      if (res.ok) {
        toast.success('Purchase invoice recorded');
        setShowCreate(false);
        setForm({ supplierName: '', supplierGstin: '', invoiceNumber: '', items: [{ description: '', quantity: 1, unitPrice: 0, hsnCode: '', taxRate: 18 }], paymentMethod: '', dueDate: '', notes: '' });
        fetchPurchases();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to create');
      }
    } catch { toast.error('Network error'); }
  };

  const handlePayment = async (id: number) => {
    const amount = prompt('Enter payment amount (₹):');
    if (!amount || isNaN(Number(amount))) return;

    try {
      const res = await fetch(`${API}/purchases/${id}/payment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount), paymentMethod: 'bank_transfer' }),
      });
      if (res.ok) { toast.success('Payment recorded'); fetchPurchases(); }
      else { const err = await res.json(); toast.error(err.message); }
    } catch { toast.error('Network error'); }
  };

  const handleReturn = async (id: number) => {
    try {
      const res = await fetch(`${API}/purchases/${id}/return`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: 'Quality issue' }),
      });
      if (res.ok) { toast.success('Purchase return created'); fetchPurchases(); }
      else { const err = await res.json(); toast.error(err.message); }
    } catch { toast.error('Network error'); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API}/purchases/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success(`Status updated`); fetchPurchases(); }
    } catch { toast.error('Network error'); }
  };

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === 'purchases' ? p.purchaseType === 'purchase' : p.purchaseType === 'purchase_return';
    return matchesSearch && matchesTab;
  });

  const purchaseOnly = purchases.filter(p => p.purchaseType === 'purchase');
  const returnsOnly = purchases.filter(p => p.purchaseType === 'purchase_return');

  const stats = {
    totalPurchases: purchaseOnly.reduce((s, p) => s + Number(p.total), 0),
    totalPaid: purchaseOnly.reduce((s, p) => s + Number(p.amountPaid), 0),
    totalDue: purchaseOnly.reduce((s, p) => s + (Number(p.total) - Number(p.amountPaid)), 0),
    count: purchaseOnly.length,
    returnsCount: returnsOnly.length,
  };

  const tabs = [
    { id: 'purchases' as Tab, label: 'Purchase Bills', icon: ShoppingBag, count: purchaseOnly.length },
    { id: 'returns' as Tab, label: 'Purchase Returns', icon: RotateCcw, count: returnsOnly.length },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Purchases</h1>
            <p className="text-sm text-zinc-500 mt-1">Record purchase bills from suppliers, track payments, and manage returns</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
            <Plus className="w-4 h-4" /> New Purchase Bill
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={ShoppingBag} label="Total Purchases" value={`₹${stats.totalPurchases.toLocaleString('en-IN')}`} color="bg-blue-500" />
          <StatCard icon={CreditCard} label="Amount Paid" value={`₹${stats.totalPaid.toLocaleString('en-IN')}`} color="bg-emerald-500" />
          <StatCard icon={Clock} label="Amount Due" value={`₹${stats.totalDue.toLocaleString('en-IN')}`} color="bg-amber-500" />
          <StatCard icon={TrendingDown} label="Purchase Returns" value={stats.returnsCount.toString()} sub="Debit notes" color="bg-red-500" />
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Record Purchase Bill</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Supplier Name *</label>
                <Input value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} placeholder="Supplier name" className="rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Supplier GSTIN</label>
                <Input value={form.supplierGstin} onChange={e => setForm({ ...form, supplierGstin: e.target.value })} placeholder="22AAAAA0000A1Z5" className="rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Invoice Number *</label>
                <Input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="Supplier's invoice #" className="rounded-xl" />
              </div>
            </div>

            {/* Items */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2">Items</label>
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 mb-2">
                  <Input value={item.description} onChange={e => { const items = [...form.items]; items[idx].description = e.target.value; setForm({ ...form, items }); }} placeholder="Description" className="rounded-xl" />
                  <Input type="number" value={item.quantity} onChange={e => { const items = [...form.items]; items[idx].quantity = Number(e.target.value); setForm({ ...form, items }); }} placeholder="Qty" className="rounded-xl" />
                  <Input type="number" value={item.unitPrice} onChange={e => { const items = [...form.items]; items[idx].unitPrice = Number(e.target.value); setForm({ ...form, items }); }} placeholder="Unit Price" className="rounded-xl" />
                  <Input value={item.hsnCode} onChange={e => { const items = [...form.items]; items[idx].hsnCode = e.target.value; setForm({ ...form, items }); }} placeholder="HSN" className="rounded-xl" />
                  <Input type="number" value={item.taxRate} onChange={e => { const items = [...form.items]; items[idx].taxRate = Number(e.target.value); setForm({ ...form, items }); }} placeholder="Tax %" className="rounded-xl" />
                </div>
              ))}
              <button onClick={() => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0, hsnCode: '', taxRate: 18 }] })} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                + Add Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Payment Method</label>
                <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm">
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit">Credit (Pay Later)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Due Date</label>
                <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="rounded-xl" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Record Purchase</Button>
              <Button onClick={() => setShowCreate(false)} variant="outline" className="rounded-xl">Cancel</Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder="Search purchases..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-zinc-200" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No {tab === 'purchases' ? 'purchase bills' : 'purchase returns'} yet</p>
              <p className="text-xs mt-1">Record supplier purchases to track expenses and GST input credit</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    {['Invoice #', 'Date', 'Supplier', 'GSTIN', 'Total', 'Paid', 'Due', 'Payment', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredPurchases.map(p => {
                    const due = Number(p.total) - Number(p.amountPaid);
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-blue-600">{p.invoiceNumber}</td>
                        <td className="px-4 py-3.5 text-zinc-500">{new Date(p.invoiceDate).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3.5 font-medium">{p.supplierName}</td>
                        <td className="px-4 py-3.5 text-xs text-zinc-400 font-mono">{p.supplierGstin || '—'}</td>
                        <td className="px-4 py-3.5 font-bold">₹{Number(p.total).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5 text-emerald-600">₹{Number(p.amountPaid).toLocaleString('en-IN')}</td>
                        <td className={`px-4 py-3.5 font-bold ${due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          ₹{due.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[p.paymentStatus] || ''}`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[p.status] || ''}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1">
                            {p.paymentStatus !== 'paid' && p.purchaseType === 'purchase' && (
                              <button onClick={() => handlePayment(p.id)} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 flex items-center gap-1">
                                <CreditCard className="w-3.5 h-3.5" /> Pay
                              </button>
                            )}
                            {p.status === 'received' && p.purchaseType === 'purchase' && (
                              <button onClick={() => handleReturn(p.id)} className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 flex items-center gap-1">
                                <RotateCcw className="w-3.5 h-3.5" /> Return
                              </button>
                            )}
                            {p.status === 'draft' && (
                              <button onClick={() => handleStatusChange(p.id, 'received')} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">
                                Received
                              </button>
                            )}
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
      </div>
    </MainLayout>
  );
};

export default PurchasesPage;
