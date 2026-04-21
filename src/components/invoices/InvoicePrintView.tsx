import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Invoice, InvoiceItem } from '@/hooks/useInvoices';
import { Client } from '@/lib/api-client';
import { Company } from '@/hooks/useCompany';
import { Printer, X, Download } from 'lucide-react';

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

// Convert number to words (Indian numbering system)
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = 'Rupees ' + convert(rupees);
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  result += ' Only';
  return result;
}

// Lighten a hex color
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round((255 - (num >> 16)) * percent));
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round((255 - ((num >> 8) & 0x00FF)) * percent));
  const b = Math.min(255, (num & 0x0000FF) + Math.round((255 - (num & 0x0000FF)) * percent));
  return `rgb(${r},${g},${b})`;
}

interface InvoicePrintViewProps {
  invoice: Invoice;
  items: InvoiceItem[];
  client?: Client;
  company?: Company | null;
  onClose: () => void;
}

const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({
  invoice,
  items,
  client,
  company,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const primaryColor = company?.primary_color || '#1E3A5F';
  const secondaryColor = company?.secondary_color || '#10B981';
  const lightBg = lightenColor(primaryColor, 0.92);
  const isInterState = invoice.supply_type === 'inter';
  const subtotal = Number(invoice.subtotal);
  const taxAmount = Number(invoice.tax_amount);
  const total = Number(invoice.total);
  const taxRate = subtotal > 0 ? (taxAmount / subtotal) * 100 : 0;

  const placeOfSupplyCode = invoice.place_of_supply || '';
  const placeOfSupplyName = placeOfSupplyCode
    ? `${placeOfSupplyCode} - ${INDIAN_STATES[placeOfSupplyCode] || 'Unknown'}`
    : '';
  const companyStateCode = company?.gstin?.substring(0, 2) || '';
  const companyStateName = companyStateCode ? `${companyStateCode} - ${INDIAN_STATES[companyStateCode] || ''}` : '';

  // Check if any items have HSN codes
  const hasHsnCodes = items.some(item => item.hsn_code);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice_${invoice.invoice_number}${client?.name ? '_' + client.name.replace(/\s+/g, '_') : ''}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
              font-size: 11px; line-height: 1.5; color: #1a1a1a;
              -webkit-print-color-adjust: exact; print-color-adjust: exact;
            }
            @page { margin: 12mm 10mm; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  const formatDateShort = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; bg: string; color: string; border: string }> = {
      paid: { label: 'PAID', bg: '#dcfce7', color: '#15803d', border: '#86efac' },
      sent: { label: 'SENT', bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
      overdue: { label: 'OVERDUE', bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
      draft: { label: 'DRAFT', bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
      cancelled: { label: 'CANCELLED', bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
    };
    return map[status] || map.draft;
  };

  const status = getStatusLabel(invoice.status);

  // ── shared cell style builder ──
  const thStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: primaryColor, color: 'white', padding: '10px 12px',
    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
    borderRight: '1px solid rgba(255,255,255,0.15)', ...extra,
  });
  const tdStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: '11px', verticalAlign: 'top', ...extra,
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-auto" style={{ border: '1px solid #e5e7eb' }}>
        {/* ── Toolbar ── */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 rounded-full" style={{ background: primaryColor }} />
            <div>
              <h2 className="text-lg font-bold" style={{ color: primaryColor }}>Invoice Preview</h2>
              <p className="text-xs text-gray-500">{invoice.invoice_number} · {client?.name || 'Client'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="gap-2" style={{ background: primaryColor }}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Save PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* ── Print Content ── */}
        <div ref={printRef} style={{ padding: '32px', fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>

            {/* ═══════════════════════════════════════════════════════════
                BRANDED TOP STRIP — colored accent bar
            ═══════════════════════════════════════════════════════════ */}
            <div style={{ height: '6px', background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`, borderRadius: '3px 3px 0 0', marginBottom: '0' }} />

            {/* ═══════════════════════════════════════════════════════════
                HEADER — Logo / Company / Invoice Title
            ═══════════════════════════════════════════════════════════ */}
            <div style={{ background: lightBg, padding: '24px 28px 20px', borderBottom: `2px solid ${primaryColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {/* Left: Company Block */}
              <div style={{ flex: 1, maxWidth: '55%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                  {company?.logo_url && (
                    <img src={company.logo_url} alt="Logo" style={{ maxWidth: '70px', maxHeight: '70px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e0e0e0', padding: '4px', background: '#fff' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: primaryColor, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                      {company?.name || 'Your Company'}
                    </div>
                    {company?.industry && (
                      <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                        {company.industry}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: '#555', lineHeight: 1.7 }}>
                  {company?.address && <div>{company.address}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '2px' }}>
                    {company?.phone && <span>📞 {company.phone}</span>}
                    {company?.email && <span>✉ {company.email}</span>}
                  </div>
                  {company?.website && <div style={{ marginTop: '1px' }}>🌐 {company.website}</div>}
                </div>
              </div>

              {/* Right: Invoice Title Block */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 600, marginBottom: '2px' }}>
                  Tax Invoice
                </div>
                <div style={{ fontSize: '30px', fontWeight: 800, color: primaryColor, lineHeight: 1, letterSpacing: '-1px' }}>
                  {invoice.invoice_number}
                </div>
                <div style={{
                  display: 'inline-block', padding: '4px 14px', borderRadius: '20px', fontSize: '9px',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '8px',
                  background: status.bg, color: status.color, border: `1.5px solid ${status.border}`,
                }}>
                  {status.label}
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                GSTIN & SUPPLY TYPE RIBBON
            ═══════════════════════════════════════════════════════════ */}
            <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '10px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <span style={{ color: '#999', fontWeight: 500 }}>Supplier GSTIN</span>
                  <div style={{ fontWeight: 700, fontSize: '12px', fontFamily: 'monospace', color: '#333', marginTop: '1px' }}>
                    {company?.gstin || '—'}
                  </div>
                </div>
                {company?.pan && (
                  <div>
                    <span style={{ color: '#999', fontWeight: 500 }}>PAN</span>
                    <div style={{ fontWeight: 700, fontSize: '12px', fontFamily: 'monospace', color: '#333', marginTop: '1px' }}>
                      {company.pan}
                    </div>
                  </div>
                )}
                {companyStateName && (
                  <div>
                    <span style={{ color: '#999', fontWeight: 500 }}>State</span>
                    <div style={{ fontWeight: 600, fontSize: '11px', color: '#333', marginTop: '1px' }}>{companyStateName}</div>
                  </div>
                )}
              </div>
              {placeOfSupplyName && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#999', fontWeight: 500 }}>Place of Supply</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px', justifyContent: 'flex-end' }}>
                    <span style={{ fontWeight: 600, fontSize: '11px', color: '#333' }}>{placeOfSupplyName}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '10px', fontSize: '8px', fontWeight: 700,
                      background: isInterState ? '#fef3c7' : '#dcfce7',
                      color: isInterState ? '#92400e' : '#166534',
                      border: `1px solid ${isInterState ? '#fde68a' : '#86efac'}`,
                    }}>
                      {isInterState ? '↗ INTER-STATE' : '↔ INTRA-STATE'}
                    </span>
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '9px', color: '#888' }}>
                    Reverse Charge: <strong style={{ color: '#333' }}>No</strong>
                  </div>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════
                BILL TO + SHIP TO + INVOICE DETAILS (3-column)
            ═══════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', padding: '20px 28px', gap: '20px', borderBottom: '1px solid #eee' }}>
              {/* Bill To */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: primaryColor, fontWeight: 700, marginBottom: '8px',
                  borderBottom: `2px solid ${primaryColor}`, paddingBottom: '4px', display: 'inline-block'
                }}>
                  Bill To
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
                  {client?.name || 'Client Name'}
                </div>
                {/* Customer ID */}
                <div style={{ marginBottom: '4px' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '9px',
                    fontWeight: 600, fontFamily: 'monospace', background: '#f0f4ff', color: primaryColor,
                    border: `1px solid ${lightenColor(primaryColor, 0.8)}`, letterSpacing: '0.5px'
                  }}>
                    {`CUST-${String(client?.id || '0').padStart(5, '0')}`}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#555', lineHeight: 1.7 }}>
                  {client?.address && <div>{client.address}</div>}
                  {client?.contactEmail && <div>✉ {client.contactEmail}</div>}
                  {client?.phone && <div>📞 {client.phone}</div>}
                </div>
                {client?.gstin && (
                  <div style={{ marginTop: '8px', background: '#f8f9fa', padding: '6px 10px', borderRadius: '4px', fontSize: '10px', border: '1px solid #eee' }}>
                    <span style={{ color: '#888' }}>GSTIN: </span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '11px' }}>{client.gstin}</strong>
                    {client.stateCode && (
                      <span style={{ color: '#888', marginLeft: '6px', fontSize: '9px' }}>
                        ({client.stateCode} - {INDIAN_STATES[client.stateCode] || ''})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Invoice Details */}
              <div style={{ width: '240px' }}>
                <div style={{
                  fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: primaryColor, fontWeight: 700, marginBottom: '8px',
                  borderBottom: `2px solid ${primaryColor}`, paddingBottom: '4px', display: 'inline-block'
                }}>
                  Invoice Details
                </div>
                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '5px 0', color: '#888', width: '90px' }}>Invoice Date</td>
                      <td style={{ padding: '5px 0', fontWeight: 600, textAlign: 'right' }}>{formatDate(invoice.issue_date)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '5px 0', color: '#888' }}>Due Date</td>
                      <td style={{ padding: '5px 0', fontWeight: 600, textAlign: 'right' }}>{formatDate(invoice.due_date)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '5px 0', color: '#888' }}>Payment Terms</td>
                      <td style={{ padding: '5px 0', fontWeight: 600, textAlign: 'right' }}>
                        {Math.ceil((new Date(invoice.due_date).getTime() - new Date(invoice.issue_date).getTime()) / (1000 * 60 * 60 * 24))} Days
                      </td>
                    </tr>
                    {invoice.sent_at && (
                      <tr>
                        <td style={{ padding: '5px 0', color: '#888' }}>Sent On</td>
                        <td style={{ padding: '5px 0', fontWeight: 600, textAlign: 'right' }}>{formatDateShort(invoice.sent_at)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                ITEMS TABLE — full border, professional grid
            ═══════════════════════════════════════════════════════════ */}
            <div style={{ padding: '20px 28px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${primaryColor}` }}>
                <thead>
                  <tr>
                    <th style={thStyle({ textAlign: 'center', width: '35px', borderRight: '1px solid rgba(255,255,255,0.15)' })}>#</th>
                    <th style={thStyle({ textAlign: 'left' })}>Item Description</th>
                    {hasHsnCodes && <th style={thStyle({ textAlign: 'center', width: '80px' })}>HSN/SAC</th>}
                    <th style={thStyle({ textAlign: 'center', width: '55px' })}>Qty</th>
                    <th style={thStyle({ textAlign: 'right', width: '105px' })}>Rate (₹)</th>
                    {taxRate > 0 && <th style={thStyle({ textAlign: 'center', width: '60px' })}>GST %</th>}
                    <th style={thStyle({ textAlign: 'right', width: '110px', borderRight: 'none' })}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <tr key={item.id || index} style={{ background: index % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={tdStyle({ textAlign: 'center', color: '#999', fontWeight: 600, borderLeft: '1px solid #eee' })}>{index + 1}</td>
                        <td style={tdStyle({ fontWeight: 500 })}>{item.description}</td>
                        {hasHsnCodes && <td style={tdStyle({ textAlign: 'center', fontFamily: 'monospace', fontSize: '10px', color: '#555' })}>{item.hsn_code || '—'}</td>}
                        <td style={tdStyle({ textAlign: 'center' })}>{item.quantity}</td>
                        <td style={tdStyle({ textAlign: 'right', fontFamily: 'monospace' })}>{formatCurrency(item.unit_price)}</td>
                        {taxRate > 0 && <td style={tdStyle({ textAlign: 'center', fontSize: '10px' })}>{taxRate.toFixed(0)}%</td>}
                        <td style={tdStyle({ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', borderRight: '1px solid #eee' })}>{formatCurrency(item.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={tdStyle({ textAlign: 'center', color: '#999', borderLeft: '1px solid #eee' })}>1</td>
                      <td style={tdStyle({ fontWeight: 500 })}>Professional Services</td>
                      {hasHsnCodes && <td style={tdStyle({ textAlign: 'center' })}>—</td>}
                      <td style={tdStyle({ textAlign: 'center' })}>1</td>
                      <td style={tdStyle({ textAlign: 'right', fontFamily: 'monospace' })}>{formatCurrency(subtotal)}</td>
                      {taxRate > 0 && <td style={tdStyle({ textAlign: 'center', fontSize: '10px' })}>{taxRate.toFixed(0)}%</td>}
                      <td style={tdStyle({ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', borderRight: '1px solid #eee' })}>{formatCurrency(subtotal)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                TOTALS AREA — amount in words + tax summary + total
            ═══════════════════════════════════════════════════════════ */}
            <div style={{ padding: '0 28px 20px', display: 'flex', justifyContent: 'space-between', gap: '24px', marginTop: '16px' }}>
              {/* Left: Amount in Words */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: primaryColor, fontWeight: 700, marginBottom: '6px' }}>
                  Total Amount in Words
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#333', fontStyle: 'italic', lineHeight: 1.5, padding: '8px 12px', background: lightBg, borderRadius: '4px', borderLeft: `3px solid ${primaryColor}` }}>
                  {numberToWords(total)}
                </div>

                {/* Tax Breakup Summary Table */}
                {taxRate > 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: primaryColor, fontWeight: 700, marginBottom: '6px' }}>
                      Tax Breakup Summary
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', fontSize: '10px' }}>
                      <thead>
                        <tr>
                          <th style={{ background: '#f8f9fa', padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>Taxable Value</th>
                          {isInterState ? (
                            <>
                              <th style={{ background: '#f8f9fa', padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>IGST Rate</th>
                              <th style={{ background: '#f8f9fa', padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>IGST Amt</th>
                            </>
                          ) : (
                            <>
                              <th style={{ background: '#f8f9fa', padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>CGST Rate</th>
                              <th style={{ background: '#f8f9fa', padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>CGST Amt</th>
                              <th style={{ background: '#f8f9fa', padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>SGST Rate</th>
                              <th style={{ background: '#f8f9fa', padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>SGST Amt</th>
                            </>
                          )}
                          <th style={{ background: '#f8f9fa', padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>Total Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '6px 10px', borderBottom: '1px solid #eee', fontFamily: 'monospace' }}>{formatCurrency(subtotal)}</td>
                          {isInterState ? (
                            <>
                              <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{taxRate.toFixed(1)}%</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #eee', fontFamily: 'monospace' }}>{formatCurrency(taxAmount)}</td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{(taxRate / 2).toFixed(1)}%</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #eee', fontFamily: 'monospace' }}>{formatCurrency(taxAmount / 2)}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{(taxRate / 2).toFixed(1)}%</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #eee', fontFamily: 'monospace' }}>{formatCurrency(taxAmount / 2)}</td>
                            </>
                          )}
                          <td style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: 700, fontFamily: 'monospace' }}>{formatCurrency(taxAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* HSN/SAC Summary Table */}
                {hasHsnCodes && taxRate > 0 && (() => {
                  // Group items by HSN code
                  const hsnMap = new Map<string, { taxableValue: number; quantity: number; taxRate: number }>();
                  items.forEach(item => {
                    const hsn = item.hsn_code || '-';
                    const existing = hsnMap.get(hsn) || { taxableValue: 0, quantity: 0, taxRate: taxRate };
                    existing.taxableValue += item.amount;
                    existing.quantity += item.quantity;
                    hsnMap.set(hsn, existing);
                  });
                  return (
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: primaryColor, fontWeight: 700, marginBottom: '6px' }}>
                        HSN/SAC Summary
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', fontSize: '9px' }}>
                        <thead>
                          <tr style={{ background: '#f8f9fa' }}>
                            <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>HSN/SAC</th>
                            <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>Taxable Value</th>
                            {isInterState ? (
                              <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>IGST</th>
                            ) : (
                              <>
                                <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>CGST</th>
                                <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>SGST</th>
                              </>
                            )}
                            <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: '#555', borderBottom: '1px solid #e5e7eb' }}>Total Tax</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(hsnMap.entries()).map(([hsn, data]) => {
                            const itemTax = data.taxableValue * (data.taxRate / 100);
                            return (
                              <tr key={hsn}>
                                <td style={{ padding: '4px 8px', fontFamily: 'monospace', borderBottom: '1px solid #eee' }}>{hsn}</td>
                                <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', borderBottom: '1px solid #eee' }}>{formatCurrency(data.taxableValue)}</td>
                                {isInterState ? (
                                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', borderBottom: '1px solid #eee' }}>{formatCurrency(itemTax)}</td>
                                ) : (
                                  <>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', borderBottom: '1px solid #eee' }}>{formatCurrency(itemTax / 2)}</td>
                                    <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', borderBottom: '1px solid #eee' }}>{formatCurrency(itemTax / 2)}</td>
                                  </>
                                )}
                                <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', borderBottom: '1px solid #eee' }}>{formatCurrency(itemTax)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Right: Totals Column */}
              <div style={{ width: '240px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '7px 0', color: '#666' }}>Subtotal</td>
                      <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 500, fontFamily: 'monospace' }}>{formatCurrency(subtotal)}</td>
                    </tr>
                    {taxAmount > 0 && (
                      <>
                        {isInterState ? (
                          <tr>
                            <td style={{ padding: '5px 0', color: '#888', fontSize: '10px' }}>IGST ({taxRate.toFixed(1)}%)</td>
                            <td style={{ padding: '5px 0', textAlign: 'right', color: '#888', fontSize: '10px', fontFamily: 'monospace' }}>{formatCurrency(taxAmount)}</td>
                          </tr>
                        ) : (
                          <>
                            <tr>
                              <td style={{ padding: '5px 0', color: '#888', fontSize: '10px' }}>CGST ({(taxRate / 2).toFixed(1)}%)</td>
                              <td style={{ padding: '5px 0', textAlign: 'right', color: '#888', fontSize: '10px', fontFamily: 'monospace' }}>{formatCurrency(taxAmount / 2)}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '5px 0', color: '#888', fontSize: '10px' }}>SGST ({(taxRate / 2).toFixed(1)}%)</td>
                              <td style={{ padding: '5px 0', textAlign: 'right', color: '#888', fontSize: '10px', fontFamily: 'monospace' }}>{formatCurrency(taxAmount / 2)}</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td style={{ padding: '5px 0', borderTop: '1px dashed #ddd', color: '#555', fontSize: '10px' }}>Total Tax</td>
                          <td style={{ padding: '5px 0', textAlign: 'right', borderTop: '1px dashed #ddd', fontSize: '10px', fontFamily: 'monospace' }}>{formatCurrency(taxAmount)}</td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td colSpan={2} style={{ padding: '0' }}>
                        <div style={{
                          marginTop: '8px', padding: '12px 14px',
                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                          borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 600 }}>Total Amount</span>
                          <span style={{ color: '#fff', fontSize: '18px', fontWeight: 800, fontFamily: 'monospace' }}>{formatCurrency(total)}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                E-INVOICE / IRN SECTION
            ═══════════════════════════════════════════════════════════ */}
            {invoice.irn && (
              <div style={{ margin: '0 28px 16px', border: `1.5px solid ${primaryColor}`, borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ background: primaryColor, padding: '6px 14px', fontSize: '9px', color: 'white', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  E-Invoice Details
                </div>
                <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                  <div style={{ fontSize: '10px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#888', fontWeight: 500 }}>IRN: </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', wordBreak: 'break-all', fontWeight: 600 }}>{invoice.irn}</span>
                    </div>
                    {(invoice.e_invoice_data as any)?.ackNo && (
                      <div>
                        <span style={{ color: '#888', fontWeight: 500 }}>Ack No: </span>
                        <span style={{ fontWeight: 600 }}>{(invoice.e_invoice_data as any).ackNo}</span>
                        {(invoice.e_invoice_data as any)?.ackDate && (
                          <span style={{ color: '#888', marginLeft: '8px' }}>
                            (Dated: {(invoice.e_invoice_data as any).ackDate})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {(invoice.e_invoice_data as any)?.qrCode && (
                    <div style={{ width: '90px', height: '90px', border: '2px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: '#fff', flexShrink: 0 }}>
                      <img src={(invoice.e_invoice_data as any).qrCode} alt="QR Code" style={{ width: '80px', height: '80px' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                E-WAY BILL SECTION
            ═══════════════════════════════════════════════════════════ */}
            {(invoice.eway_bill_number || invoice.vehicle_number || invoice.transporter_name) && (
              <div style={{ margin: '0 28px 16px', border: '1.5px solid #0ea5e9', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ background: '#0ea5e9', padding: '6px 14px', fontSize: '9px', color: 'white', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  🚛 E-Way Bill Details
                </div>
                <div style={{ padding: '12px 14px', background: '#fff' }}>
                  <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                    <tbody>
                      {invoice.eway_bill_number && (
                        <tr>
                          <td style={{ padding: '4px 0', color: '#888', width: '140px' }}>E-Way Bill No.</td>
                          <td style={{ padding: '4px 0', fontWeight: 700, fontFamily: 'monospace', fontSize: '11px' }}>{invoice.eway_bill_number}</td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ padding: '4px 0', color: '#888' }}>Transport Mode</td>
                        <td style={{ padding: '4px 0', fontWeight: 600, textTransform: 'capitalize' }}>
                          {invoice.transport_mode || '—'}
                        </td>
                        <td style={{ padding: '4px 0', color: '#888', width: '100px' }}>Vehicle No.</td>
                        <td style={{ padding: '4px 0', fontWeight: 600, fontFamily: 'monospace' }}>
                          {invoice.vehicle_number || '—'}
                        </td>
                      </tr>
                      {(invoice.transporter_name || invoice.transporter_gstin) && (
                        <tr>
                          <td style={{ padding: '4px 0', color: '#888' }}>Transporter</td>
                          <td style={{ padding: '4px 0', fontWeight: 600 }}>
                            {invoice.transporter_name || '—'}
                            {invoice.transporter_gstin && (
                              <span style={{ color: '#888', fontFamily: 'monospace', fontSize: '9px', marginLeft: '8px' }}>
                                (GSTIN: {invoice.transporter_gstin})
                              </span>
                            )}
                          </td>
                          {invoice.distance_km && invoice.distance_km > 0 && (
                            <>
                              <td style={{ padding: '4px 0', color: '#888' }}>Distance</td>
                              <td style={{ padding: '4px 0', fontWeight: 600 }}>{invoice.distance_km} KM</td>
                            </>
                          )}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                BANK DETAILS — structured grid
            ═══════════════════════════════════════════════════════════ */}
            {(company?.bank_name || company?.bank_account) && (
              <div style={{ margin: '0 28px 16px', background: '#f8f9fb', borderRadius: '6px', padding: '14px 18px', border: '1px solid #e8eaed' }}>
                <div style={{
                  fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: primaryColor, fontWeight: 700, marginBottom: '10px',
                  borderBottom: `2px solid ${primaryColor}`, paddingBottom: '4px', display: 'inline-block'
                }}>
                  Bank & Payment Details
                </div>
                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                  <tbody>
                    {company?.bank_name && (
                      <tr>
                        <td style={{ padding: '4px 0', color: '#888', width: '130px' }}>Bank Name</td>
                        <td style={{ padding: '4px 0', fontWeight: 600 }}>{company.bank_name}</td>
                      </tr>
                    )}
                    {company?.bank_account && (
                      <tr>
                        <td style={{ padding: '4px 0', color: '#888' }}>Account Number</td>
                        <td style={{ padding: '4px 0', fontWeight: 600, fontFamily: 'monospace' }}>{company.bank_account}</td>
                      </tr>
                    )}
                    {company?.bank_ifsc && (
                      <tr>
                        <td style={{ padding: '4px 0', color: '#888' }}>IFSC Code</td>
                        <td style={{ padding: '4px 0', fontWeight: 600, fontFamily: 'monospace' }}>{company.bank_ifsc}</td>
                      </tr>
                    )}
                    {company?.bank_branch && (
                      <tr>
                        <td style={{ padding: '4px 0', color: '#888' }}>Branch</td>
                        <td style={{ padding: '4px 0', fontWeight: 600 }}>{company.bank_branch}</td>
                      </tr>
                    )}
                    {company?.upi_id && (
                      <tr>
                        <td style={{ padding: '4px 0', color: '#888' }}>UPI ID</td>
                        <td style={{ padding: '4px 0', fontWeight: 600, fontFamily: 'monospace' }}>{company.upi_id}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                NOTES SECTION
            ═══════════════════════════════════════════════════════════ */}
            {invoice.notes && (
              <div style={{ margin: '0 28px 16px', padding: '10px 14px', background: '#fffbe6', borderRadius: '4px', border: '1px solid #fde68a', fontSize: '10px' }}>
                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</div>
                <div style={{ color: '#78350f', lineHeight: 1.6 }}>{invoice.notes}</div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                TERMS & CONDITIONS + SIGNATURE
            ═══════════════════════════════════════════════════════════ */}
            <div style={{ margin: '0 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: `1px solid #eee` }}>
              {/* Left: Terms & Footer */}
              <div style={{ maxWidth: '420px' }}>
                <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: primaryColor, fontWeight: 700, marginBottom: '6px' }}>
                  Terms & Conditions
                </div>
                <div style={{ fontSize: '9px', color: '#888', lineHeight: 1.7 }}>
                  {company?.invoice_footer || (
                    <>
                      <div>1. Payment is due by the date specified above.</div>
                      <div>2. Please include invoice number in your payment reference.</div>
                      <div>3. Late payments may attract interest as per applicable laws.</div>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Signature */}
              <div style={{ textAlign: 'center', minWidth: '160px' }}>
                <div style={{ fontSize: '9px', color: '#888', marginBottom: '4px' }}>For {company?.name || 'Company'}</div>
                {company?.signature_url ? (
                  <img src={company.signature_url} alt="Signature" style={{ maxWidth: '140px', maxHeight: '55px', objectFit: 'contain', margin: '0 auto' }} />
                ) : (
                  <div style={{ height: '40px' }} />
                )}
                <div style={{ width: '150px', borderTop: '1.5px solid #333', margin: '6px auto 0', paddingTop: '5px', fontSize: '9px', fontWeight: 600, color: '#333' }}>
                  Authorized Signatory
                </div>
                {company?.signature_url && (
                  <div style={{ fontSize: '7px', color: '#aaa', marginTop: '3px', lineHeight: 1.3 }}>
                    Digitally signed on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} via OkBill
                    <br />IT Act 2000, Section 5
                  </div>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                BOTTOM STRIP — branded footer bar
            ═══════════════════════════════════════════════════════════ */}
            <div style={{ marginTop: '20px', padding: '10px 28px', background: '#f8f9fa', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 3px 3px' }}>
              <div style={{ fontSize: '8px', color: '#bbb' }}>
                This is a computer-generated document.
                {invoice.irn && ' E-invoice generated as per GST provisions.'}
                {company?.signature_url
                  ? ' Digitally signed document.'
                  : ' No signature required.'}
              </div>
              <div style={{ fontSize: '8px', color: '#bbb' }}>
                Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' · '}
                <span style={{ color: primaryColor, fontWeight: 600 }}>{company?.name || ''}</span>
              </div>
            </div>

            {/* Bottom accent bar */}
            <div style={{ height: '4px', background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`, borderRadius: '0 0 3px 3px' }} />

          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintView;
