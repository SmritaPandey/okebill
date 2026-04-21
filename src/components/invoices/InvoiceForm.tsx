import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Search } from 'lucide-react';
import { InvoiceFormData } from '@/hooks/useInvoices';
import EWayBillSection, { EWayBillData } from './EWayBillSection';

interface HsnResult {
  code: string;
  description: string;
  gstRate: number;
}

interface InvoiceFormProps {
  clients: Array<{ id: string; name: string; stateCode?: string; gstin?: string }>;
  initialData?: InvoiceFormData;
  onSubmit: (data: InvoiceFormData) => void;
  onCancel: () => void;
  companyStateCode?: string;
}

interface InvoiceItem {
  id?: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
}

const INDIAN_STATES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa',
  '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana',
  '37': 'Andhra Pradesh (New)', '38': 'Ladakh',
};

const InvoiceForm: React.FC<InvoiceFormProps> = ({ clients, initialData, onSubmit, onCancel, companyStateCode }) => {
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [items, setItems] = useState<InvoiceItem[]>(
    initialData?.items?.length
      ? initialData.items.map(item => ({
        id: item.id,
        description: item.description,
        hsnCode: item.hsnCode || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
      : [{ description: '', hsnCode: '', quantity: 1, unitPrice: 0 }]
  );
  const [taxRate, setTaxRate] = useState(initialData?.taxRate || 18);
  const [dueDate, setDueDate] = useState(() => {
    if (initialData?.dueDate) return initialData.dueDate;
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [placeOfSupply, setPlaceOfSupply] = useState(initialData?.placeOfSupply || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eWayBill, setEWayBill] = useState<EWayBillData>({
    eWayBillNumber: initialData?.eWayBill?.eWayBillNumber || '',
    transportMode: initialData?.eWayBill?.transportMode || '',
    vehicleNumber: initialData?.eWayBill?.vehicleNumber || '',
    transporterName: initialData?.eWayBill?.transporterName || '',
    transporterGstin: initialData?.eWayBill?.transporterGstin || '',
    distanceKm: initialData?.eWayBill?.distanceKm || 0,
  });

  // HSN search state
  const [hsnQuery, setHsnQuery] = useState<Record<number, string>>({});
  const [hsnResults, setHsnResults] = useState<Record<number, HsnResult[]>>({});
  const [hsnOpen, setHsnOpen] = useState<number | null>(null);
  const hsnRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const hsnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchHsn = useCallback(async (query: string, itemIndex: number) => {
    if (query.length < 2) {
      setHsnResults(prev => ({ ...prev, [itemIndex]: [] }));
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const resp = await fetch(`${apiUrl}/hsn/search?q=${encodeURIComponent(query)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setHsnResults(prev => ({ ...prev, [itemIndex]: data.results || [] }));
        setHsnOpen(itemIndex);
      }
    } catch {
      // silently fail
    }
  }, []);

  const handleHsnInput = useCallback((index: number, value: string) => {
    updateItem(index, 'hsnCode', value);
    setHsnQuery(prev => ({ ...prev, [index]: value }));
    if (hsnTimerRef.current) clearTimeout(hsnTimerRef.current);
    hsnTimerRef.current = setTimeout(() => searchHsn(value, index), 300);
  }, [searchHsn]);

  const selectHsn = useCallback((index: number, hsn: HsnResult) => {
    updateItem(index, 'hsnCode', hsn.code);
    setHsnOpen(null);
    setHsnResults(prev => ({ ...prev, [index]: [] }));
  }, []);

  // Close HSN dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (hsnOpen !== null) {
        const ref = hsnRefs.current[hsnOpen];
        if (ref && !ref.contains(e.target as Node)) {
          setHsnOpen(null);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [hsnOpen]);

  // Auto-set place of supply from selected client
  useEffect(() => {
    if (clientId) {
      const selectedClient = clients.find(c => c.id === clientId);
      if (selectedClient?.stateCode && !placeOfSupply) {
        setPlaceOfSupply(selectedClient.stateCode);
      }
    }
  }, [clientId, clients]);

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.clientId);
      setItems(initialData.items?.length
        ? initialData.items.map(item => ({
          id: item.id,
          description: item.description,
          hsnCode: item.hsnCode || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
        : [{ description: '', hsnCode: '', quantity: 1, unitPrice: 0 }]
      );
      setTaxRate(initialData.taxRate || 18);
      setDueDate(initialData.dueDate);
      setNotes(initialData.notes || '');
      setPlaceOfSupply(initialData.placeOfSupply || '');
    }
  }, [initialData]);

  const isInterState = companyStateCode && placeOfSupply && companyStateCode !== placeOfSupply;

  const addItem = () => {
    setItems([...items, { description: '', hsnCode: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    setIsSubmitting(true);
    const hasEWayBillData = eWayBill.eWayBillNumber || eWayBill.vehicleNumber || eWayBill.transporterName;
    onSubmit({
      id: initialData?.id,
      clientId,
      items: items.filter(item => item.description.trim()),
      taxRate,
      dueDate,
      notes,
      placeOfSupply: placeOfSupply || undefined,
      eWayBill: hasEWayBillData ? eWayBill : undefined,
    });
    setIsSubmitting(false);
  };

  const isEditMode = !!initialData?.id;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Client *</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Place of Supply *</Label>
          <Select value={placeOfSupply} onValueChange={setPlaceOfSupply}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(INDIAN_STATES).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {code} - {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {placeOfSupply && companyStateCode && (
            <p className="text-xs mt-1 text-muted-foreground">
              {isInterState
                ? '⚡ Inter-state supply → IGST applies'
                : '🏠 Intra-state supply → CGST + SGST applies'
              }
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Invoice Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium">
            <div className="col-span-4">Description</div>
            <div className="col-span-2">HSN/SAC</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-3">Rate (₹)</div>
            <div className="col-span-1"></div>
          </div>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4">
                <Input
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                />
              </div>
              <div className="col-span-2 relative" ref={(el) => { hsnRefs.current[index] = el; }}>
                <div className="relative">
                  <Input
                    placeholder="Search HSN..."
                    value={item.hsnCode || ''}
                    onChange={(e) => handleHsnInput(index, e.target.value)}
                    onFocus={() => { if ((item.hsnCode || '').length >= 2) searchHsn(item.hsnCode || '', index); }}
                    maxLength={8}
                    className="pr-7 font-mono text-xs"
                  />
                  <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>
                {hsnOpen === index && hsnResults[index]?.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {hsnResults[index].map((hsn) => (
                      <button
                        key={hsn.code}
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors border-b last:border-b-0"
                        onClick={() => selectHsn(index, hsn)}
                      >
                        <span className="font-mono font-semibold text-primary">{hsn.code}</span>
                        <span className="text-muted-foreground ml-2">{hsn.description}</span>
                        <span className="float-right text-[10px] bg-muted px-1.5 py-0.5 rounded">{hsn.gstRate}%</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="1"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="taxRate">GST Rate (%)</Label>
          <Select value={String(taxRate)} onValueChange={(val) => setTaxRate(parseFloat(val))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0% (Exempt)</SelectItem>
              <SelectItem value="5">5%</SelectItem>
              <SelectItem value="12">12%</SelectItem>
              <SelectItem value="18">18%</SelectItem>
              <SelectItem value="28">28%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1"
            required
          />
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-md space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>{formatCurrency(calculateSubtotal())}</span>
        </div>
        {taxRate > 0 && (
          <>
            {isInterState ? (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>IGST ({taxRate}%):</span>
                <span>{formatCurrency(calculateTax())}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>CGST ({taxRate / 2}%):</span>
                  <span>{formatCurrency(calculateTax() / 2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>SGST ({taxRate / 2}%):</span>
                  <span>{formatCurrency(calculateTax() / 2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm border-t pt-1 mt-1">
              <span>Total GST ({taxRate}%):</span>
              <span>{formatCurrency(calculateTax())}</span>
            </div>
          </>
        )}
        <div className="flex justify-between font-semibold text-lg border-t pt-2">
          <span>Total:</span>
          <span>{formatCurrency(calculateTotal())}</span>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes for the client..."
          className="mt-1"
          rows={3}
        />
      </div>

      {/* E-Way Bill Section */}
      <EWayBillSection
        data={eWayBill}
        onChange={setEWayBill}
        invoiceTotal={calculateTotal()}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !clientId}>
          {isSubmitting
            ? (isEditMode ? 'Updating...' : 'Creating...')
            : (isEditMode ? 'Update Invoice' : 'Create Invoice')
          }
        </Button>
      </div>
    </form>
  );
};

export default InvoiceForm;
