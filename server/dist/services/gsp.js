"use strict";
/**
 * GST Suvidha Provider (GSP) Service
 *
 * Integrates with Masters India API for:
 * - E-Invoice generation (IRP)
 * - E-Way Bill generation (NIC)
 * - GSTR-1 data export
 *
 * For production, set these env vars:
 *   MASTERS_INDIA_API_KEY
 *   MASTERS_INDIA_CLIENT_ID
 *   EINVOICE_USERNAME
 *   EINVOICE_PASSWORD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gspService = void 0;
class GspService {
    apiKey;
    clientId;
    provider;
    baseUrl;
    // NIC Sandbox credentials (free for testing)
    nicUsername;
    nicPassword;
    nicGstin;
    constructor() {
        this.apiKey = process.env.MASTERS_INDIA_API_KEY;
        this.clientId = process.env.MASTERS_INDIA_CLIENT_ID;
        this.nicUsername = process.env.NIC_EINVOICE_USERNAME;
        this.nicPassword = process.env.NIC_EINVOICE_PASSWORD;
        this.nicGstin = process.env.NIC_EINVOICE_GSTIN;
        // Determine active provider
        if (this.apiKey) {
            this.provider = 'masters_india';
            this.baseUrl = 'https://commonapi.mastersindia.co';
        }
        else if (process.env.ADAEQUARE_API_KEY) {
            this.provider = 'adaequare';
            this.baseUrl = 'https://api.adaequare.com';
            this.apiKey = process.env.ADAEQUARE_API_KEY;
        }
        else if (process.env.CLEARTAX_API_KEY) {
            this.provider = 'cleartax';
            this.baseUrl = 'https://api.clear.in/einv';
            this.apiKey = process.env.CLEARTAX_API_KEY;
        }
        else if (this.nicUsername && this.nicPassword) {
            this.provider = 'nic_sandbox';
            this.baseUrl = 'https://einv-apisandbox.nic.in';
        }
        else {
            this.provider = 'none';
            this.baseUrl = '';
        }
        if (this.provider !== 'none') {
            console.log(`[GSP] Active provider: ${this.provider} (${this.baseUrl})`);
        }
    }
    isConfigured() {
        return this.provider !== 'none';
    }
    getProvider() {
        return this.provider;
    }
    async makeRequest(endpoint, method = 'GET', body) {
        if (!this.apiKey) {
            return { success: false, error: 'GSP API key not configured. Set MASTERS_INDIA_API_KEY in .env' };
        }
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': 'OkeBill/1.0',
        };
        if (this.clientId)
            headers['client_id'] = this.clientId;
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(30000),
            });
            const data = await response.json();
            return data;
        }
        catch (err) {
            console.error(`GSP API error (${endpoint}):`, err.message);
            return { success: false, error: err.message };
        }
    }
    // ─── E-Invoice (IRP) ─────────────────────────────────
    async generateEInvoice(request) {
        if (!this.isConfigured()) {
            // Dev mode: Generate mock IRN
            const mockIrn = `DEV${Date.now().toString(16).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            return {
                success: true,
                irn: mockIrn,
                ackNo: String(Math.floor(100000000000 + Math.random() * 900000000000)),
                ackDate: new Date().toISOString().split('T')[0],
                qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({
                    irn: mockIrn,
                    invoiceNo: request.invoiceNumber,
                    sellerGstin: request.sellerGstin,
                    buyerGstin: request.buyerGstin,
                    totalValue: request.totalInvoiceValue,
                    date: request.invoiceDate,
                }))}`,
            };
        }
        // Production: Call Masters India E-Invoice API
        const payload = {
            Version: '1.1',
            TranDtls: {
                TaxSch: 'GST',
                SupTyp: request.supplyType,
                RegRev: request.reverseCharge ? 'Y' : 'N',
            },
            DocDtls: {
                Typ: request.invoiceType,
                No: request.invoiceNumber,
                Dt: request.invoiceDate,
            },
            SellerDtls: {
                Gstin: request.sellerGstin,
                LglNm: request.sellerLegalName,
                Addr1: request.sellerAddress.substring(0, 100),
                Loc: request.sellerAddress.substring(0, 50),
                Pin: 0, // Will need pincode
                Stcd: request.sellerStateCode,
            },
            BuyerDtls: {
                Gstin: request.buyerGstin,
                LglNm: request.buyerLegalName,
                Addr1: request.buyerAddress.substring(0, 100),
                Loc: request.buyerAddress.substring(0, 50),
                Pin: 0,
                Stcd: request.buyerStateCode,
                Pos: request.placeOfSupply,
            },
            ItemList: request.items.map((item, i) => ({
                SlNo: String(i + 1),
                PrdDesc: item.description,
                IsServc: 'N',
                HsnCd: item.hsnCode,
                Qty: item.quantity,
                Unit: item.unit || 'NOS',
                UnitPrice: item.unitPrice,
                TotAmt: item.totalAmount,
                AssAmt: item.totalAmount,
                GstRt: item.taxRate,
                CgstAmt: item.cgstAmount,
                SgstAmt: item.sgstAmount,
                IgstAmt: item.igstAmount,
                TotItemVal: item.totalAmount + item.cgstAmount + item.sgstAmount + item.igstAmount,
            })),
            ValDtls: {
                AssVal: request.totalTaxableValue,
                CgstVal: request.totalCgst,
                SgstVal: request.totalSgst,
                IgstVal: request.totalIgst,
                TotInvVal: request.totalInvoiceValue,
            },
        };
        const result = await this.makeRequest('/einvoice/type/generate/json', 'POST', payload);
        if (result?.data?.Irn || result?.result?.Irn) {
            const d = result.data || result.result;
            return {
                success: true,
                irn: d.Irn,
                ackNo: d.AckNo,
                ackDate: d.AckDt,
                signedInvoice: d.SignedInvoice,
                qrCode: d.SignedQRCode || d.QRCode,
            };
        }
        return {
            success: false,
            error: result?.error?.message || result?.message || 'E-Invoice generation failed',
            errorCode: result?.error?.errorCode,
        };
    }
    async cancelEInvoice(irn, reason, remark) {
        if (!this.isConfigured())
            return { success: true };
        const result = await this.makeRequest('/einvoice/type/cancel/json', 'POST', {
            Irn: irn,
            CnlRsn: reason, // '1'=Duplicate, '2'=Data entry mistake, '3'=Order cancelled, '4'=Others
            CnlRem: remark,
        });
        return {
            success: !!(result?.data?.Irn || result?.success),
            error: result?.error?.message || result?.message,
        };
    }
    // ─── E-Way Bill (NIC) ────────────────────────────────
    async generateEWayBill(request) {
        if (!this.isConfigured()) {
            // Dev mode: Generate mock E-Way Bill
            const ewbNo = `DEV${String(Math.floor(100000000000 + Math.random() * 900000000000))}`;
            const now = new Date();
            const validUpto = new Date(now.getTime() + (request.totalValue > 100000 ? 15 : 1) * 24 * 60 * 60 * 1000);
            return {
                success: true,
                ewayBillNo: ewbNo,
                ewayBillDate: now.toISOString(),
                validUpto: validUpto.toISOString(),
            };
        }
        const TRANSPORT_MODES = {
            road: 1, rail: 2, air: 3, ship: 4,
        };
        const payload = {
            supplyType: request.supplyType,
            subSupplyType: request.subSupplyType || 1,
            docType: request.docType,
            docNo: request.docNo,
            docDate: request.docDate,
            fromGstin: request.fromGstin,
            fromTrdName: '',
            fromAddr1: request.fromAddress.substring(0, 120),
            fromStateCode: Number(request.fromStateCode),
            fromPincode: Number(request.fromPincode),
            toGstin: request.toGstin,
            toTrdName: '',
            toAddr1: request.toAddress.substring(0, 120),
            toStateCode: Number(request.toStateCode),
            toPincode: Number(request.toPincode),
            totalValue: request.totalValue,
            cgstValue: request.cgstValue,
            sgstValue: request.sgstValue,
            igstValue: request.igstValue,
            cessValue: request.cessValue || 0,
            transMode: request.transportMode,
            vehicleNo: request.vehicleNo,
            transDocNo: request.transDocNo,
            transDocDate: request.transDocDate,
            transporterId: request.transporterId,
            transporterName: request.transporterName,
            itemList: request.items.map((item, i) => ({
                productName: item.productName,
                productDesc: item.productName,
                hsnCode: item.hsnCode,
                quantity: item.quantity,
                qtyUnit: item.unit || 'NOS',
                taxableAmount: item.taxableAmount,
                cgstRate: item.cgstRate,
                sgstRate: item.sgstRate,
                igstRate: item.igstRate,
            })),
        };
        const result = await this.makeRequest('/ewayapi/generate', 'POST', payload);
        if (result?.data?.ewayBillNo || result?.ewayBillNo) {
            const d = result.data || result;
            return {
                success: true,
                ewayBillNo: d.ewayBillNo,
                ewayBillDate: d.ewayBillDate,
                validUpto: d.validUpto,
            };
        }
        return {
            success: false,
            error: result?.error?.message || result?.message || 'E-Way Bill generation failed',
        };
    }
    async cancelEWayBill(ewbNo, reason, remark) {
        if (!this.isConfigured())
            return { success: true };
        const result = await this.makeRequest('/ewayapi/cancel', 'POST', {
            ewbNo,
            cancelRsnCode: reason, // 1=Duplicate, 2=Data entry error, 3=Order cancelled, 4=Others
            cancelRmrk: remark,
        });
        return {
            success: !!(result?.data || result?.success),
            error: result?.error?.message || result?.message,
        };
    }
    async updateEWayBillVehicle(ewbNo, vehicleNo, transportMode, reason = 1) {
        if (!this.isConfigured())
            return { success: true };
        const result = await this.makeRequest('/ewayapi/vehewb', 'POST', {
            ewbNo,
            vehicleNo,
            fromPlace: '',
            fromState: 0,
            reasonCode: reason, // 1=Due to break down, 2=Due to transshipment, 3=Others, 4=First time
            reasonRem: 'Vehicle update',
            transDocNo: '',
            transDocDate: '',
            transMode: transportMode,
        });
        return {
            success: !!(result?.data || result?.success),
            error: result?.error?.message || result?.message,
        };
    }
    // ─── GSTR-1 Export ───────────────────────────────────
    async exportGstr1Data(invoices, period) {
        // Generate GSTR-1 JSON format locally (no API needed)
        const b2b = [];
        const b2cs = [];
        invoices.forEach(inv => {
            const items = Array.isArray(inv.items) ? inv.items : [];
            const invData = {
                inum: inv.invoiceNumber,
                idt: new Date(inv.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                val: Number(inv.total),
                pos: inv.placeOfSupply || '',
                rchrg: 'N',
                inv_typ: 'R',
                itms: items.map((item) => ({
                    num: 1,
                    itm_det: {
                        txval: item.quantity * item.unitPrice,
                        rt: inv.supplyType === 'inter'
                            ? (Number(inv.taxAmount) / Number(inv.subtotal)) * 100
                            : (Number(inv.taxAmount) / Number(inv.subtotal)) * 100,
                        camt: inv.supplyType === 'inter' ? 0 : Number(inv.taxAmount) / 2,
                        samt: inv.supplyType === 'inter' ? 0 : Number(inv.taxAmount) / 2,
                        iamt: inv.supplyType === 'inter' ? Number(inv.taxAmount) : 0,
                    },
                })),
            };
            if (inv.client?.gstin) {
                // B2B invoice
                const existingSupplier = b2b.find(b => b.ctin === inv.client.gstin);
                if (existingSupplier) {
                    existingSupplier.inv.push(invData);
                }
                else {
                    b2b.push({ ctin: inv.client.gstin, inv: [invData] });
                }
            }
            else {
                // B2CS (unregistered)
                b2cs.push({
                    pos: inv.placeOfSupply || '',
                    typ: 'OE',
                    txval: Number(inv.subtotal),
                    camt: inv.supplyType === 'inter' ? 0 : Number(inv.taxAmount) / 2,
                    samt: inv.supplyType === 'inter' ? 0 : Number(inv.taxAmount) / 2,
                    iamt: inv.supplyType === 'inter' ? Number(inv.taxAmount) : 0,
                    rt: Number(inv.subtotal) > 0
                        ? (Number(inv.taxAmount) / Number(inv.subtotal)) * 100
                        : 0,
                });
            }
        });
        return {
            success: true,
            data: {
                gstin: '', // Will be filled from user settings
                fp: period, // e.g. '032026' for March 2026
                b2b,
                b2cs,
            },
        };
    }
}
// Singleton
exports.gspService = new GspService();
//# sourceMappingURL=gsp.js.map