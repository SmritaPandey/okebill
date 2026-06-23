export interface PaygConfig {
    merchantKeyId: string;
    merchantMid: string;
    authenticationKey: string;
    authenticationToken: string;
    isProduction: boolean;
    redirectUrl: string;
}
export interface PaygOrderRequest {
    uniqueRequestId: string;
    orderAmount: number;
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    customerMobile: string;
    customerAddress?: string;
    customerCity?: string;
    customerState?: string;
    customerZipCode?: string;
    productDescription: string;
    userDefined1?: string;
}
export interface PaygOrderResponse {
    OrderKeyId: string;
    MerchantKeyId: number;
    UniqueRequestId: string;
    OrderType: string;
    OrderAmount: number;
    OrderStatus: string | null;
    OrderPaymentStatus: number;
    OrderPaymentStatusText: string | null;
    PaymentStatus: number;
    PaymentTransactionId: string | null;
    PaymentResponseCode: number;
    PaymentResponseText: string | null;
    PaymentMethod: string | null;
    PaymentDateTime: string | null;
    PaymentProcessUrl: string;
    CustomerData: Record<string, any>;
    UserDefinedData: Record<string, any>;
    Id: number;
}
export interface PaygStatusRequest {
    orderKeyId: string;
}
export declare function createPaygOrder(req: PaygOrderRequest): Promise<PaygOrderResponse>;
export declare function getPaygOrderStatus(orderKeyId: string): Promise<PaygOrderResponse>;
export declare const SUBSCRIPTION_PLANS: {
    id: string;
    name: string;
    price: number;
    duration: number;
    features: string[];
    limits: {
        invoicesPerMonth: number;
        clients: number;
    };
}[];
//# sourceMappingURL=payg.d.ts.map