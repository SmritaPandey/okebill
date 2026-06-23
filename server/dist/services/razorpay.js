"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayService = void 0;
// ─── Service ──────────────────────────────────────────────
class RazorpayService {
    keyId;
    keySecret;
    webhookSecret;
    baseUrl = 'https://api.razorpay.com/v1';
    constructor() {
        this.keyId = process.env.RAZORPAY_KEY_ID;
        this.keySecret = process.env.RAZORPAY_KEY_SECRET;
        this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    }
    isConfigured() {
        return !!(this.keyId && this.keySecret);
    }
    getKeyId() {
        return this.keyId;
    }
    getAuth() {
        return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    }
    async request(path, method = 'GET', body) {
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
            const error = await res.json().catch(() => ({ error: { description: res.statusText } }));
            throw new Error(error?.error?.description || `Razorpay API error: ${res.status}`);
        }
        return (await res.json());
    }
    // ─── Orders ──────────────────────────────────────────
    /**
     * Create an order for invoice payment.
     * @param amountInRupees — The payment amount in INR (rupees, not paise)
     * @param invoiceNumber — The invoice number for the receipt
     * @param notes — Additional metadata
     */
    async createOrder(amountInRupees, invoiceNumber, notes = {}) {
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
        return this.request('/orders', 'POST', {
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
    async verifyPayment(input) {
        if (!this.keySecret)
            return true; // Dev mode
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const expectedSignature = crypto
            .createHmac('sha256', this.keySecret)
            .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
            .digest('hex');
        return expectedSignature === input.razorpay_signature;
    }
    /**
     * Verify webhook signature.
     */
    verifyWebhookSignature(body, signature) {
        if (!this.webhookSecret)
            return true; // Dev mode
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
    async createPaymentLink(params) {
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
        return this.request('/payment_links', 'POST', {
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
    async createRefund(paymentId, amountInRupees, reason) {
        if (!this.isConfigured()) {
            return {
                id: `rfnd_DEV${Date.now().toString(36)}`,
                payment_id: paymentId,
                amount: amountInRupees ? Math.round(amountInRupees * 100) : 0,
                status: 'processed',
            };
        }
        const body = {
            notes: { reason: reason || 'Customer request', platform: 'OkeBill' },
        };
        if (amountInRupees) {
            body.amount = Math.round(amountInRupees * 100); // Partial refund
        }
        return this.request(`/payments/${paymentId}/refunds`, 'POST', body);
    }
    // ─── Fetch Payment Details ───────────────────────────
    async getPayment(paymentId) {
        if (!this.isConfigured())
            return { id: paymentId, status: 'captured', method: 'upi' };
        return this.request(`/payments/${paymentId}`);
    }
    async getOrder(orderId) {
        if (!this.isConfigured())
            return { id: orderId, status: 'paid' };
        return this.request(`/orders/${orderId}`);
    }
}
// Singleton
exports.razorpayService = new RazorpayService();
//# sourceMappingURL=razorpay.js.map