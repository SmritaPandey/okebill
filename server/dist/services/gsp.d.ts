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
export interface EInvoiceRequest {
    sellerGstin: string;
    sellerLegalName: string;
    sellerAddress: string;
    sellerStateCode: string;
    buyerGstin: string;
    buyerLegalName: string;
    buyerAddress: string;
    buyerStateCode: string;
    invoiceNumber: string;
    invoiceDate: string;
    invoiceType: 'INV' | 'CRN' | 'DBN';
    supplyType: 'B2B' | 'B2C' | 'SEZWP' | 'SEZWOP' | 'EXPWP' | 'EXPWOP';
    items: Array<{
        description: string;
        hsnCode: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        totalAmount: number;
        taxRate: number;
        cgstAmount: number;
        sgstAmount: number;
        igstAmount: number;
    }>;
    totalValue: number;
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalInvoiceValue: number;
    placeOfSupply: string;
    reverseCharge: boolean;
}
export interface EInvoiceResponse {
    success: boolean;
    irn?: string;
    ackNo?: string;
    ackDate?: string;
    signedInvoice?: string;
    qrCode?: string;
    error?: string;
    errorCode?: string;
}
export interface EWayBillRequest {
    supplyType: 'O' | 'I';
    subSupplyType: number;
    docType: 'INV' | 'BIL' | 'BOE' | 'CHL';
    docNo: string;
    docDate: string;
    fromGstin: string;
    fromStateCode: string;
    fromAddress: string;
    fromPincode: string;
    toGstin: string;
    toStateCode: string;
    toAddress: string;
    toPincode: string;
    totalValue: number;
    cgstValue: number;
    sgstValue: number;
    igstValue: number;
    cessValue: number;
    transportMode: number;
    vehicleNo?: string;
    transporterId?: string;
    transporterName?: string;
    transDocNo?: string;
    transDocDate?: string;
    items: Array<{
        productName: string;
        hsnCode: string;
        quantity: number;
        unit: string;
        taxableAmount: number;
        cgstRate: number;
        sgstRate: number;
        igstRate: number;
    }>;
}
export interface EWayBillResponse {
    success: boolean;
    ewayBillNo?: string;
    ewayBillDate?: string;
    validUpto?: string;
    error?: string;
}
declare class GspService {
    private apiKey;
    private clientId;
    private provider;
    private baseUrl;
    private nicUsername;
    private nicPassword;
    private nicGstin;
    constructor();
    isConfigured(): boolean;
    getProvider(): string;
    private makeRequest;
    generateEInvoice(request: EInvoiceRequest): Promise<EInvoiceResponse>;
    cancelEInvoice(irn: string, reason: string, remark: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    generateEWayBill(request: EWayBillRequest): Promise<EWayBillResponse>;
    cancelEWayBill(ewbNo: string, reason: number, remark: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    updateEWayBillVehicle(ewbNo: string, vehicleNo: string, transportMode: number, reason?: number): Promise<{
        success: boolean;
        error?: string;
    }>;
    exportGstr1Data(invoices: any[], period: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
}
export declare const gspService: GspService;
export {};
//# sourceMappingURL=gsp.d.ts.map