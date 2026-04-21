import PDFDocument from 'pdfkit';

// ─── Indian Number Formatting ─────────────────────────────
function formatINR(amount: number): string {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    const [whole, decimal] = absAmount.toFixed(2).split('.');
    // Indian grouping: last 3, then groups of 2
    const lastThree = whole.slice(-3);
    const rest = whole.slice(0, -3);
    const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (rest ? ',' : '') + lastThree;
    return `${sign}₹${formatted}.${decimal}`;
}

// ─── Number to Words (Indian) ─────────────────────────────
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
    const rupees = Math.floor(Math.abs(num));
    const paise = Math.round((Math.abs(num) - rupees) * 100);
    let result = 'Rupees ' + convert(rupees);
    if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
    result += ' Only';
    return result;
}

// ─── Interfaces ───────────────────────────────────────────
export interface InvoicePdfData {
    // Company (Seller)
    companyName: string;
    companyEmail?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyGstin?: string;
    companyPan?: string;
    companyLogo?: string; // base64 or file path
    // Client (Buyer)
    clientName: string;
    clientEmail: string;
    clientAddress?: string;
    clientGstin?: string;
    clientStateCode?: string;
    customerId?: string; // CUST-XXXXX
    // Invoice
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    status: string;
    // Items
    items: Array<{
        description: string;
        hsnCode?: string;
        quantity: number;
        unitPrice: number;
        amount: number;
        taxRate?: number;
    }>;
    // Totals
    subtotal: number;
    taxAmount: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    total: number;
    amountPaid?: number;
    balanceRemaining?: number;
    // GST
    placeOfSupply?: string;
    placeOfSupplyName?: string;
    supplyType?: string; // 'intra' | 'inter'
    reverseCharge?: boolean;
    irn?: string;
    ackNo?: string;
    ackDate?: string;
    // E-Way Bill
    ewayBillNumber?: string;
    transportMode?: string;
    vehicleNumber?: string;
    transporterName?: string;
    transporterGstin?: string;
    distanceKm?: number;
    // Extra
    notes?: string;
    termsAndConditions?: string;
    signatureName?: string;
    signatureDesignation?: string;
    bankDetails?: {
        accountNo?: string;
        ifsc?: string;
        bankName?: string;
        branch?: string;
        upiId?: string;
    };
}

