export interface InvoiceEmailData {
    to: string;
    clientName: string;
    companyName: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    subtotal: number;
    tax: number;
    total: number;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        amount: number;
    }>;
    viewUrl?: string;
    pdfBuffer?: Buffer;
}
export declare function sendInvoiceEmail(data: InvoiceEmailData): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
export declare function sendPaymentReminderEmail(data: {
    to: string;
    clientName: string;
    companyName: string;
    invoiceNumber: string;
    dueDate: string;
    total: number;
    balanceRemaining: number;
    daysOverdue: number;
}): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
export declare function sendPaymentReceiptEmail(data: {
    to: string;
    clientName: string;
    companyName: string;
    invoiceNumber: string;
    amountPaid: number;
    paymentDate: string;
    paymentMethod: string;
    reference: string;
    balanceRemaining: number;
}): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
export declare function sendPasswordResetEmail(to: string, otpCode: string, name: string): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
export declare function isEmailConfigured(): boolean;
//# sourceMappingURL=email.d.ts.map