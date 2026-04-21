import { Router, Request } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { gspService } from '../services/gsp';

const router = Router();
// GST verification is public — no auth required

// GSTIN format: 2-digit state code + 10-char PAN + 1-char entity + Z + 1 check digit
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Validate GSTIN checksum (Luhn-like algorithm per GST specification)
function validateGstinChecksum(gstin: string): boolean {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let sum = 0;
    for (let i = 0; i < 14; i++) {
        const idx = chars.indexOf(gstin[i]);
        let factor = (i % 2 === 0) ? idx : idx * 2;
        const quotient = Math.floor(factor / 36);
        const remainder = factor % 36;
        sum += quotient + remainder;
    }
    const checkDigit = chars[(36 - (sum % 36)) % 36];
    return gstin[14] === checkDigit;
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

// ─── GET /gst/verify/:gstin ─────────────────────────────────
// Validates GSTIN format + checksum, then fetches details from the
// real GST portal API (same endpoint that services.gst.gov.in uses 
// internally for taxpayer search).
router.get('/verify/:gstin', async (req: Request, res) => {
    try {
        const gstin = String(req.params.gstin || '').toUpperCase().trim();

        // Step 1: Format validation
        if (!gstin || gstin.length !== 15) {
            res.status(400).json({ valid: false, message: 'GSTIN must be exactly 15 characters' });
            return;
        }
        if (!GSTIN_REGEX.test(gstin)) {
            res.status(400).json({ valid: false, message: 'Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5' });
            return;
        }

        // Step 2: Checksum validation
        if (!validateGstinChecksum(gstin)) {
            res.status(400).json({ valid: false, message: 'GSTIN checksum validation failed — this is not a valid GSTIN' });
            return;
        }

        // Step 3: Real API lookup — Master India GST API
        const stateCode = gstin.substring(0, 2);
        const stateName = INDIAN_STATES[stateCode] || 'Unknown';

        const masterIndiaApiKey = process.env.MASTER_INDIA_API_KEY;

        if (masterIndiaApiKey) {
            try {
                const apiResponse = await fetch(
                    `https://commonapi.mastersindia.co/commonapis/searchgstin?gstin=${gstin}`,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${masterIndiaApiKey}`,
                            'User-Agent': 'OkeBill/1.0',
                        },
                        signal: AbortSignal.timeout(10000),
                    }
                );

                if (apiResponse.ok) {
                    const apiData = await apiResponse.json() as any;
                    const d = apiData?.data || apiData?.result || apiData;
                    if (d && (d.lgnm || d.legalName || d.tradeNam || d.tradeName)) {
                        const address = d.pradr?.addr
                            ? [d.pradr.addr.bno, d.pradr.addr.flno, d.pradr.addr.bnm, d.pradr.addr.st,
                            d.pradr.addr.loc, d.pradr.addr.dst, d.pradr.addr.stcd, d.pradr.addr.pncd]
                                .filter(Boolean).join(', ')
                            : d.address || '';

                        res.json({
                            valid: true,
                            gstin,
                            legalName: d.lgnm || d.legalName || '',
                            tradeName: d.tradeNam || d.tradeName || '',
                            address,
                            stateCode,
                            stateName,
                            status: d.sts || d.status || 'Active',
                            registrationType: d.dty || d.registrationType || '',
                            constitutionOfBusiness: d.ctb || d.constitutionOfBusiness || '',
                            pan: gstin.substring(2, 12),
                            source: 'master_india',
                        });
                        return;
                    }
                }
            } catch (apiErr) {
                console.warn('Master India GST API error:', apiErr);
                // Fall through to derived data
            }
        } else {
            // No API key configured — try free public endpoint as best-effort
            try {
                const altResponse = await fetch(
                    `https://commonapi.mastersindia.co/commonapis/searchgstin?gstin=${gstin}`,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'OkeBill/1.0',
                        },
                        signal: AbortSignal.timeout(8000),
                    }
                );

                const altData = altResponse.ok ? await altResponse.json() as any : null;
                const d = altData?.data || altData?.result;
                if (d && (d.lgnm || d.legalName)) {
                    res.json({
                        valid: true,
                        gstin,
                        legalName: d.lgnm || d.legalName || '',
                        tradeName: d.tradeNam || d.tradeName || '',
                        address: [d.pradr?.addr?.bno, d.pradr?.addr?.st, d.pradr?.addr?.loc,
                        d.pradr?.addr?.dst, d.pradr?.addr?.stcd, d.pradr?.addr?.pncd]
                            .filter(Boolean).join(', ') || d.address || '',
                        stateCode,
                        stateName,
                        status: d.sts || d.status || 'Active',
                        registrationType: d.dty || d.registrationType || '',
                        constitutionOfBusiness: d.ctb || d.constitutionOfBusiness || '',
                        source: 'api_public',
                    });
                    return;
                }
            } catch {
                // Fall through to derived data
            }
        }

        // Step 5: Ultimate fallback — return derived data from GSTIN itself
        // PAN is embedded in positions 2-11 of GSTIN
        const pan = gstin.substring(2, 12);
        const entityType = gstin[12];
        const entityTypes: Record<string, string> = {
            '1': 'Primary', '2': 'Secondary', '3': 'Third',
            '4': 'Fourth', '5': 'Fifth', '6': 'Sixth',
            '7': 'Seventh', '8': 'Eighth', '9': 'Ninth',
        };

        res.json({
            valid: true,
            gstin,
            legalName: '',
            tradeName: '',
            address: '',
            stateCode,
            stateName,
            pan,
            entityNumber: entityTypes[entityType] || entityType,
            status: 'Format Valid — API unavailable for live verification',
            registrationType: '',
            constitutionOfBusiness: '',
            source: 'derived',
            message: 'GSTIN format and checksum are valid. Live API lookup was unavailable — enter company details manually.',
        });
    } catch (err: any) {
        res.status(500).json({ valid: false, message: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
// E-INVOICE ENDPOINTS (Authenticated)
// ═══════════════════════════════════════════════════════════

// POST /gst/e-invoice/generate — Generate e-invoice via IRP
router.post('/e-invoice/generate', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { invoiceId } = req.body;
        const invoice = await prisma.invoice.findFirst({
            where: { id: Number(invoiceId), userId: req.userId },
            include: { client: true },
        });
        if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }

        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user?.gstin) { res.status(400).json({ message: 'Company GSTIN not configured. Set it in Settings.' }); return; }
        if (!invoice.client.gstin) { res.status(400).json({ message: 'Client GSTIN is required for E-Invoice.' }); return; }

        const items = Array.isArray(invoice.items) ? (invoice.items as any[]) : [];
        const isInter = invoice.supplyType === 'inter';
        const taxAmount = Number(invoice.taxAmount);
        const invoiceDate = new Date(invoice.issueDate);
        const formattedDate = `${String(invoiceDate.getDate()).padStart(2, '0')}/${String(invoiceDate.getMonth() + 1).padStart(2, '0')}/${invoiceDate.getFullYear()}`;

        const result = await gspService.generateEInvoice({
            sellerGstin: user.gstin,
            sellerLegalName: user.companyName || user.firstName + ' ' + user.lastName,
            sellerAddress: '',
            sellerStateCode: user.gstin.substring(0, 2),
            buyerGstin: invoice.client.gstin,
            buyerLegalName: invoice.client.name,
            buyerAddress: invoice.client.address || '',
            buyerStateCode: invoice.client.gstin.substring(0, 2),
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: formattedDate,
            invoiceType: 'INV',
            supplyType: 'B2B',
            items: items.map(item => ({
                description: item.description || 'Item',
                hsnCode: item.hsnCode || item.hsn_code || '0000',
                quantity: item.quantity || 1,
                unit: 'NOS',
                unitPrice: item.unitPrice || 0,
                totalAmount: (item.quantity || 1) * (item.unitPrice || 0),
                taxRate: item.taxRate || 0,
                cgstAmount: isInter ? 0 : ((item.quantity || 1) * (item.unitPrice || 0) * ((item.taxRate || 0) / 100)) / 2,
                sgstAmount: isInter ? 0 : ((item.quantity || 1) * (item.unitPrice || 0) * ((item.taxRate || 0) / 100)) / 2,
                igstAmount: isInter ? (item.quantity || 1) * (item.unitPrice || 0) * ((item.taxRate || 0) / 100) : 0,
            })),
            totalValue: Number(invoice.subtotal),
            totalTaxableValue: Number(invoice.subtotal),
            totalCgst: isInter ? 0 : taxAmount / 2,
            totalSgst: isInter ? 0 : taxAmount / 2,
            totalIgst: isInter ? taxAmount : 0,
            totalInvoiceValue: Number(invoice.total),
            placeOfSupply: invoice.placeOfSupply || invoice.client.gstin.substring(0, 2),
            reverseCharge: false,
        });

        if (result.success) {
            // Store IRN and E-Invoice data on the invoice
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    irn: result.irn,
                    eInvoiceData: {
                        ackNo: result.ackNo,
                        ackDate: result.ackDate,
                        qrCode: result.qrCode,
                        signedInvoice: result.signedInvoice,
                        generatedAt: new Date().toISOString(),
                    },
                },
            });
        }

        res.json(result);
    } catch (err: any) {
        console.error('E-Invoice generation error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /gst/e-invoice/cancel — Cancel e-invoice
router.post('/e-invoice/cancel', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { invoiceId, reason, remark } = req.body;
        const invoice = await prisma.invoice.findFirst({
            where: { id: Number(invoiceId), userId: req.userId },
        });
        if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }
        if (!invoice.irn) { res.status(400).json({ message: 'No IRN found on this invoice' }); return; }

        const result = await gspService.cancelEInvoice(invoice.irn, reason || '1', remark || 'Cancelled');

        if (result.success) {
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: 'cancelled' },
            });
        }

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
// E-WAY BILL ENDPOINTS (Authenticated)
// ═══════════════════════════════════════════════════════════

