import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  RotateCcw, Plus, Search, FileText, ArrowDownLeft, ArrowUpRight,
  RefreshCw, CheckCircle, Clock, XCircle, Eye, Download,
  ChevronDown, Package, IndianRupee, Calendar, Filter, MoreHorizontal
} from 'lucide-react';

type Tab = 'credit-notes' | 'debit-notes' | 'returns' | 'exchanges';
type CNStatus = 'draft' | 'issued' | 'applied' | 'closed';
type ReturnStatus = 'requested' | 'approved' | 'received' | 'inspected' | 'completed' | 'rejected';

interface CreditNote {
  id: string; number: string; date: string; invoiceRef: string;
  client: string; amount: number; gst: number; total: number;
  reason: string; status: CNStatus; refundMethod: string;
}

interface DebitNote {
  id: string; number: string; date: string; invoiceRef: string;
  supplier: string; amount: number; gst: number; total: number;
  reason: string; status: 'draft' | 'issued' | 'acknowledged' | 'settled';
}

interface ReturnRequest {
  id: string; number: string; date: string; invoiceRef: string;
  customer: string; items: { name: string; qty: number; price: number }[];
  reason: string; status: ReturnStatus; creditNoteId?: string;
}

interface Exchange {
  id: string; number: string; date: string; invoiceRef: string;
  customer: string; returnItems: { name: string; qty: number; price: number }[];
  newItems: { name: string; qty: number; price: number }[];
  priceDiff: number; status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

// Sample data
const sampleCreditNotes: CreditNote[] = [
  { id: 'cn1', number: 'CN-001', date: '2026-04-20', invoiceRef: 'INV-1042', client: 'Sharma Electronics', amount: 8500, gst: 1530, total: 10030, reason: 'Defective goods returned', status: 'issued', refundMethod: 'Bank Transfer' },
  { id: 'cn2', number: 'CN-002', date: '2026-04-18', invoiceRef: 'INV-1038', client: 'Patel Traders', amount: 3200, gst: 576, total: 3776, reason: 'Overcharged - price correction', status: 'applied', refundMethod: 'Adjusted against INV-1050' },
  { id: 'cn3', number: 'CN-003', date: '2026-04-22', invoiceRef: 'INV-1045', client: 'Kumar Enterprises', amount: 15000, gst: 2700, total: 17700, reason: 'Order cancelled before dispatch', status: 'draft', refundMethod: 'Wallet Credit' },
];

const sampleDebitNotes: DebitNote[] = [
  { id: 'dn1', number: 'DN-001', date: '2026-04-19', invoiceRef: 'PO-205', supplier: 'ABC Distributors', amount: 5000, gst: 900, total: 5900, reason: 'Short supply - 10 units missing', status: 'issued' },
  { id: 'dn2', number: 'DN-002', date: '2026-04-21', invoiceRef: 'PO-210', supplier: 'XYZ Wholesale', amount: 2200, gst: 396, total: 2596, reason: 'Quality defect in batch #445', status: 'acknowledged' },
];

const sampleReturns: ReturnRequest[] = [
  { id: 'rt1', number: 'RET-001', date: '2026-04-20', invoiceRef: 'INV-1042', customer: 'Sharma Electronics', items: [{ name: 'LED Panel 40W', qty: 5, price: 1700 }], reason: 'Defective - flickering issue', status: 'completed', creditNoteId: 'CN-001' },
  { id: 'rt2', number: 'RET-002', date: '2026-04-22', invoiceRef: 'INV-1048', customer: 'Mehta Store', items: [{ name: 'USB-C Cable 2m', qty: 20, price: 150 }, { name: 'Phone Case', qty: 10, price: 250 }], reason: 'Wrong items delivered', status: 'approved' },
  { id: 'rt3', number: 'RET-003', date: '2026-04-23', invoiceRef: 'INV-1050', customer: 'Gupta Mobiles', items: [{ name: 'Screen Protector', qty: 50, price: 80 }], reason: 'Damaged in transit', status: 'requested' },
];

const sampleExchanges: Exchange[] = [
  { id: 'ex1', number: 'EXC-001', date: '2026-04-21', invoiceRef: 'INV-1044', customer: 'Verma Traders', returnItems: [{ name: 'Bluetooth Speaker V1', qty: 3, price: 2500 }], newItems: [{ name: 'Bluetooth Speaker V2', qty: 3, price: 2800 }], priceDiff: 900, status: 'completed' },
  { id: 'ex2', number: 'EXC-002', date: '2026-04-23', invoiceRef: 'INV-1049', customer: 'Singh Electronics', returnItems: [{ name: 'Earbuds Pro', qty: 5, price: 1200 }], newItems: [{ name: 'Earbuds Lite', qty: 5, price: 800 }], priceDiff: -2000, status: 'processing' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600', issued: 'bg-blue-100 text-blue-700',
  applied: 'bg-emerald-100 text-emerald-700', closed: 'bg-gray-100 text-gray-500',
  acknowledged: 'bg-amber-100 text-amber-700', settled: 'bg-emerald-100 text-emerald-700',
  requested: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700',
  received: 'bg-indigo-100 text-indigo-700', inspected: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700', processing: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

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

const CreditNotesPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('credit-notes');
  const [search, setSearch] = useState('');
  const [showNewCN, setShowNewCN] = useState(false);
  const [showNewReturn, setShowNewReturn] = useState(false);
  const [showNewExchange, setShowNewExchange] = useState(false);

  const tabs: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: 'credit-notes', label: 'Credit Notes', icon: ArrowDownLeft, count: sampleCreditNotes.length },
    { id: 'debit-notes', label: 'Debit Notes', icon: ArrowUpRight, count: sampleDebitNotes.length },
    { id: 'returns', label: 'Returns', icon: RotateCcw, count: sampleReturns.length },
    { id: 'exchanges', label: 'Exchanges', icon: RefreshCw, count: sampleExchanges.length },
  ];

