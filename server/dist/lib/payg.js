"use strict";
// ─── PayG Payment Gateway Client ──────────────────────────
// Docs: https://developer.payg.in/
// Auth: Basic Authorization with base64(Key:Token:M:MID)
// Flow: Create Order → Redirect to PaymentProcessUrl → Callback → Check Status
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_PLANS = void 0;
exports.createPaygOrder = createPaygOrder;
exports.getPaygOrderStatus = getPaygOrderStatus;
const PAYG_UAT_URL = 'https://uatapiv2.payg.in/payment/api/order';
const PAYG_PROD_URL = 'https://apiv2.payg.in/payment/api/order';
function getConfig() {
    return {
        merchantKeyId: process.env.PAYG_MERCHANT_KEY_ID || '',
        merchantMid: process.env.PAYG_MID || '',
        authenticationKey: process.env.PAYG_AUTH_KEY || '',
        authenticationToken: process.env.PAYG_AUTH_TOKEN || '',
        isProduction: process.env.PAYG_MODE === 'production',
        redirectUrl: process.env.PAYG_REDIRECT_URL || 'http://localhost:5173/payment/callback',
    };
}
function getBaseUrl() {
    const config = getConfig();
    return config.isProduction ? PAYG_PROD_URL : PAYG_UAT_URL;
}
function getAuthHeader() {
    const config = getConfig();
    const raw = `${config.authenticationKey}:${config.authenticationToken}:M:${config.merchantKeyId}`;
    return 'Basic ' + Buffer.from(raw).toString('base64');
}
// ─── Create a PayG Order ───────────────────────────────────
async function createPaygOrder(req) {
    const config = getConfig();
    const url = `${getBaseUrl()}/create`;
    const now = new Date();
    const requestDateTime = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${now.getFullYear()}`;
    const body = {
        MID: config.merchantMid,
        UniqueRequestId: req.uniqueRequestId,
        UserDefinedData: {
            UserDefined1: req.userDefined1 || '',
        },
        ProductData: JSON.stringify({ PaymentReason: req.productDescription }),
        RequestDateTime: requestDateTime,
        RedirectUrl: config.redirectUrl,
        TransactionData: {
            AcceptedPaymentTypes: '',
            PaymentType: '',
            SurchargeType: '',
            SurchargeValue: '',
            RefTransactionId: '',
            IndustrySpecificationCode: '',
            PartialPaymentOption: '',
        },
        OrderAmount: String(req.orderAmount),
        OrderType: '',
        OrderAmountData: {
            AmountTypeDesc: String(req.orderAmount),
            Amount: String(req.orderAmount),
        },
        CustomerData: {
            CustomerId: req.customerEmail,
            CustomerNotes: req.productDescription,
            FirstName: req.customerFirstName,
            LastName: req.customerLastName,
            MobileNo: req.customerMobile,
            Email: req.customerEmail,
            EmailReceipt: 'true',
            BillingAddress: req.customerAddress || '',
            BillingCity: req.customerCity || '',
            BillingState: req.customerState || '',
            BillingCountry: 'India',
            BillingZipCode: req.customerZipCode || '',
            ShippingFirstName: req.customerFirstName,
            ShippingLastName: req.customerLastName,
            ShippingAddress: req.customerAddress || '',
            ShippingCity: req.customerCity || '',
            ShippingState: req.customerState || '',
            ShippingCountry: 'India',
            ShippingZipCode: req.customerZipCode || '',
            ShippingMobileNo: req.customerMobile,
        },
        IntegrationData: {
            UserName: req.customerFirstName,
            Source: 'OkeBill',
            IntegrationType: '',
            HashData: '',
            PlatformId: '1',
        },
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: getAuthHeader(),
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`PayG API error (${response.status}): ${text}`);
    }
    return response.json();
}
// ─── Get Order Status / Details ────────────────────────────
async function getPaygOrderStatus(orderKeyId) {
    const config = getConfig();
    const url = `${getBaseUrl()}/Detail`;
    const body = {
        OrderKeyId: orderKeyId,
        MID: config.merchantMid,
        PaymentType: '',
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: getAuthHeader(),
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`PayG status API error (${response.status}): ${text}`);
    }
    return response.json();
}
// ─── Subscription plans ────────────────────────────────────
exports.SUBSCRIPTION_PLANS = [
    {
        id: 'free_trial',
        name: 'Free Trial',
        price: 0,
        duration: 14, // days
        features: [
            'Up to 5 invoices/month',
            'Up to 3 clients',
            'Basic invoice templates',
            'Email support',
        ],
        limits: { invoicesPerMonth: 5, clients: 3 },
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 499,
        duration: 30,
        features: [
            'Up to 50 invoices/month',
            'Up to 20 clients',
            'All invoice templates',
            'GST-compliant invoices',
            'Email & chat support',
            'Payment reminders',
        ],
        limits: { invoicesPerMonth: 50, clients: 20 },
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 999,
        duration: 30,
        features: [
            'Unlimited invoices',
            'Unlimited clients',
            'All invoice templates',
            'Recurring invoices',
            'Multi-currency support',
            'Priority support',
            'Custom branding',
            'API access',
        ],
        limits: { invoicesPerMonth: -1, clients: -1 },
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 2499,
        duration: 30,
        features: [
            'Everything in Professional',
            'Multi-user access',
            'Advanced analytics',
            'Dedicated account manager',
            'Custom integrations',
            'SLA guarantee',
            'Audit trail',
        ],
        limits: { invoicesPerMonth: -1, clients: -1 },
    },
];
//# sourceMappingURL=payg.js.map