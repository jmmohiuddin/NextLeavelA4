// Type declaration for sslcommerz-lts (no official @types package)
declare module "sslcommerz-lts" {
  interface SSLCommerzInitData {
    total_amount: number;
    currency: string;
    tran_id: string;
    success_url: string;
    fail_url: string;
    cancel_url: string;
    ipn_url: string;
    shipping_method: string;
    product_name: string;
    product_category: string;
    product_profile: string;
    cus_name: string;
    cus_email: string;
    cus_add1: string;
    cus_city: string;
    cus_postcode: string;
    cus_country: string;
    cus_phone: string;
    value_a?: string;
    value_b?: string;
    value_c?: string;
    value_d?: string;
    [key: string]: unknown;
  }

  interface SSLCommerzInitResponse {
    status: string;
    GatewayPageURL?: string;
    [key: string]: unknown;
  }

  interface SSLCommerzValidateResponse {
    status: string;
    [key: string]: unknown;
  }

  class SSLCommerzPayment {
    constructor(storeId: string, storePassword: string, isLive: boolean);
    init(data: SSLCommerzInitData): Promise<SSLCommerzInitResponse>;
    validate(data: { val_id: string }): Promise<SSLCommerzValidateResponse>;
  }

  export = SSLCommerzPayment;
}
