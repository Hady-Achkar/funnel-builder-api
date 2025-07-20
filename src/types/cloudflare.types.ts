export interface CloudFlareConfig {
  apiToken: string;
  accountId: string;
  zoneId: string;
  saasTarget: string;
  platformMainDomain: string;
}

export interface CloudFlareAPIResponse<T = any> {
  success: boolean;
  errors: CloudFlareError[];
  messages: string[];
  result: T;
}

export interface CloudFlareError {
  code: number;
  message: string;
}

export interface CloudFlareZone {
  id: string;
  name: string;
  status: string;
}

export interface CloudFlareDNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied?: boolean;
}

export interface CloudFlareCustomHostname {
  id: string;
  hostname: string;
  status: 'pending' | 'active' | 'moved' | 'deleted';
  ssl: {
    status: 'initializing' | 'pending_validation' | 'deleted' | 'pending_issuance' | 'pending_deployment' | 'pending_deletion' | 'pending_expiration' | 'expired' | 'active' | 'initializing_timed_out' | 'validation_timed_out' | 'issuance_timed_out' | 'deployment_timed_out' | 'deletion_timed_out' | 'pending_cleanup' | 'staging_deployment' | 'staging_active' | 'deactivating' | 'inactive' | 'backup_issued' | 'holding_deployment';
    method: 'http' | 'txt' | 'email';
    type: 'dv';
    settings: {
      http2: 'on' | 'off';
      min_tls_version: '1.0' | '1.1' | '1.2' | '1.3';
    };
    validation_records?: CloudFlareSSLValidationRecord[];
  };
  ownership_verification: {
    type: 'txt';
    name: string;
    value: string;
  };
  ownership_verification_http?: {
    http_url: string;
    http_body: string;
  };
}

export interface CloudFlareSSLValidationRecord {
  type: 'txt' | 'cname';
  name: string;
  value: string;
}

export interface CreateCustomHostnameRequest {
  hostname: string;
  ssl: {
    method: 'http' | 'txt' | 'email';
    type: 'dv';
    settings: {
      http2: 'on' | 'off';
      min_tls_version: '1.0' | '1.1' | '1.2' | '1.3';
    };
  };
}

export interface CreateDNSRecordRequest {
  type: string;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
}