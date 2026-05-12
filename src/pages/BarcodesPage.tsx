import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Barcode, Plus, Printer, Download, Trash2, Eye,
  RefreshCw, Settings, Grid3X3
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface BarcodeItem {
  value: string;
  label: string;
  price: string;
  quantity: number;
}

interface GeneratedBarcode {
  value: string;
  label: string;
  price: number | null;
  svg: string;
}

const BarcodesPage: React.FC = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<BarcodeItem[]>([
    { value: '', label: '', price: '', quantity: 1 },
  ]);
  const [barcodes, setBarcodes] = useState<GeneratedBarcode[]>([]);
  const [loading, setLoading] = useState(false);
  const [printHTML, setPrintHTML] = useState<string | null>(null);

  // Print settings
  const [settings, setSettings] = useState({
    labelWidth: 50, labelHeight: 30, columns: 3,
    showPrice: true, showName: true, fontSize: 8,
  });
  const [showSettings, setShowSettings] = useState(false);

  const addItem = () => {
    setItems([...items, { value: '', label: '', price: '', quantity: 1 }]);
  };

  const removeItem = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof BarcodeItem, value: string | number) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  const handleGenerate = async () => {
    const validItems = items.filter(i => i.value.trim());
    if (validItems.length === 0) {
      toast.error('Enter at least one barcode value'); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/barcodes/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: validItems.map(i => ({
            value: i.value, label: i.label || i.value,
            price: i.price ? Number(i.price) : null,
          })),
          width: 2, height: 80, showText: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBarcodes(data.barcodes || []);
        toast.success(`Generated ${data.count} barcodes`);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Generation failed');
      }
    } catch { toast.error('Network error'); }
    finally { setLoading(false); }
  };

  const handlePrintLayout = async () => {
    const validItems = items.filter(i => i.value.trim());
    if (validItems.length === 0) {
      toast.error('Generate barcodes first'); return;
    }

    try {
      const res = await fetch(`${API}/barcodes/print-layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: validItems.map(i => ({
            value: i.value, name: i.label || i.value,
            price: i.price ? Number(i.price) : null,
            quantity: i.quantity,
          })),
          ...settings,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPrintHTML(data.html);
        toast.success(`${data.totalLabels} labels ready to print`);
      }
    } catch { toast.error('Network error'); }
  };

  const handlePrint = () => {
    if (!printHTML) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printHTML);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Barcode Generator</h1>
            <p className="text-sm text-zinc-500 mt-1">Generate and print barcode labels for your products</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowSettings(!showSettings)} variant="outline" className="rounded-xl gap-2">
              <Settings className="w-4 h-4" /> Label Settings
            </Button>
            {barcodes.length > 0 && (
              <Button onClick={handlePrintLayout} variant="outline" className="rounded-xl gap-2">
                <Grid3X3 className="w-4 h-4" /> Generate Print Layout
              </Button>
            )}
            {printHTML && (
              <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                <Printer className="w-4 h-4" /> Print Labels
              </Button>
            )}
          </div>
        </div>

        {/* Settings */}
        {showSettings && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Label Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Width (mm)</label>
                <Input type="number" value={settings.labelWidth} onChange={e => setSettings({ ...settings, labelWidth: Number(e.target.value) })} className="rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Height (mm)</label>
                <Input type="number" value={settings.labelHeight} onChange={e => setSettings({ ...settings, labelHeight: Number(e.target.value) })} className="rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Columns</label>
                <Input type="number" value={settings.columns} onChange={e => setSettings({ ...settings, columns: Number(e.target.value) })} className="rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Font Size</label>
                <Input type="number" value={settings.fontSize} onChange={e => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="rounded-xl" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={settings.showName} onChange={e => setSettings({ ...settings, showName: e.target.checked })} className="rounded" />
                  Show Name
                </label>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={settings.showPrice} onChange={e => setSettings({ ...settings, showPrice: e.target.checked })} className="rounded" />
                  Show Price
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Barcode Items</h3>
            <Button onClick={addItem} variant="outline" size="sm" className="rounded-xl gap-1">
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </div>

          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-zinc-500 mb-1">
            <div className="col-span-3">Barcode Value (SKU) *</div>
            <div className="col-span-3">Product Name</div>
            <div className="col-span-2">Price (₹)</div>
            <div className="col-span-2">Label Qty</div>
            <div className="col-span-2"></div>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-3">
                <Input value={item.value} onChange={e => updateItem(idx, 'value', e.target.value)} placeholder="SKU-001" className="rounded-xl font-mono" />
              </div>
              <div className="col-span-3">
                <Input value={item.label} onChange={e => updateItem(idx, 'label', e.target.value)} placeholder="Product name" className="rounded-xl" />
              </div>
              <div className="col-span-2">
                <Input type="number" value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} placeholder="0" className="rounded-xl" />
              </div>
              <div className="col-span-2">
                <Input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value) || 1)} placeholder="1" className="rounded-xl" min={1} />
              </div>
              <div className="col-span-2 flex gap-1">
                <button onClick={() => removeItem(idx)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600" disabled={items.length === 1}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Barcode className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Generate Barcodes'}
            </Button>
          </div>
        </div>

        {/* Preview */}
        {barcodes.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Preview ({barcodes.length} barcodes)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {barcodes.map((bc, idx) => (
                <div key={idx} className="border border-zinc-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
                  {bc.label && <p className="text-xs font-semibold text-zinc-700 text-center truncate max-w-full">{bc.label}</p>}
                  <div dangerouslySetInnerHTML={{ __html: bc.svg }} className="barcode-svg w-full flex justify-center" />
                  {bc.price && <p className="text-sm font-bold text-emerald-600">₹{Number(bc.price).toLocaleString('en-IN')}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print Preview */}
        {printHTML && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Print Layout Preview</h3>
              <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                <Printer className="w-4 h-4" /> Print Now
              </Button>
            </div>
            <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
              <iframe srcDoc={printHTML} className="w-full h-96 border-0" title="Print Preview" />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default BarcodesPage;