// POST /gst/eway-bill/generate — Generate E-Way Bill
router.post('/eway-bill/generate', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { invoiceId, transportMode, vehicleNo, transporterName, transporterGstin, fromPincode, toPincode } = req.body;

        const invoice = await prisma.invoice.findFirst({
            where: { id: Number(invoiceId), userId: req.userId },
            include: { client: true },
        });
        if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }

        if (Number(invoice.total) < 50000) {
            res.status(400).json({ message: 'E-Way Bill is only required for invoices ≥ ₹50,000' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user?.gstin) { res.status(400).json({ message: 'Company GSTIN not configured' }); return; }

        const items = Array.isArray(invoice.items) ? (invoice.items as any[]) : [];
        const isInter = invoice.supplyType === 'inter';
        const taxAmount = Number(invoice.taxAmount);
        const invoiceDate = new Date(invoice.issueDate);
        const formattedDate = `${String(invoiceDate.getDate()).padStart(2, '0')}/${String(invoiceDate.getMonth() + 1).padStart(2, '0')}/${invoiceDate.getFullYear()}`;

        const TRANSPORT_MODE_MAP: Record<string, number> = { road: 1, rail: 2, air: 3, ship: 4 };

        const result = await gspService.generateEWayBill({
            supplyType: 'O',
            subSupplyType: 1,
            docType: 'INV',
            docNo: invoice.invoiceNumber,
            docDate: formattedDate,
            fromGstin: user.gstin,
            fromStateCode: user.gstin.substring(0, 2),
            fromAddress: '',
            fromPincode: fromPincode || '000000',
            toGstin: invoice.client.gstin || 'URP',
            toStateCode: invoice.client.gstin ? invoice.client.gstin.substring(0, 2) : invoice.placeOfSupply || '00',
            toAddress: invoice.client.address || '',
            toPincode: toPincode || '000000',
            totalValue: Number(invoice.subtotal),
            cgstValue: isInter ? 0 : taxAmount / 2,
            sgstValue: isInter ? 0 : taxAmount / 2,
            igstValue: isInter ? taxAmount : 0,
            cessValue: 0,
            transportMode: TRANSPORT_MODE_MAP[transportMode] || 1,
            vehicleNo: vehicleNo || undefined,
            transporterName: transporterName || undefined,
            transporterId: transporterGstin || undefined,
            items: items.map(item => ({
                productName: item.description || 'Item',
                hsnCode: item.hsnCode || item.hsn_code || '0000',
                quantity: item.quantity || 1,
                unit: 'NOS',
                taxableAmount: (item.quantity || 1) * (item.unitPrice || 0),
                cgstRate: isInter ? 0 : (item.taxRate || 0) / 2,
                sgstRate: isInter ? 0 : (item.taxRate || 0) / 2,
                igstRate: isInter ? (item.taxRate || 0) : 0,
            })),
        });

        if (result.success) {
            // Store E-Way Bill details on the invoice
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    ewayBillNumber: result.ewayBillNo,
                    transportMode: transportMode || null,
                    vehicleNumber: vehicleNo || null,
                    transporterName: transporterName || null,
                    transporterGstin: transporterGstin || null,
                },
            });
        }

        res.json(result);
    } catch (err: any) {
        console.error('E-Way Bill generation error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /gst/eway-bill/:ewbNo/vehicle — Update Part-B (vehicle details)
router.put('/eway-bill/:ewbNo/vehicle', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { ewbNo } = req.params;
        const { vehicleNo, transportMode, reason } = req.body;

        const TRANSPORT_MODE_MAP: Record<string, number> = { road: 1, rail: 2, air: 3, ship: 4 };
        const result = await gspService.updateEWayBillVehicle(
            String(ewbNo), vehicleNo,
            TRANSPORT_MODE_MAP[transportMode] || 1,
            reason || 4,
        );

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /gst/eway-bill/:ewbNo/cancel — Cancel E-Way Bill
router.post('/eway-bill/:ewbNo/cancel', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { ewbNo } = req.params;
        const { reason, remark } = req.body;

        const result = await gspService.cancelEWayBill(String(ewbNo), reason || 4, remark || 'Cancelled');
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
// GSTR-1 EXPORT (Authenticated)
// ═══════════════════════════════════════════════════════════

// GET /gst/gstr1/export?month=03&year=2026
router.get('/gstr1/export', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) { res.status(400).json({ message: 'month and year are required' }); return; }

        const m = Number(String(month));
        const y = Number(String(year));
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);

        const invoices = await prisma.invoice.findMany({
            where: {
                userId: req.userId,
                issueDate: { gte: startDate, lte: endDate },
                status: { in: ['sent', 'paid', 'overdue'] },
            },
            include: { client: true },
        });

        const period = `${String(m).padStart(2, '0')}${y}`;
        const result = await gspService.exportGstr1Data(invoices, period);

        if (result.success && result.data) {
            const user = await prisma.user.findUnique({ where: { id: req.userId } });
            result.data.gstin = user?.gstin || '';
        }

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /gst/status — Check GSP configuration status
router.get('/status', authMiddleware, async (_req: AuthRequest, res) => {
    res.json({
        gspConfigured: gspService.isConfigured(),
        provider: gspService.isConfigured() ? 'Masters India' : 'Dev Mode (Mock)',
        features: {
            eInvoice: true,
            eWayBill: true,
            gstr1Export: true,
            gstinVerification: true,
        },
    });
});

export default router;

