/**
 * Razorpay Payment Gateway Service
 *
 * Handles:
 * - Order creation for invoice payments
 * - Payment verification (webhook + manual)
 * - Payment link generation for client self-pay
 * - Refund processing
 *
 * Set env vars:
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   RAZORPAY_WEBHOOK_SECRET
 */
export interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    notes: Record<string, string>;
}
export interface RazorpayPaymentLink {
    id: string;
    short_url: string;
    amount: number;
    currency: string;
    expire_by: number;
    status: string;
}
export interface VerifyPaymentInput {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}
declare class RazorpayService {
    private keyId;
    private keySecret;
    private webhookSecret;
    private baseUrl;
    constructor();
    isConfigured(): boolean;
    getKeyId(): string | undefined;
    private getAuth;
    private request;
    /**
     * Create an order for invoice payment.
     * @param amountInRupees — The payment amount in INR (rupees, not paise)
     * @param invoiceNumber — The invoice number for the receipt
     * @param notes — Additional metadata
     */
    createOrder(amountInRupees: number, invoiceNumber: string, notes?: Record<string, string>): Promise<RazorpayOrder>;
    /**
     * Verify Razorpay payment signature (after client-side checkout).
     * Uses HMAC-SHA256 verification per Razorpay docs.
     */
    verifyPayment(input: VerifyPaymentInput): Promise<boolean>;
    /**
     * Verify webhook signature.
     */
    verifyWebhookSignature(body: string, signature: string): boolean;
    /**
     * Create a payment link for client self-pay (email/WhatsApp/SMS).
     */
    createPaymentLink(params: {
        amountInRupees: number;
        invoiceNumber: string;
        clientName: string;
        clientEmail?: string;
        clientPhone?: string;
        description: string;
        expireDays?: number;
        callbackUrl?: string;
    }): Promise<RazorpayPaymentLink>;
    /**
     * Issue a refund for a Razorpay payment.
     */
    createRefund(paymentId: string, amountInRupees?: number, reason?: string): Promise<any>;
    getPayment(paymentId: string): Promise<any>;
    getOrder(orderId: string): Promise<any>;
}
export declare const razorpayService: RazorpayService;
export {};
//# sourceMappingURL=razorpay.d.ts.map