  const renderCreditNotes = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={ArrowDownLeft} label="Total Credit Notes" value={sampleCreditNotes.length.toString()} sub="This month" color="bg-blue-500" />
        <StatCard icon={IndianRupee} label="Total Value" value={`₹${sampleCreditNotes.reduce((s, c) => s + c.total, 0).toLocaleString('en-IN')}`} sub="Including GST" color="bg-emerald-500" />
        <StatCard icon={CheckCircle} label="Applied" value={sampleCreditNotes.filter(c => c.status === 'applied').length.toString()} color="bg-teal-500" />
        <StatCard icon={Clock} label="Pending" value={sampleCreditNotes.filter(c => c.status === 'draft' || c.status === 'issued').length.toString()} color="bg-amber-500" />
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-zinc-50 border-b border-zinc-200">
              {['Credit Note #', 'Date', 'Invoice Ref', 'Client', 'Amount', 'GST', 'Total', 'Reason', 'Refund Method', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {sampleCreditNotes.filter(c => c.number.toLowerCase().includes(search.toLowerCase()) || c.client.toLowerCase().includes(search.toLowerCase())).map(cn => (
                <tr key={cn.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-blue-600">{cn.number}</td>
                  <td className="px-4 py-3.5 text-zinc-500">{cn.date}</td>
                  <td className="px-4 py-3.5"><span className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono">{cn.invoiceRef}</span></td>
                  <td className="px-4 py-3.5 font-medium">{cn.client}</td>
                  <td className="px-4 py-3.5">₹{cn.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 text-zinc-400">₹{cn.gst.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 font-bold">₹{cn.total.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 text-zinc-500 max-w-[200px] truncate">{cn.reason}</td>
                  <td className="px-4 py-3.5 text-xs text-zinc-500">{cn.refundMethod}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={cn.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-zinc-100 rounded-lg" title="View"><Eye className="w-4 h-4 text-zinc-400" /></button>
                      <button className="p-1.5 hover:bg-zinc-100 rounded-lg" title="Download PDF"><Download className="w-4 h-4 text-zinc-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderDebitNotes = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={ArrowUpRight} label="Total Debit Notes" value={sampleDebitNotes.length.toString()} color="bg-orange-500" />
        <StatCard icon={IndianRupee} label="Total Value" value={`₹${sampleDebitNotes.reduce((s, d) => s + d.total, 0).toLocaleString('en-IN')}`} color="bg-red-500" />
        <StatCard icon={CheckCircle} label="Settled" value={sampleDebitNotes.filter(d => d.status === 'settled').length.toString()} color="bg-emerald-500" />
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-zinc-50 border-b border-zinc-200">
              {['Debit Note #', 'Date', 'PO Ref', 'Supplier', 'Amount', 'GST', 'Total', 'Reason', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {sampleDebitNotes.map(dn => (
                <tr key={dn.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-orange-600">{dn.number}</td>
                  <td className="px-4 py-3.5 text-zinc-500">{dn.date}</td>
                  <td className="px-4 py-3.5"><span className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono">{dn.invoiceRef}</span></td>
                  <td className="px-4 py-3.5 font-medium">{dn.supplier}</td>
                  <td className="px-4 py-3.5">₹{dn.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 text-zinc-400">₹{dn.gst.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 font-bold">₹{dn.total.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 text-zinc-500 max-w-[200px] truncate">{dn.reason}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={dn.status} /></td>
                  <td className="px-4 py-3.5">
                    <button className="p-1.5 hover:bg-zinc-100 rounded-lg"><Eye className="w-4 h-4 text-zinc-400" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderReturns = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={RotateCcw} label="Total Returns" value={sampleReturns.length.toString()} color="bg-purple-500" />
        <StatCard icon={Clock} label="Pending Approval" value={sampleReturns.filter(r => r.status === 'requested').length.toString()} color="bg-amber-500" />
        <StatCard icon={Package} label="Awaiting Receipt" value={sampleReturns.filter(r => r.status === 'approved').length.toString()} color="bg-blue-500" />
        <StatCard icon={CheckCircle} label="Completed" value={sampleReturns.filter(r => r.status === 'completed').length.toString()} color="bg-emerald-500" />
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-zinc-50 border-b border-zinc-200">
              {['Return #', 'Date', 'Invoice', 'Customer', 'Items', 'Total Value', 'Reason', 'Credit Note', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {sampleReturns.map(ret => {
                const totalVal = ret.items.reduce((s, i) => s + i.qty * i.price, 0);
                return (
                  <tr key={ret.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-purple-600">{ret.number}</td>
                    <td className="px-4 py-3.5 text-zinc-500">{ret.date}</td>
                    <td className="px-4 py-3.5"><span className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono">{ret.invoiceRef}</span></td>
                    <td className="px-4 py-3.5 font-medium">{ret.customer}</td>
                    <td className="px-4 py-3.5 text-zinc-500">{ret.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
                    <td className="px-4 py-3.5 font-bold">₹{totalVal.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3.5 text-zinc-500 max-w-[180px] truncate">{ret.reason}</td>
                    <td className="px-4 py-3.5">{ret.creditNoteId ? <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-mono">{ret.creditNoteId}</span> : <span className="text-zinc-300">—</span>}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={ret.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1">
                        {ret.status === 'requested' && (
                          <button onClick={() => toast.success(`Return ${ret.number} approved`)} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100">Approve</button>
                        )}
                        <button className="p-1.5 hover:bg-zinc-100 rounded-lg"><Eye className="w-4 h-4 text-zinc-400" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderExchanges = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={RefreshCw} label="Total Exchanges" value={sampleExchanges.length.toString()} color="bg-indigo-500" />
        <StatCard icon={IndianRupee} label="Net Adjustment" value={`₹${Math.abs(sampleExchanges.reduce((s, e) => s + e.priceDiff, 0)).toLocaleString('en-IN')}`} color="bg-teal-500" />
        <StatCard icon={CheckCircle} label="Completed" value={sampleExchanges.filter(e => e.status === 'completed').length.toString()} color="bg-emerald-500" />
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-zinc-50 border-b border-zinc-200">
              {['Exchange #', 'Date', 'Invoice', 'Customer', 'Return Items', 'New Items', 'Price Diff', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {sampleExchanges.map(ex => (
                <tr key={ex.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-indigo-600">{ex.number}</td>
                  <td className="px-4 py-3.5 text-zinc-500">{ex.date}</td>
                  <td className="px-4 py-3.5"><span className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono">{ex.invoiceRef}</span></td>
                  <td className="px-4 py-3.5 font-medium">{ex.customer}</td>
                  <td className="px-4 py-3.5 text-red-500 text-xs">{ex.returnItems.map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
                  <td className="px-4 py-3.5 text-emerald-600 text-xs">{ex.newItems.map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
                  <td className={`px-4 py-3.5 font-bold ${ex.priceDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {ex.priceDiff >= 0 ? '+' : ''}₹{ex.priceDiff.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={ex.status} /></td>
                  <td className="px-4 py-3.5"><button className="p-1.5 hover:bg-zinc-100 rounded-lg"><Eye className="w-4 h-4 text-zinc-400" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const getNewButtonLabel = () => {
    switch (tab) {
      case 'credit-notes': return 'New Credit Note';
      case 'debit-notes': return 'New Debit Note';
      case 'returns': return 'New Return';
      case 'exchanges': return 'New Exchange';
    }
  };

  const handleNew = () => {
    toast.success(`${getNewButtonLabel()} form opened`);
  };

  return (
    <MainLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Credit Notes & Returns</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage refunds, credit notes, debit notes, returns, and exchanges</p>
        </div>
        <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> {getNewButtonLabel()}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-500'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder={`Search ${tab.replace('-', ' ')}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl border-zinc-200"
        />
      </div>

      {/* Tab Content */}
      {tab === 'credit-notes' && renderCreditNotes()}
      {tab === 'debit-notes' && renderDebitNotes()}
      {tab === 'returns' && renderReturns()}
      {tab === 'exchanges' && renderExchanges()}
    </div>
    </MainLayout>
  );
};

export default CreditNotesPage;