export function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width - 80;
        const leftMargin = 40;
        const rightEdge = doc.page.width - 40;
        const isInter = data.supplyType === 'inter';

        // ════════════════════════════════════════════════
        // HEADER BAND
        // ════════════════════════════════════════════════
        doc.rect(0, 0, doc.page.width, 100).fill('#1E3A5F');

        // Company name
        doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
            .text(data.companyName, leftMargin, 25);

        // Tax Invoice label
        doc.fontSize(10).font('Helvetica').fillColor('#7CB3D4')
            .text('TAX INVOICE', leftMargin, 55);

        // Invoice number + status (right side)
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
            .text(data.invoiceNumber, 350, 25, { width: rightEdge - 350, align: 'right' });

        const statusColors: Record<string, string> = {
            paid: '#22c55e', overdue: '#ef4444', sent: '#3b82f6', draft: '#94a3b8', cancelled: '#6b7280',
        };
        const statusColor = statusColors[data.status] || '#f59e0b';
        doc.fontSize(10).font('Helvetica-Bold').fillColor(statusColor)
            .text(data.status.toUpperCase(), 350, 50, { width: rightEdge - 350, align: 'right' });

        // GSTIN under header
        if (data.companyGstin) {
            doc.fontSize(8).font('Helvetica').fillColor('#7CB3D4')
                .text(`GSTIN: ${data.companyGstin}`, leftMargin, 72);
        }
        if (data.companyPan) {
            doc.fontSize(8).text(`PAN: ${data.companyPan}`, leftMargin, 84);
        }

        // ════════════════════════════════════════════════
        // BILL TO / INVOICE INFO
        // ════════════════════════════════════════════════
        let y = 115;

        // Left: Bill To
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text('BILL TO', leftMargin, y);
        y += 12;
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1f2937').text(data.clientName, leftMargin, y);
        y += 16;
        if (data.customerId) {
            doc.fontSize(8).font('Helvetica').fillColor('#3b82f6').text(data.customerId, leftMargin, y);
            y += 12;
        }
        doc.fontSize(9).font('Helvetica').fillColor('#4b5563');
        if (data.clientEmail) { doc.text(data.clientEmail, leftMargin, y); y += 12; }
        if (data.clientAddress) { doc.text(data.clientAddress, leftMargin, y, { width: 250 }); y += 12; }
        if (data.clientGstin) {
            doc.font('Helvetica-Bold').fillColor('#374151').text(`GSTIN: ${data.clientGstin}`, leftMargin, y);
            y += 12;
        }

        // Right: Invoice Details
        let ry = 115;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280')
            .text('INVOICE DETAILS', 350, ry, { width: rightEdge - 350, align: 'right' });
        ry += 14;
        doc.fontSize(9).font('Helvetica').fillColor('#4b5563');
        doc.text(`Issue Date: ${data.issueDate}`, 350, ry, { width: rightEdge - 350, align: 'right' }); ry += 13;
        doc.text(`Due Date: ${data.dueDate}`, 350, ry, { width: rightEdge - 350, align: 'right' }); ry += 13;
        if (data.placeOfSupplyName) {
            doc.text(`Place of Supply: ${data.placeOfSupplyName} (${data.placeOfSupply || ''})`, 350, ry, { width: rightEdge - 350, align: 'right' }); ry += 13;
        }
        if (data.supplyType) {
            doc.text(`Supply Type: ${isInter ? 'Inter-State' : 'Intra-State'}`, 350, ry, { width: rightEdge - 350, align: 'right' }); ry += 13;
        }
        if (data.reverseCharge) {
            doc.font('Helvetica-Bold').fillColor('#1E3A5F')
                .text('Reverse Charge: YES', 350, ry, { width: rightEdge - 350, align: 'right' }); ry += 13;
        }

        // ════════════════════════════════════════════════
        // ITEMS TABLE
        // ════════════════════════════════════════════════
        const tableTop = Math.max(y, ry) + 15;

        // Table header
        doc.rect(leftMargin, tableTop, pageWidth, 22).fill('#f1f5f9');
        doc.fillColor('#334155').fontSize(7).font('Helvetica-Bold');
        doc.text('#', leftMargin + 5, tableTop + 7, { width: 15 });
        doc.text('DESCRIPTION', leftMargin + 22, tableTop + 7, { width: 150 });
        doc.text('HSN/SAC', leftMargin + 175, tableTop + 7, { width: 55 });
        doc.text('QTY', leftMargin + 235, tableTop + 7, { width: 35, align: 'center' });
        doc.text('RATE (₹)', leftMargin + 275, tableTop + 7, { width: 60, align: 'right' });
        doc.text('TAX %', leftMargin + 340, tableTop + 7, { width: 35, align: 'center' });
        doc.text('AMOUNT (₹)', leftMargin + 385, tableTop + 7, { width: pageWidth - 385, align: 'right' });

        // Table rows
        let ty = tableTop + 26;
        doc.font('Helvetica').fontSize(8).fillColor('#1f2937');
        data.items.forEach((item, i) => {
            const bgColor = i % 2 === 0 ? '#ffffff' : '#f8fafc';
            doc.rect(leftMargin, ty - 3, pageWidth, 20).fill(bgColor);
            doc.fillColor('#1f2937');
            doc.text(String(i + 1), leftMargin + 5, ty, { width: 15 });
            doc.text(item.description, leftMargin + 22, ty, { width: 150 });
            doc.text(item.hsnCode || '-', leftMargin + 175, ty, { width: 55 });
            doc.text(String(item.quantity), leftMargin + 235, ty, { width: 35, align: 'center' });
            doc.text(formatINR(item.unitPrice).replace('₹', ''), leftMargin + 275, ty, { width: 60, align: 'right' });
            doc.text(item.taxRate ? `${item.taxRate}%` : '-', leftMargin + 340, ty, { width: 35, align: 'center' });
            doc.text(formatINR(item.amount).replace('₹', ''), leftMargin + 385, ty, { width: pageWidth - 385, align: 'right' });
            ty += 20;
        });

        // ════════════════════════════════════════════════
        // TOTALS
        // ════════════════════════════════════════════════
        ty += 8;
        const totalsX = 340;
        const totalsW = rightEdge - totalsX;

        doc.moveTo(totalsX, ty).lineTo(rightEdge, ty).stroke('#e2e8f0');
        ty += 8;

        // Subtotal
        doc.fontSize(9).font('Helvetica').fillColor('#64748b')
            .text('Subtotal', totalsX, ty, { width: totalsW / 2 });
        doc.font('Helvetica-Bold').fillColor('#1f2937')
            .text(formatINR(data.subtotal), totalsX + totalsW / 2, ty, { width: totalsW / 2, align: 'right' });
        ty += 16;

        // Tax breakup
        if (isInter && data.igst !== undefined) {
            doc.font('Helvetica').fillColor('#64748b')
                .text('IGST', totalsX, ty, { width: totalsW / 2 });
            doc.font('Helvetica-Bold').fillColor('#1f2937')
                .text(formatINR(data.igst), totalsX + totalsW / 2, ty, { width: totalsW / 2, align: 'right' });
            ty += 16;
        } else {
            if (data.cgst !== undefined) {
                doc.font('Helvetica').fillColor('#64748b')
                    .text('CGST', totalsX, ty, { width: totalsW / 2 });
                doc.font('Helvetica-Bold').fillColor('#1f2937')
                    .text(formatINR(data.cgst), totalsX + totalsW / 2, ty, { width: totalsW / 2, align: 'right' });
                ty += 16;
            }
            if (data.sgst !== undefined) {
                doc.font('Helvetica').fillColor('#64748b')
                    .text('SGST', totalsX, ty, { width: totalsW / 2 });
                doc.font('Helvetica-Bold').fillColor('#1f2937')
                    .text(formatINR(data.sgst), totalsX + totalsW / 2, ty, { width: totalsW / 2, align: 'right' });
                ty += 16;
            }
        }

        // Total line
        doc.moveTo(totalsX, ty).lineTo(rightEdge, ty).stroke('#1E3A5F');
        ty += 8;

        doc.fontSize(13).font('Helvetica-Bold').fillColor('#1E3A5F')
            .text('Total', totalsX, ty, { width: totalsW / 2 });
        doc.text(formatINR(data.total), totalsX + totalsW / 2, ty, { width: totalsW / 2, align: 'right' });
        ty += 20;

        // Paid / Balance
        if (data.amountPaid && data.amountPaid > 0) {
            doc.fontSize(9).font('Helvetica').fillColor('#22c55e')
                .text('Amount Paid', totalsX, ty, { width: totalsW / 2 });
            doc.text(`- ${formatINR(data.amountPaid)}`, totalsX + totalsW / 2, ty, { width: totalsW / 2, align: 'right' });
            ty += 16;
            if (data.balanceRemaining !== undefined) {
                doc.font('Helvetica-Bold').fillColor('#1E3A5F')
                    .text('Balance Due', totalsX, ty, { width: totalsW / 2 });
                doc.text(formatINR(data.balanceRemaining), totalsX + totalsW / 2, ty, { width: totalsW / 2, align: 'right' });
                ty += 16;
            }
        }

        // ════════════════════════════════════════════════
        // AMOUNT IN WORDS (left of totals)
        // ════════════════════════════════════════════════
        const wordsY = tableTop + 26 + data.items.length * 20 + 12;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280')
            .text('AMOUNT IN WORDS', leftMargin, wordsY);
        doc.fontSize(9).font('Helvetica').fillColor('#1f2937')
            .text(numberToWords(data.total), leftMargin, wordsY + 12, { width: 280 });

        // ════════════════════════════════════════════════
        // HSN SUMMARY (if items have HSN codes)
        // ════════════════════════════════════════════════
        const hsnItems = data.items.filter(item => item.hsnCode);
        let currentY = ty + 10;
        if (hsnItems.length > 0) {
            // Group by HSN
            const hsnMap = new Map<string, { taxable: number; cgst: number; sgst: number; igst: number; total: number }>();
            hsnItems.forEach(item => {
                const key = item.hsnCode!;
                const existing = hsnMap.get(key) || { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
                const taxable = item.amount;
                const tax = taxable * ((item.taxRate || 0) / 100);
                existing.taxable += taxable;
                if (isInter) {
                    existing.igst += tax;
                } else {
                    existing.cgst += tax / 2;
                    existing.sgst += tax / 2;
                }
                existing.total += taxable + tax;
                hsnMap.set(key, existing);
            });

            doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280')
                .text('HSN/SAC SUMMARY', leftMargin, currentY);
            currentY += 14;

            // HSN table header
            doc.rect(leftMargin, currentY, pageWidth, 16).fill('#f1f5f9');
            doc.fillColor('#334155').fontSize(7).font('Helvetica-Bold');
            doc.text('HSN/SAC', leftMargin + 5, currentY + 4, { width: 80 });
            doc.text('TAXABLE', leftMargin + 90, currentY + 4, { width: 70, align: 'right' });
            if (isInter) {
                doc.text('IGST', leftMargin + 165, currentY + 4, { width: 70, align: 'right' });
            } else {
                doc.text('CGST', leftMargin + 165, currentY + 4, { width: 70, align: 'right' });
                doc.text('SGST', leftMargin + 240, currentY + 4, { width: 70, align: 'right' });
            }
            doc.text('TOTAL TAX', leftMargin + 385, currentY + 4, { width: pageWidth - 390, align: 'right' });
            currentY += 20;

            doc.font('Helvetica').fontSize(7).fillColor('#1f2937');
            hsnMap.forEach((val, hsn) => {
                doc.text(hsn, leftMargin + 5, currentY, { width: 80 });
                doc.text(formatINR(val.taxable).replace('₹', ''), leftMargin + 90, currentY, { width: 70, align: 'right' });
                if (isInter) {
                    doc.text(formatINR(val.igst).replace('₹', ''), leftMargin + 165, currentY, { width: 70, align: 'right' });
                } else {
                    doc.text(formatINR(val.cgst).replace('₹', ''), leftMargin + 165, currentY, { width: 70, align: 'right' });
                    doc.text(formatINR(val.sgst).replace('₹', ''), leftMargin + 240, currentY, { width: 70, align: 'right' });
                }
                const totalTax = isInter ? val.igst : val.cgst + val.sgst;
                doc.text(formatINR(totalTax).replace('₹', ''), leftMargin + 385, currentY, { width: pageWidth - 390, align: 'right' });
                currentY += 14;
            });
            currentY += 6;
        }

        // ════════════════════════════════════════════════
        // E-WAY BILL DETAILS
        // ════════════════════════════════════════════════
        if (data.ewayBillNumber) {
            doc.rect(leftMargin, currentY, pageWidth, 18).fill('#eff6ff');
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e40af')
                .text(`E-Way Bill: ${data.ewayBillNumber}`, leftMargin + 8, currentY + 4);
            const ewayDetails = [
                data.transportMode && `Mode: ${data.transportMode}`,
                data.vehicleNumber && `Vehicle: ${data.vehicleNumber}`,
                data.distanceKm && `Distance: ${data.distanceKm} km`,
                data.transporterName && `Transporter: ${data.transporterName}`,
            ].filter(Boolean).join('  |  ');
            if (ewayDetails) {
                doc.fontSize(7).font('Helvetica').fillColor('#3b82f6')
                    .text(ewayDetails, leftMargin + 8, currentY + 14, { width: pageWidth - 16 });
                currentY += 30;
            } else {
                currentY += 22;
            }
        }

        // ════════════════════════════════════════════════
        // IRN / E-INVOICE
        // ════════════════════════════════════════════════
        if (data.irn) {
            doc.fontSize(7).font('Helvetica-Bold').fillColor('#6b7280')
                .text('E-INVOICE DETAILS', leftMargin, currentY);
            currentY += 10;
            doc.fontSize(7).font('Helvetica').fillColor('#4b5563');
            doc.text(`IRN: ${data.irn}`, leftMargin, currentY); currentY += 10;
            if (data.ackNo) { doc.text(`Ack No: ${data.ackNo}  |  Ack Date: ${data.ackDate || ''}`, leftMargin, currentY); currentY += 10; }
            currentY += 4;
        }

        // ════════════════════════════════════════════════
        // BANK DETAILS
        // ════════════════════════════════════════════════
        if (data.bankDetails && (data.bankDetails.accountNo || data.bankDetails.upiId)) {
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280')
                .text('BANK DETAILS', leftMargin, currentY);
            currentY += 12;
            doc.fontSize(8).font('Helvetica').fillColor('#374151');
            if (data.bankDetails.bankName) { doc.text(`Bank: ${data.bankDetails.bankName}${data.bankDetails.branch ? ' — ' + data.bankDetails.branch : ''}`, leftMargin, currentY); currentY += 11; }
            if (data.bankDetails.accountNo) { doc.text(`A/C No: ${data.bankDetails.accountNo}`, leftMargin, currentY); currentY += 11; }
            if (data.bankDetails.ifsc) { doc.text(`IFSC: ${data.bankDetails.ifsc}`, leftMargin, currentY); currentY += 11; }
            if (data.bankDetails.upiId) { doc.text(`UPI: ${data.bankDetails.upiId}`, leftMargin, currentY); currentY += 11; }
            currentY += 6;
        }

        // ════════════════════════════════════════════════
        // NOTES
        // ════════════════════════════════════════════════
        if (data.notes) {
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text('NOTES', leftMargin, currentY);
            currentY += 11;
            doc.font('Helvetica').fillColor('#4b5563').text(data.notes, leftMargin, currentY, { width: pageWidth });
            currentY += 20;
        }

        // ════════════════════════════════════════════════
        // TERMS & CONDITIONS
        // ════════════════════════════════════════════════
        if (data.termsAndConditions) {
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text('TERMS & CONDITIONS', leftMargin, currentY);
            currentY += 11;
            doc.fontSize(7).font('Helvetica').fillColor('#64748b')
                .text(data.termsAndConditions, leftMargin, currentY, { width: pageWidth });
            currentY += 20;
        }

        // ════════════════════════════════════════════════
        // AUTHORIZED SIGNATORY
        // ════════════════════════════════════════════════
        const sigY = Math.max(currentY + 10, doc.page.height - 130);

        doc.moveTo(rightEdge - 180, sigY).lineTo(rightEdge, sigY).stroke('#cbd5e1');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#1f2937')
            .text(data.signatureName || data.companyName, rightEdge - 180, sigY + 6, { width: 180, align: 'center' });
        if (data.signatureDesignation) {
            doc.fontSize(7).font('Helvetica').fillColor('#64748b')
                .text(data.signatureDesignation, rightEdge - 180, sigY + 18, { width: 180, align: 'center' });
        }
        doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
            .text('Authorized Signatory', rightEdge - 180, sigY + 30, { width: 180, align: 'center' });

        // ════════════════════════════════════════════════
        // FOOTER
        // ════════════════════════════════════════════════
        const footerY = doc.page.height - 45;
        doc.moveTo(leftMargin, footerY - 4).lineTo(rightEdge, footerY - 4).stroke('#e2e8f0');
        doc.fontSize(7).font('Helvetica').fillColor('#94a3b8');
        doc.text('This is a computer-generated document. No signature is required.', leftMargin, footerY, { width: pageWidth / 2 });
        doc.text('Powered by OkBill', leftMargin + pageWidth / 2, footerY, { width: pageWidth / 2, align: 'right' });

        doc.end();
    });
}

