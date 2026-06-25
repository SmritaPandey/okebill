import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { Company } from '@/hooks/useCompany';

interface PosReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  company: Company | null;
}

const PosReceiptModal: React.FC<PosReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  company,
}) => {
  if (!transaction) return null;

  const items = transaction.items || [];
  const subtotal = Number(transaction.subtotal || 0);
  const discountAmount = Number(transaction.discountAmount || 0);
  const taxAmount = Number(transaction.taxAmount || 0);
  const totalAmount = Number(transaction.totalAmount || 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const companyGstin = company?.gstin || '';
    const companyPhone = company?.phone || '';
    const companyEmail = company?.email || '';
    const companyAddress = company?.address || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt_${transaction.transactionNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              width: 72mm;
              margin: 0 auto;
              padding: 5mm 2mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .divider {
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
            .title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .header-info {
              font-size: 11px;
              margin-bottom: 4px;
            }
            .meta-table, .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;
            }
            .meta-table td {
              font-size: 11px;
              padding: 1px 0;
            }
            .items-table th, .items-table td {
              font-size: 11px;
              padding: 2px 0;
              text-align: left;
            }
            .totals-table {
              width: 100%;
              margin-top: 6px;
            }
            .totals-table td {
              font-size: 11px;
              padding: 2px 0;
            }
            .footer-msg {
              margin-top: 15px;
              font-size: 10px;
              text-align: center;
            }
            @media print {
              body {
                width: 100%;
                margin: 0;
                padding: 5mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="title">${company?.name || 'OkeBill Store'}</div>
            <div class="header-info">${companyAddress}</div>
            ${companyPhone ? `<div class="header-info">Tel: ${companyPhone}</div>` : ''}
            ${companyEmail ? `<div class="header-info">Email: ${companyEmail}</div>` : ''}
            ${companyGstin ? `<div class="header-info">GSTIN: ${companyGstin}</div>` : ''}
          </div>

          <div class="divider"></div>

          <table class="meta-table">
            <tr>
              <td class="bold" style="width: 35%;">Bill No:</td>
              <td>${transaction.transactionNumber}</td>
            </tr>
            <tr>
              <td class="bold">Date:</td>
              <td>${formatDate(transaction.transactionDate)}</td>
            </tr>
            <tr>
              <td class="bold">Customer:</td>
              <td>${transaction.customer?.name || 'Walk-in Customer'}</td>
            </tr>
            ${transaction.customer?.phone ? `
            <tr>
              <td class="bold">Phone:</td>
              <td>${transaction.customer.phone}</td>
            </tr>
            ` : ''}
          </table>

          <div class="divider"></div>

          <table class="items-table">
            <thead>
              <tr class="bold">
                <th style="width: 50%;">Item</th>
                <th style="width: 20%; text-align: center;">Qty</th>
                <th style="width: 30%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td colspan="3" class="bold" style="padding-top: 4px;">${item.product?.name || 'Product'}</td>
                </tr>
                <tr>
                  <td>${formatCurrency(Number(item.unitPrice))}</td>
                  <td style="text-align: center;">${Number(item.quantity)}</td>
                  <td style="text-align: right;">${formatCurrency(Number(item.lineTotal))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="divider"></div>

          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">${formatCurrency(subtotal)}</td>
            </tr>
            ${discountAmount > 0 ? `
            <tr>
              <td>Discount:</td>
              <td class="text-right">-${formatCurrency(discountAmount)}</td>
            </tr>
            ` : ''}
            ${taxAmount > 0 ? `
            <tr>
              <td>Tax:</td>
              <td class="text-right">${formatCurrency(taxAmount)}</td>
            </tr>
            ` : ''}
            <tr class="bold" style="font-size: 13px;">
              <td style="padding-top: 4px;">NET PAYABLE:</td>
              <td class="text-right" style="padding-top: 4px;">${formatCurrency(totalAmount)}</td>
            </tr>
          </table>

          <div class="divider"></div>

          <table class="meta-table">
            <tr>
              <td class="bold">Pay Method:</td>
              <td class="text-right capitalize">${transaction.paymentMethod || 'Cash'}</td>
            </tr>
            ${transaction.paymentReference ? `
            <tr>
              <td class="bold">Ref:</td>
              <td class="text-right">${transaction.paymentReference}</td>
            </tr>
            ` : ''}
          </table>

          <div class="divider"></div>

          <div class="footer-msg">
            <p class="bold">Thank you for your visit!</p>
            <p>Powered by OkeBill</p>
          </div>
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full rounded-2xl bg-white border border-zinc-200 p-6 flex flex-col items-center">
        <DialogHeader className="w-full flex flex-row items-center justify-between border-b pb-4 mb-4">
          <DialogTitle className="text-lg font-bold text-zinc-900">POS Bill Receipt</DialogTitle>
        </DialogHeader>

        {/* Paper Receipt Simulation */}
        <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl shadow-inner p-6 font-mono text-xs text-zinc-800 leading-normal mb-6 overflow-y-auto max-h-[350px]">
          <div className="text-center space-y-1 mb-4">
            <h3 className="font-bold text-sm text-zinc-900">{company?.name || 'OkeBill Store'}</h3>
            <p className="text-zinc-500">{company?.address || 'Store Address'}</p>
            {company?.phone && <p className="text-zinc-500">Tel: {company.phone}</p>}
            {company?.gstin && <p className="text-zinc-500 font-semibold">GSTIN: {company.gstin}</p>}
          </div>

          <div className="border-t border-dashed border-zinc-300 my-2"></div>

          <table className="w-full">
            <tbody>
              <tr>
                <td className="font-bold py-0.5" style={{ width: '35%' }}>Bill No:</td>
                <td>{transaction.transactionNumber}</td>
              </tr>
              <tr>
                <td className="font-bold py-0.5">Date:</td>
                <td>{formatDate(transaction.transactionDate)}</td>
              </tr>
              <tr>
                <td className="font-bold py-0.5">Customer:</td>
                <td>{transaction.customer?.name || 'Walk-in Customer'}</td>
              </tr>
            </tbody>
          </table>

          <div className="border-t border-dashed border-zinc-300 my-2"></div>

          <table className="w-full text-left">
            <thead>
              <tr className="font-bold border-b border-zinc-200">
                <th className="pb-1" style={{ width: '50%' }}>Item</th>
                <th className="pb-1 text-center" style={{ width: '20%' }}>Qty</th>
                <th className="pb-1 text-right" style={{ width: '30%' }}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item: any, i: number) => (
                <React.Fragment key={i}>
                  <tr>
                    <td colSpan={3} className="font-bold pt-2 text-zinc-900">
                      {item.product?.name || 'Product'}
                    </td>
                  </tr>
                  <tr className="text-zinc-500">
                    <td>{formatCurrency(Number(item.unitPrice))}</td>
                    <td className="text-center">{Number(item.quantity)}</td>
                    <td className="text-right text-zinc-900">{formatCurrency(Number(item.lineTotal))}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-zinc-300 my-2"></div>

          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-0.5 text-zinc-500">Subtotal:</td>
                <td className="text-right py-0.5">{formatCurrency(subtotal)}</td>
              </tr>
              {discountAmount > 0 && (
                <tr>
                  <td className="py-0.5 text-zinc-500">Discount:</td>
                  <td className="text-right py-0.5 text-red-600">-{formatCurrency(discountAmount)}</td>
                </tr>
              )}
              {taxAmount > 0 && (
                <tr>
                  <td className="py-0.5 text-zinc-500">Tax:</td>
                  <td className="text-right py-0.5">{formatCurrency(taxAmount)}</td>
                </tr>
              )}
              <tr className="font-bold text-sm text-zinc-900 border-t border-zinc-200 pt-1">
                <td className="pt-1">Net Payable:</td>
                <td className="text-right pt-1">{formatCurrency(totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="border-t border-dashed border-zinc-300 my-2"></div>

          <div className="flex justify-between">
            <span className="font-bold">Pay Method:</span>
            <span className="capitalize">{transaction.paymentMethod || 'Cash'}</span>
          </div>

          <div className="border-t border-dashed border-zinc-300 my-2"></div>

          <div className="text-center text-[10px] text-zinc-400 mt-4">
            <p className="font-bold">Thank you for your visit!</p>
            <p>Powered by OkeBill</p>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex gap-3 w-full">
          <Button
            onClick={handlePrint}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 h-12"
          >
            <Printer className="w-4 h-4" />
            Print Bill
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl h-12 border-zinc-200"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PosReceiptModal;
