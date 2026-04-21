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

// ─── Types ────────────────────────────────────────────────

export interface RazorpayOrder {
    id: string;
    amount: number;     // paise
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

// ─── Service ──────────────────────────────────────────────

class RazorpayService {
    private keyId: string | undefined;
    private keySecret: string | undefined;
    private webhookSecret: string | undefined;
    private baseUrl = 'https://api.razorpay.com/v1';

    constructor() {
        this.keyId = process.env.RAZORPAY_KEY_ID;
        this.keySecret = process.env.RAZORPAY_KEY_SECRET;
        this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    }

    isConfigured(): boolean {
        return !!(this.keyId && this.keySecret);
    }

    getKeyId(): string | undefined {
        return this.keyId;
    }

    private getAuth(): string {
        return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    }

    private async request<T>(path: string, method: string = 'GET', body?: any): Promise<T> {
        if (!this.isConfigured()) {
            throw new Error('Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
        }

        const res = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.getAuth(),
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: { description: res.statusText } })) as any;
            throw new Error(error?.error?.description || `Razorpay API error: ${res.status}`);
        }

        return (await res.json()) as T;
    }

    // ─── Orders ──────────────────────────────────────────

    /**
     * Create an order for invoice payment.
     * @param amountInRupees — The payment amount in INR (rupees, not paise)
     * @param invoiceNumber — The invoice number for the receipt
     * @param notes — Additional metadata
     */
    async createOrder(amountInRupees: number, invoiceNumber: string, notes: Record<string, string> = {}): Promise<RazorpayOrder> {
        if (!this.isConfigured()) {
            // Dev mock
            return {
                id: `order_DEV${Date.now().toString(36)}`,
                amount: Math.round(amountInRupees * 100),
                currency: 'INR',
                receipt: invoiceNumber,
                status: 'created',
                notes,
            };
        }

        return this.request<RazorpayOrder>('/orders', 'POST', {
            amount: Math.round(amountInRupees * 100), // Convert to paise
            currency: 'INR',
            receipt: invoiceNumber,
            notes: { ...notes, platform: 'OkeBill' },
        });
    }

    // ─── Payment Verification ────────────────────────────

    /**
     * Verify Razorpay payment signature (after client-side checkout).
     * Uses HMAC-SHA256 verification per Razorpay docs.
     */
    async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
        if (!this.keySecret) return true; // Dev mode

        const crypto = await import('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', this.keySecret)
            .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
            .digest('hex');

        return expectedSignature === input.razorpay_signature;
    }

    /**
     * Verify webhook signature.
     */
    verifyWebhookSignature(body: string, signature: string): boolean {
        if (!this.webhookSecret) return true; // Dev mode

        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    }

    // ─── Payment Links ───────────────────────────────────

    /**
     * Create a payment link for client self-pay (email/WhatsApp/SMS).
     */
    async createPaymentLink(params: {
        amountInRupees: number;
        invoiceNumber: string;
        clientName: string;
        clientEmail?: string;
        clientPhone?: string;
        description: string;
        expireDays?: number;
        callbackUrl?: string;
    }): Promise<RazorpayPaymentLink> {
        if (!this.isConfigured()) {
            return {
                id: `plink_DEV${Date.now().toString(36)}`,
                short_url: `https://rzp.io/demo/${params.invoiceNumber}`,
                amount: Math.round(params.amountInRupees * 100),
                currency: 'INR',
                expire_by: Math.floor(Date.now() / 1000) + (params.expireDays || 30) * 86400,
                status: 'created',
            };
        }

        return this.request<RazorpayPaymentLink>('/payment_links', 'POST', {
            amount: Math.round(params.amountInRupees * 100),
            currency: 'INR',
            accept_partial: true,
            first_min_partial_amount: 100, // ₹1 minimum
            description: params.description,
            customer: {
                name: params.clientName,
                email: params.clientEmail,
                contact: params.clientPhone,
            },
            notify: {
                sms: !!params.clientPhone,
                email: !!params.clientEmail,
            },
            reminder_enable: true,
            notes: {
                invoice_number: params.invoiceNumber,
                platform: 'OkeBill',
            },
            callback_url: params.callbackUrl,
            callback_method: params.callbackUrl ? 'get' : undefined,
            expire_by: Math.floor(Date.now() / 1000) + (params.expireDays || 30) * 86400,
        });
    }

    // ─── Refunds ─────────────────────────────────────────

    /**
     * Issue a refund for a Razorpay payment.
     */
    async createRefund(paymentId: string, amountInRupees?: number, reason?: string): Promise<any> {
        if (!this.isConfigured()) {
            return {
                id: `rfnd_DEV${Date.now().toString(36)}`,
                payment_id: paymentId,
                amount: amountInRupees ? Math.round(amountInRupees * 100) : 0,
                status: 'processed',
            };
        }

        const body: any = {
            notes: { reason: reason || 'Customer request', platform: 'OkeBill' },
        };
        if (amountInRupees) {
            body.amount = Math.round(amountInRupees * 100); // Partial refund
        }

        return this.request(`/payments/${paymentId}/refunds`, 'POST', body);
    }

    // ─── Fetch Payment Details ───────────────────────────

    async getPayment(paymentId: string): Promise<any> {
        if (!this.isConfigured()) return { id: paymentId, status: 'captured', method: 'upi' };
        return this.request(`/payments/${paymentId}`);
    }

    async getOrder(orderId: string): Promise<any> {
        if (!this.isConfigured()) return { id: orderId, status: 'paid' };
        return this.request(`/orders/${orderId}`);
    }
}

// Singleton
export const razorpayService = new RazorpayService();
