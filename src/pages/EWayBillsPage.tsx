import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Truck, Search, RefreshCw, FileText, CheckCircle, Clock,
  XCircle, AlertTriangle, ArrowRight, Package, MapPin,
  Hash, Calendar, IndianRupee, Plus, Eye, Ban
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface Invoice {
  id: number;
  invoiceNumber: string;
  total: number;
  status: string;
  client: { name: string; gstin?: string };
  ewayBillNumber?: string;
  transportMode?: string;
  vehicleNumber?: string;
  transporterName?: string;
  transporterGstin?: string;
  distanceKm?: number;
  placeOfSupply?: string;
  issueDate: string;
}

const EWayBillsPage: React.FC = () => {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'eligible' | 'generated'>('all');
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [generating, setGenerating] = useState(false);
  const [gstStatus, setGstStatus] = useState<any>(null);

  // Generate form state
  const [genForm, setGenForm] = useState({
    transportMode: 'road',
    vehicleNo: '',
    transporterName: '',
    transporterGstin: '',
    fromPincode: '',
    toPincode: '',
  });

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API}/invoices?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  };

  const fetchGstStatus = async () => {
    try {
      const res = await fetch(`${API}/gst/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setGstStatus(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => { fetchInvoices(); fetchGstStatus(); }, []);

  // Filter invoices
  const eligible = invoices.filter(i => Number(i.total) >= 50000);
  const generated = invoices.filter(i => i.ewayBillNumber);
  const pendingEway = eligible.filter(i => !i.ewayBillNumber && ['sent', 'paid', 'draft'].includes(i.status));

  const displayInvoices = tab === 'eligible' ? pendingEway : tab === 'generated' ? generated : eligible;

  const filtered = displayInvoices.filter(i =>
    i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    i.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (i.ewayBillNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!selectedInvoice) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API}/gst/eway-bill/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          ...genForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`E-Way Bill generated: ${data.ewayBillNo || 'Success'}`);
        setShowGenerate(false);
        setSelectedInvoice(null);
        fetchInvoices();
      } else {
        toast.error(data.error || data.message || 'Generation failed');
      }
    } catch { toast.error('Network error'); }
    finally { setGenerating(false); }
  };

  const handleCancel = async (ewbNo: string) => {
    if (!confirm(`Cancel E-Way Bill ${ewbNo}?`)) return;
    try {
      const res = await fetch(`${API}/gst/eway-bill/${ewbNo}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: 4, remark: 'Cancelled by user' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('E-Way Bill cancelled');
        fetchInvoices();
      } else {
        toast.error(data.error || 'Cancellation failed');
      }
    } catch { toast.error('Network error'); }
  };

  const openGenerate = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setGenForm({
      transportMode: inv.transportMode || 'road',
      vehicleNo: inv.vehicleNumber || '',
      transporterName: inv.transporterName || '',
      transporterGstin: inv.transporterGstin || '',
      fromPincode: '',
      toPincode: '',
    });
    setShowGenerate(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">E-Way Bills</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Generate and manage E-Way Bills for goods transportation (mandatory for invoices ≥ ₹50,000)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {gstStatus && (
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                gstStatus.gspConfigured
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {gstStatus.provider}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Package} label="Eligible Invoices" value={eligible.length.toString()} sub="≥ ₹50,000" color="bg-blue-500" />
          <StatCard icon={AlertTriangle} label="Pending E-Way Bills" value={pendingEway.length.toString()} sub="Need generation" color="bg-amber-500" />
          <StatCard icon={CheckCircle} label="Generated" value={generated.length.toString()} sub="Active bills" color="bg-emerald-500" />
          <StatCard icon={IndianRupee} label="Total Value" value={`₹${(eligible.reduce((s, i) => s + Number(i.total), 0) / 100000).toFixed(1)}L`} sub="Eligible invoice value" color="bg-indigo-500" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
          {[
            { key: 'all' as const, label: 'All Eligible', count: eligible.length },
            { key: 'eligible' as const, label: 'Pending', count: pendingEway.length },
            { key: 'generated' as const, label: 'Generated', count: generated.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {t.label} <span className="ml-1 text-xs opacity-60">({t.count})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder="Search by invoice, client, or EWB number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-zinc-200" />
        </div>

        {/* Generate Modal */}
        {showGenerate && selectedInvoice && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Generate E-Way Bill</h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  For invoice <span className="font-semibold text-blue-600">{selectedInvoice.invoiceNumber}</span> —{' '}
                  <span className="font-semibold">{selectedInvoice.client?.name}</span> —{' '}
                  <span className="font-bold text-emerald-600">₹{Number(selectedInvoice.total).toLocaleString('en-IN')}</span>
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowGenerate(false)}>✕</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Transport Mode *</Label>
                <Select value={genForm.transportMode} onValueChange={val => setGenForm({ ...genForm, transportMode: val })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="road">🚛 Road</SelectItem>
                    <SelectItem value="rail">🚂 Rail</SelectItem>
                    <SelectItem value="air">✈️ Air</SelectItem>
                    <SelectItem value="ship">🚢 Ship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Vehicle Number</Label>
                <Input value={genForm.vehicleNo} onChange={e => setGenForm({ ...genForm, vehicleNo: e.target.value.toUpperCase() })}
                  placeholder="MH12AB1234" className="rounded-xl mt-1 font-mono uppercase" maxLength={12} />
              </div>
              <div>
                <Label className="text-xs">Transporter Name</Label>
                <Input value={genForm.transporterName} onChange={e => setGenForm({ ...genForm, transporterName: e.target.value })}
                  placeholder="e.g. Blue Dart Express" className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs">Transporter GSTIN</Label>
                <Input value={genForm.transporterGstin} onChange={e => setGenForm({ ...genForm, transporterGstin: e.target.value.toUpperCase() })}
                  placeholder="e.g. 27AABCU9603R1ZM" className="rounded-xl mt-1 font-mono uppercase" maxLength={15} />
              </div>
              <div>
                <Label className="text-xs">From Pincode</Label>
                <Input value={genForm.fromPincode} onChange={e => setGenForm({ ...genForm, fromPincode: e.target.value })}
                  placeholder="400001" className="rounded-xl mt-1 font-mono" maxLength={6} />
              </div>
              <div>
                <Label className="text-xs">To Pincode</Label>
                <Input value={genForm.toPincode} onChange={e => setGenForm({ ...genForm, toPincode: e.target.value })}
                  placeholder="110001" className="rounded-xl mt-1 font-mono" maxLength={6} />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              ⚠️ E-Way Bill is mandatory under GST for transporting goods valued at ₹50,000 or above. Ensure transporter details are accurate.
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleGenerate} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                {generating ? 'Generating...' : 'Generate E-Way Bill'}
              </Button>
              <Button onClick={() => setShowGenerate(false)} variant="outline" className="rounded-xl">Cancel</Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Truck className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No {tab === 'generated' ? 'generated' : 'eligible'} E-Way Bills</p>
              <p className="text-xs mt-1">
                {tab === 'eligible'
                  ? 'All eligible invoices already have E-Way Bills generated'
                  : 'Invoices ≥ ₹50,000 will appear here for E-Way Bill generation'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    {['Invoice', 'Client', 'Date', 'Amount', 'Transport', 'E-Way Bill #', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map(inv => {
                    const hasEwb = !!inv.ewayBillNumber;
                    const isEligible = Number(inv.total) >= 50000;
                    return (
                      <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-blue-600">{inv.invoiceNumber}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-zinc-800">{inv.client?.name}</div>
                          {inv.client?.gstin && (
                            <div className="text-xs text-zinc-400 font-mono">{inv.client.gstin}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-500">{new Date(inv.issueDate).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3.5 font-bold text-zinc-900">₹{Number(inv.total).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5">
                          {inv.transportMode ? (
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-zinc-400" />
                              <span className="capitalize text-xs">{inv.transportMode}</span>
                              {inv.vehicleNumber && (
                                <span className="text-xs font-mono text-zinc-400 ml-1">{inv.vehicleNumber}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {hasEwb ? (
                            <span className="font-mono text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                              {inv.ewayBillNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-300">Not generated</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {hasEwb ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3 h-3 inline mr-1" />Active
                            </span>
                          ) : isEligible ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              <Clock className="w-3 h-3 inline mr-1" />Pending
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500">
                              Not Required
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1">
                            {!hasEwb && isEligible && (
                              <button
                                onClick={() => openGenerate(inv)}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Generate
                              </button>
                            )}
                            {hasEwb && (
                              <>
                                <button className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                <button
                                  onClick={() => handleCancel(inv.ewayBillNumber!)}
                                  className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 flex items-center gap-1"
                                >
                                  <Ban className="w-3.5 h-3.5" /> Cancel
                                </button>
                              </>
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

        {/* Info footer */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
          <h4 className="font-semibold mb-1">📋 E-Way Bill Rules</h4>
          <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
            <li>E-Way Bill is mandatory for movement of goods worth <strong>₹50,000+</strong> under GST</li>
            <li>Must be generated <strong>before</strong> the goods are transported</li>
            <li>Valid for distances up to 200km: <strong>1 day</strong>; additional 200km: <strong>+1 day each</strong></li>
            <li>Can be cancelled within <strong>24 hours</strong> of generation (only if goods haven't been verified in transit)</li>
            <li>Part-B (vehicle details) can be updated even after generation</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
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

export default EWayBillsPage;
