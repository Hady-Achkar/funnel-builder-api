export interface CloudFlareConfig {
  apiToken: string;
  accountId: string;
  zoneId: string;
  saasTarget: string;
  platformMainDomain: string;
}

export interface CloudFlareAPIResponse<T = any> {
  success: boolean;
  errors: Array<{
    code: number;
    message: string;
  }>;
  messages: string[];
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
}

export interface CloudFlareZone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  development_mode: number;
  name_servers: string[];
  original_name_servers: string[];
  original_registrar: string;
  original_dnshost: string;
  modified_on: string;
  created_on: string;
  activated_on: string;
  meta: {
    step: number;
    custom_certificate_quota: number;
    page_rule_quota: number;
    phishing_detected: boolean;
    multiple_railguns_allowed: boolean;
  };
  owner: {
    id: string;
    type: string;
    email: string;
  };
  account: {
    id: string;
    name: string;
  };
  tenant: {
    id: string;
    name: string;
  };
  tenant_unit: {
    id: string;
  };
  permissions: string[];
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    frequency: string;
    is_subscribed: boolean;
    can_subscribe: boolean;
    legacy_id: string;
    legacy_discount: boolean;
    externally_managed: boolean;
  };
}

export interface CloudFlareDNSRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  locked: boolean;
  meta: {
    auto_added: boolean;
    managed_by_apps: boolean;
    managed_by_argo_tunnel: boolean;
  };
  comment: string;
  tags: string[];
  created_on: string;
  modified_on: string;
}

export interface CloudFlareCustomHostname {
  id: string;
  hostname: string;
  custom_metadata?: Record<string, any>;
  ssl: {
    status: string;
    method: string;
    type: string;
    validation_errors?: Array<{
      message: string;
    }>;
    validation_records?: Array<{
      txt_name: string;
      txt_value: string;
      http_url?: string;
      http_body?: string;
      cname_target?: string;
      cname_name?: string;
    }>;
    certificate_authority: string;
    issuer: string;
    serial_number: string;
    signature: string;
    uploaded_on: string;
    expires_on: string;
    settings: {
      http2: string;
      min_tls_version: string;
      tls_1_3: string;
      ciphers: string[];
      early_hints: string;
    };
  };
  ownership_verification: {
    type: string;
    name: string;
    value: string;
  };
  ownership_verification_http?: {
    http_url: string;
    http_body: string;
  };
  status: string;
  verification_errors?: Array<{
    message: string;
  }>;
  created_at: string;
}

export interface CreateCustomHostnameRequest {
  hostname: string;
  ssl: {
    method: string;
    type: string;
    settings?: {
      http2?: string;
      min_tls_version?: string;
      tls_1_3?: string;
      early_hints?: string;
    };
  };
  custom_metadata?: Record<string, any>;
}

export interface CreateDNSRecordRequest {
  type: string;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
  tags?: string[];
}
