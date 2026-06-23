export interface InvoicePdfData {
    companyName: string;
    companyEmail?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyGstin?: string;
    companyPan?: string;
    companyLogo?: string;
    clientName: string;
    clientEmail: string;
    clientAddress?: string;
    clientGstin?: string;
    clientStateCode?: string;
    customerId?: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    status: string;
    items: Array<{
        description: string;
        hsnCode?: string;
        quantity: number;
        unitPrice: number;
        amount: number;
        taxRate?: number;
    }>;
    subtotal: number;
    taxAmount: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    total: number;
    amountPaid?: number;
    balanceRemaining?: number;
    placeOfSupply?: string;
    placeOfSupplyName?: string;
    supplyType?: string;
    reverseCharge?: boolean;
    irn?: string;
    ackNo?: string;
    ackDate?: string;
    ewayBillNumber?: string;
    transportMode?: string;
    vehicleNumber?: string;
    transporterName?: string;
    transporterGstin?: string;
    distanceKm?: number;
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
export declare function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer>;
export interface ProposalPdfData {
    companyName: string;
    title: string;
    clientName: string;
    clientEmail: string;
    validUntil?: string;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        amount: number;
    }>;
    total: number;
    notes?: string;
    createdAt: string;
}
export declare function generateProposalPdf(data: ProposalPdfData): Promise<Buffer>;
//# sourceMappingURL=pdf.d.ts.map