// ─── Proposal PDF ─────────────────────────────────────────
export interface ProposalPdfData {
    companyName: string;
    title: string;
    clientName: string;
    clientEmail: string;
    validUntil?: string;
    items: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
    total: number;
    notes?: string;
    createdAt: string;
}

export function generateProposalPdf(data: ProposalPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width - 100;

        // Header
        doc.rect(0, 0, doc.page.width, 120).fill('#1E3A5F');
        doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold').text(data.companyName, 50, 35);
        doc.fontSize(12).font('Helvetica').fillColor('#7CB3D4').text('PROPOSAL', 50, 70);
        doc.fillColor('#ffffff').fontSize(14).text(data.title, 350, 45, { width: 200, align: 'right' });

        // Details
        const detailsY = 145;
        doc.fillColor('#1f2937').fontSize(10).font('Helvetica-Bold').fillColor('#6b7280').text('PREPARED FOR', 50, detailsY);
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#1f2937').text(data.clientName, 50, detailsY + 16);
        doc.fontSize(10).font('Helvetica').fillColor('#4b5563').text(data.clientEmail, 50, detailsY + 34);

        doc.fontSize(10).font('Helvetica').fillColor('#4b5563');
        doc.text(`Date: ${data.createdAt}`, 350, detailsY + 16, { width: 200, align: 'right' });
        if (data.validUntil) {
            doc.text(`Valid Until: ${data.validUntil}`, 350, detailsY + 30, { width: 200, align: 'right' });
        }

        // Items
        const tableTop = detailsY + 70;
        doc.rect(50, tableTop, pageWidth, 24).fill('#f1f5f9');
        doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
        doc.text('ITEM', 60, tableTop + 7, { width: 220 });
        doc.text('QTY', 290, tableTop + 7, { width: 60, align: 'center' });
        doc.text('RATE', 350, tableTop + 7, { width: 80, align: 'right' });
        doc.text('AMOUNT', 440, tableTop + 7, { width: 100, align: 'right' });

        let y = tableTop + 28;
        doc.font('Helvetica').fontSize(10).fillColor('#1f2937');
        data.items.forEach((item, i) => {
            doc.rect(50, y - 4, pageWidth, 22).fill(i % 2 === 0 ? '#ffffff' : '#f8fafc');
            doc.fillColor('#1f2937');
            doc.text(item.description, 60, y, { width: 220 });
            doc.text(String(item.quantity), 290, y, { width: 60, align: 'center' });
            doc.text(formatINR(item.unitPrice), 350, y, { width: 80, align: 'right' });
            doc.text(formatINR(item.amount), 440, y, { width: 100, align: 'right' });
            y += 22;
        });

        y += 12;
        doc.moveTo(350, y).lineTo(550, y).stroke('#1E3A5F');
        y += 8;
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1E3A5F');
        doc.text('Total', 350, y, { width: 100, align: 'right' });
        doc.text(formatINR(data.total), 440, y, { width: 100, align: 'right' });

        if (data.notes) {
            y += 40;
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280').text('NOTES', 50, y);
            y += 14;
            doc.font('Helvetica').fillColor('#4b5563').text(data.notes, 50, y, { width: pageWidth });
        }

        const footerY = doc.page.height - 60;
        doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
        doc.text('Generated by OkBill — Simple | Hisab | Accurate', 50, footerY, { width: pageWidth, align: 'center' });

        doc.end();
    });
}
