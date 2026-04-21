/**
 * Standalone REST API client for the Encore.ts backend.
 * Replaces both the Supabase SDK and the auto-generated ~backend/client.ts import.
 * All API calls use plain fetch() with JWT auth from localStorage.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ─── Utilities ─────────────────────────────────────────────

function getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
}

function buildHeaders(includeAuth = true): HeadersInit {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const filtered = Object.entries(params).filter(([, v]) => v !== undefined);
    if (filtered.length === 0) return '';
    return '?' + filtered.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

let isRefreshing = false;
let refreshPromise: Promise<{ token: string } | null> | null = null;

async function attemptTokenRefresh(): Promise<{ token: string } | null> {
    const token = getAuthToken();
    if (!token) return null;
    try {
        const resp = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
            if (data.user) localStorage.setItem('auth_user', JSON.stringify(data.user));
            return { token: data.token };
        }
        return null;
    } catch {
        return null;
    }
}

async function apiCall<T>(path: string, options: RequestInit = {}, _isRetry = false): Promise<T> {
    const resp = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...buildHeaders(),
            ...(options.headers || {}),
        },
    });

    // Handle 401 — attempt silent token refresh (once)
    if (resp.status === 401 && !_isRetry && !path.includes('/auth/login') && !path.includes('/auth/register')) {
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = attemptTokenRefresh().finally(() => { isRefreshing = false; });
        }
        const refreshResult = await refreshPromise;
        if (refreshResult) {
            // Retry the original request with the new token
            return apiCall<T>(path, options, true);
        }
        // Refresh failed — clear auth and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login?session=expired';
        }
        throw new Error('Session expired. Please log in again.');
    }

    if (!resp.ok) {
        const errorBody = await resp.text().catch(() => '');
        let message = `API Error ${resp.status}`;
        try {
            const parsed = JSON.parse(errorBody);
            message = parsed.message || parsed.error || message;
        } catch {
            if (errorBody) message = errorBody;
        }
        throw new Error(message);
    }
    if (resp.status === 204) return undefined as T;
    return resp.json();
}

// ─── Auth Service ──────────────────────────────────────────

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
    role: string;
    onboardingComplete?: boolean;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export const authApi = {
    login: (params: { email: string; password: string }) =>
        apiCall<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(params) }),

    register: (params: { email: string; password: string; firstName: string; lastName: string; companyName: string }) =>
        apiCall<LoginResponse>('/auth/register', { method: 'POST', body: JSON.stringify(params) }),

    oauth: (params: { provider: 'google' | 'microsoft'; idToken?: string; accessToken?: string }) =>
        apiCall<LoginResponse & { isNewUser: boolean }>('/auth/oauth', { method: 'POST', body: JSON.stringify(params) }),

    me: () => apiCall<{ user: User }>('/auth/me', { method: 'GET' }),

    logout: () => apiCall<{ success: boolean }>('/auth/logout', { method: 'POST' }),

    refresh: () => apiCall<LoginResponse>('/auth/refresh', { method: 'POST' }),

    changePassword: (params: { currentPassword: string; newPassword: string }) =>
        apiCall<{ success: boolean; message: string; token: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(params) }),

    exportData: () => apiCall<Blob>('/auth/export-data', { method: 'GET' }),
};

// ─── Clients Service ───────────────────────────────────────

export interface Client {
    id: number;
    userId: number;
    name: string;
    contactEmail: string;
    phone?: string;
    address?: string;
    gstin?: string;
    stateCode?: string;
    billingPreferences?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export const clientsApi = {
    list: (params?: { search?: string; limit?: number; offset?: number }) =>
        apiCall<{ clients: Client[]; total: number }>(`/clients${buildQueryString(params || {})}`),

    get: (id: number) => apiCall<Client>(`/clients/${id}`),

    create: (data: Partial<Client>) =>
        apiCall<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: number, data: Partial<Client>) =>
        apiCall<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: number) => apiCall<void>(`/clients/${id}`, { method: 'DELETE' }),
};

// ─── Proposals Service ─────────────────────────────────────

export interface Proposal {
    id: number;
    userId: number;
    clientId: number;
    title: string;
    status: string;
    items: any[];
    total: number;
    validUntil: string;
    notes?: string;
    publicUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export const proposalsApi = {
    list: (params?: { clientId?: number; status?: string; limit?: number; offset?: number }) =>
        apiCall<{ proposals: Proposal[]; total: number }>(`/proposals${buildQueryString(params || {})}`),

    get: (id: number) => apiCall<Proposal>(`/proposals/${id}`),

    create: (data: Partial<Proposal>) =>
        apiCall<Proposal>('/proposals', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: number, data: Partial<Proposal>) =>
        apiCall<Proposal>(`/proposals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    updateStatus: (id: number, status: string) =>
        apiCall<Proposal>(`/proposals/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    delete: (id: number) =>
        apiCall<void>(`/proposals/${id}`, { method: 'DELETE' }),

    getPublic: (id: number) =>
        apiCall<Proposal>(`/proposals/${id}/public`, { method: 'GET' }),

    generateHTML: (proposalId: number, userId: number) =>
        apiCall<{ html: string }>(`/proposals/${proposalId}/generate-html`, { method: 'POST', body: JSON.stringify({ userId }) }),
};

// ─── Contracts Service ─────────────────────────────────────

export interface Contract {
    id: number;
    userId: number;
    clientId: number;
    proposalId: number;
    title: string;
    status: string;
    terms: string;
    startDate: string;
    endDate: string;
    value: number;
    billingCycle: string;
    createdAt: string;
    updatedAt: string;
}

export const contractsApi = {
    list: (params?: { clientId?: number; status?: string; limit?: number; offset?: number }) =>
        apiCall<{ contracts: Contract[]; total: number }>(`/contracts${buildQueryString(params || {})}`),

    get: (id: number) => apiCall<Contract>(`/contracts/${id}`),

    generate: (data: { proposalId: number; startDate?: string; endDate?: string }) =>
        apiCall<Contract>('/contracts/generate', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: number, data: Partial<Contract>) =>
        apiCall<Contract>(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: number) =>
        apiCall<void>(`/contracts/${id}`, { method: 'DELETE' }),
};

// ─── Invoices Service ──────────────────────────────────────

export interface Invoice {
    id: number;
    userId: number;
    clientId: number;
    contractId?: number;
    invoiceNumber: string;
    status: string;
    items: any[];
    subtotal: number;
    tax: number;
    total: number;
    dueDate: string;
    paidDate?: string;
    createdAt: string;
    updatedAt: string;
}

export const invoicesApi = {
    list: (params?: { clientId?: number; status?: string; limit?: number; offset?: number }) =>
        apiCall<{ invoices: Invoice[]; total: number }>(`/invoices${buildQueryString(params || {})}`),

    get: (id: number) => apiCall<Invoice>(`/invoices/${id}`),

    create: (data: Partial<Invoice>) =>
        apiCall<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: number, data: Partial<Invoice>) =>
        apiCall<Invoice>(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: number) =>
        apiCall<void>(`/invoices/${id}`, { method: 'DELETE' }),

    updateStatus: (id: number, status: string) =>
        apiCall<Invoice>(`/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    generateHTML: (invoiceId: number, userId: number) =>
        apiCall<{ html: string }>(`/invoices/${invoiceId}/generate-html`, { method: 'POST', body: JSON.stringify({ userId }) }),
};

// ─── Payments Service ──────────────────────────────────────

export interface Payment {
    id: number;
    tenantId?: number;
    transactionId?: number;
    invoiceId?: number;
    paymentNumber: string;
    paymentType: string;
    paymentMethod: string;
    amount: number;
    currency: string;
    status: string;
    paymentDate: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export const paymentsApi = {
    list: (params?: { invoiceId?: number; status?: string; limit?: number; offset?: number }) =>
        apiCall<{ payments: Payment[]; total: number }>(`/payments${buildQueryString(params || {})}`),

    get: (id: number) => apiCall<Payment>(`/payments/${id}`),

    create: (data: Partial<Payment>) =>
        apiCall<Payment>('/payments', { method: 'POST', body: JSON.stringify(data) }),

    record: (data: { invoiceId: number; amount: number; paymentMethod: string; paymentDate?: string; notes?: string }) =>
        apiCall<Payment>('/payments/record', { method: 'POST', body: JSON.stringify(data) }),

    delete: (id: number) =>
        apiCall<void>(`/payments/${id}`, { method: 'DELETE' }),
};

// ─── Products Service ──────────────────────────────────────

export interface Product {
    id: number;
    tenantId: number;
    sku: string;
    barcode?: string;
    name: string;
    description?: string;
    category?: string;
    brand?: string;
    unit: string;
    taxCategory?: string;
    productType: string;
    industryMetadata?: Record<string, any>;
    pricing?: Record<string, any>;
    trackingSettings?: Record<string, any>;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const productsApi = {
    list: (params: { tenantId: number; search?: string; category?: string; brand?: string; limit?: number; offset?: number }) =>
        apiCall<{ products: Product[]; total: number }>(`/products${buildQueryString(params)}`),

    search: (params: { tenantId: number; query: string }) =>
        apiCall<{ products: Product[]; total: number }>(`/products${buildQueryString({ tenantId: params.tenantId, search: params.query })}`),

    get: (id: number) => apiCall<Product>(`/products/${id}`),

    create: (data: Partial<Product>) =>
        apiCall<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: number, data: Partial<Product>) =>
        apiCall<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: number) => apiCall<void>(`/products/${id}`, { method: 'DELETE' }),
};

// ─── Inventory Service ─────────────────────────────────────

export interface StockLevel {
    id: number;
    tenantId: number;
    productId: number;
    outletId: number;
    batchNumber?: string;
    serialNumber?: string;
    expiryDate?: string;
    quantity: number;
    reservedQuantity: number;
    costPrice?: number;
    sellingPrice?: number;
    location?: string;
    status: string;
    product?: Product;
}

export const inventoryApi = {
    getStockLevels: (params: { tenantId: number; productId?: number; outletId?: number; lowStockOnly?: boolean; expiringOnly?: boolean; limit?: number; offset?: number }) =>
        apiCall<{ items: StockLevel[]; total: number }>(`/inventory/stock-levels${buildQueryString(params)}`),

    createStock: (data: Partial<StockLevel>) =>
        apiCall<StockLevel>('/inventory/stock', { method: 'POST', body: JSON.stringify(data) }),

    adjustStock: (data: { tenantId: number; productId: number; outletId: number; adjustmentType: string; quantity: number; reason?: string; batchNumber?: string }) =>
        apiCall<StockLevel>('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Customers Service ─────────────────────────────────────

export interface Customer {
    id: number;
    tenantId: number;
    customerCode?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: Record<string, any>;
    taxInfo?: Record<string, any>;
    creditLimit: number;
    paymentTerms: number;
    loyaltyPoints: number;
    industryMetadata?: Record<string, any>;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const customersApi = {
    list: (params: { tenantId: number; search?: string; limit?: number; offset?: number }) =>
        apiCall<{ customers: Customer[]; total: number }>(`/customers${buildQueryString(params)}`),

    get: (id: number) => apiCall<Customer>(`/customers/${id}`),

    create: (data: Partial<Customer>) =>
        apiCall<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: number, data: Partial<Customer>) =>
        apiCall<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: number) =>
        apiCall<void>(`/customers/${id}`, { method: 'DELETE' }),
};

// ─── Suppliers Service ─────────────────────────────────────

export interface Supplier {
    id: number;
    tenantId: number;
    supplierCode?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: Record<string, any>;
    taxInfo?: Record<string, any>;
    paymentTerms: number;
    creditLimit: number;
    leadTimeDays: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const suppliersApi = {
    list: (params: { tenantId: number; search?: string; limit?: number; offset?: number }) =>
        apiCall<{ suppliers: Supplier[]; total: number }>(`/suppliers${buildQueryString(params)}`),

    get: (id: number) => apiCall<Supplier>(`/suppliers/${id}`),

    create: (data: Partial<Supplier>) =>
        apiCall<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: number, data: Partial<Supplier>) =>
        apiCall<Supplier>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: number) =>
        apiCall<void>(`/suppliers/${id}`, { method: 'DELETE' }),
};

// ─── POS / Transactions Service ────────────────────────────

export interface Transaction {
    id: number;
    tenantId: number;
    outletId: number;
    transactionNumber: string;
    transactionType: string;
    customerId?: number;
    supplierId?: number;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    paymentStatus: string;
    paymentMethod?: string;
    notes?: string;
    status: string;
    transactionDate: string;
    createdBy: number;
    items?: TransactionItem[];
    createdAt: string;
    updatedAt: string;
}

export interface TransactionItem {
    id: number;
    transactionId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    lineTotal: number;
    product?: Product;
}

export const posApi = {
    createTransaction: (data: Partial<Transaction> & { items: Partial<TransactionItem>[] }) =>
        apiCall<Transaction>('/pos/transactions', { method: 'POST', body: JSON.stringify(data) }),

    getTransaction: (id: number) => apiCall<Transaction>(`/pos/transactions/${id}`),

    listTransactions: (params: { tenantId: number; outletId?: number; transactionType?: string; limit?: number; offset?: number }) =>
        apiCall<{ transactions: Transaction[]; total: number }>(`/pos/transactions${buildQueryString(params)}`),

    voidTransaction: (id: number) =>
        apiCall<Transaction>(`/pos/transactions/${id}/void`, { method: 'POST' }),
};

// ─── Dashboard / Analytics Service ─────────────────────────

export interface DashboardOverview {
    totalRevenue: number;
    totalTransactions: number;
    activeCustomers: number;
    productCount: number;
    lowStockCount: number;
    recentTransactions: Transaction[];
    topProducts: { productId: number; name: string; totalSold: number; revenue: number }[];
}

export const dashboardApi = {
    getOverview: (params: { tenantId: number; outletId?: number; dateFrom?: string; dateTo?: string }) =>
        apiCall<DashboardOverview>(`/dashboard/overview${buildQueryString(params)}`),
};

export const analyticsApi = {
    getDashboard: () => apiCall<any>('/analytics/dashboard'),

    generateReport: (params: { reportType: string; startDate: string; endDate: string; clientId?: number }) =>
        apiCall<any>(`/analytics/reports${buildQueryString(params)}`),
};

// ─── Settings Service ──────────────────────────────────────

export interface Settings {
    id: number;
    userId: number;
    companyName?: string;
    companyEmail?: string;
    companyPhone?: string;
    companyAddress?: string;
    taxRate?: number;
    currency?: string;
    invoicePrefix?: string;
    proposalPrefix?: string;
    paymentTerms?: number;
    branding?: Record<string, any>;
}

export const settingsApi = {
    get: () => apiCall<Settings>('/settings'),
    update: (data: Partial<Settings>) =>
        apiCall<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Tenants Service ───────────────────────────────────────

export interface Tenant {
    id: number;
    name: string;
    subdomain: string;
    industry: string;
    currency: string;
    timezone: string;
    financialYearStart: string;
    taxSettings: Record<string, any>;
    branding: Record<string, any>;
    settings: Record<string, any>;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const tenantsApi = {
    get: (id: number) => apiCall<Tenant>(`/tenants/${id}`),
    create: (data: Partial<Tenant>) => apiCall<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Tenant>) => apiCall<Tenant>(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Notifications Service ──────────────────────────────────

export interface Notification {
    id: number;
    userId: number;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export const notificationsApi = {
    list: (params?: { limit?: number; offset?: number }) =>
        apiCall<{ notifications: Notification[]; total: number }>(`/notifications${buildQueryString(params || {})}`),

    markRead: (id: number) =>
        apiCall<void>(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// ─── Files Service ─────────────────────────────────────────

export const filesApi = {
    list: (params?: { entityType?: string; entityId?: number; limit?: number; offset?: number }) =>
        apiCall<{ files: any[]; total: number }>(`/files${buildQueryString(params || {})}`),

    get: (id: number) => apiCall<any>(`/files/${id}`),

    upload: (data: { fileName: string; fileSize: number; contentType: string; entityType?: string; entityId?: number }) =>
        apiCall<{ uploadUrl: string; fileId: number }>('/files/upload', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Default export for backward compatibility with `import backend from ...` pattern ───

const backend = {
    auth: authApi,
    clients: clientsApi,
    proposals: proposalsApi,
    contracts: contractsApi,
    invoices: invoicesApi,
    payments: paymentsApi,
    products: productsApi,
    inventory: inventoryApi,
    customers: customersApi,
    suppliers: suppliersApi,
    pos: posApi,
    dashboard: dashboardApi,
    analytics: analyticsApi,
    settings: settingsApi,
    tenants: tenantsApi,
    notifications: notificationsApi,
    files: filesApi,
};

// ─── Documents & Email Service ─────────────────────────────

export const documentsApi = {
    downloadInvoicePdf: (invoiceId: number) =>
        fetch(`${API_BASE_URL}/docs/invoices/${invoiceId}/pdf`, {
            headers: { ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}) } as Record<string, string>,
        }).then(async (resp) => {
            if (!resp.ok) throw new Error('Failed to download PDF');
            return resp.blob();
        }),

    sendInvoice: (invoiceId: number) =>
        apiCall<{ success: boolean; message: string; emailSent: boolean }>(`/docs/invoices/${invoiceId}/send`, { method: 'POST' }),

    sendReminder: (invoiceId: number) =>
        apiCall<{ success: boolean; message: string; emailSent: boolean; daysOverdue: number }>(`/docs/invoices/${invoiceId}/remind`, { method: 'POST' }),

    downloadProposalPdf: (proposalId: number) =>
        fetch(`${API_BASE_URL}/docs/proposals/${proposalId}/pdf`, {
            headers: { ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}) } as Record<string, string>,
        }).then(async (resp) => {
            if (!resp.ok) throw new Error('Failed to download PDF');
            return resp.blob();
        }),
};

export default backend;
