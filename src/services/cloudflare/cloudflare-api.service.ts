import axios, { AxiosInstance } from "axios";
import psl, { ParsedDomain } from "psl";
import { cacheService } from "../cache/cache.service";
import {
  CloudFlareConfig,
  CloudFlareAPIResponse,
  CloudFlareZone,
  CloudFlareDNSRecord,
  CloudFlareCustomHostname,
  CreateCustomHostnameRequest,
  CreateDNSRecordRequest,
} from "../../types/cloudflare.types";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

export class CloudFlareAPIService {
  private api: AxiosInstance;
  private config: CloudFlareConfig;

  constructor() {
    this.config = this.loadConfig();
    this.api = axios.create({
      baseURL: CF_API_BASE,
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  private loadConfig(): CloudFlareConfig {
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;
    const saasTarget = process.env.CLOUDFLARE_SAAS_TARGET;
    const platformMainDomain = process.env.PLATFORM_MAIN_DOMAIN;

    // Only throw error if this is production and tokens are missing
    if (process.env.NODE_ENV === 'production' && !apiToken) {
      throw new Error("Missing CloudFlare API token");
    }

    // For staging/development, allow dummy values
    return {
      apiToken: apiToken || 'dummy-token',
      accountId: accountId || 'dummy-account',
      zoneId: zoneId || 'dummy-zone',
      saasTarget: saasTarget || 'dummy-target.com',
      platformMainDomain: platformMainDomain || 'digitalsite.ai',
    };
  }

  /**
   * Get zone ID for a hostname with Redis caching
   */
  async getZoneId(hostname: string): Promise<string> {
    const parsed = psl.parse(hostname);
    if (typeof (parsed as ParsedDomain).domain !== "string") {
      throw new Error(`Cannot derive root domain from: ${hostname}`);
    }

    const rootDomain = (parsed as ParsedDomain).domain as string;

    // Check Redis cache first
    const cachedZoneId = await cacheService.getZoneId(rootDomain);
    if (cachedZoneId) {
      return cachedZoneId;
    }

    console.log(`[CloudFlare] Fetching zone ID for domain: ${rootDomain}`);
    const response = await this.api.get<
      CloudFlareAPIResponse<CloudFlareZone[]>
    >("/zones", {
      params: { name: rootDomain, status: "active" },
    });

    if (!response.data.success || response.data.result.length === 0) {
      throw new Error(`CloudFlare zone not found for domain: ${rootDomain}`);
    }

    const id = response.data.result[0].id;

    // Cache the zone ID for 24 hours
    await cacheService.setZoneId(rootDomain, id);

    return id;
  }

  /**
   * Create DNS record
   */
  async createDNSRecord(
    zoneId: string,
    record: CreateDNSRecordRequest
  ): Promise<CloudFlareDNSRecord> {
    const response = await this.api.post<
      CloudFlareAPIResponse<CloudFlareDNSRecord>
    >(`/zones/${zoneId}/dns_records`, record);

    if (!response.data.success) {
      const errors = response.data.errors.map((e) => e.message).join("; ");
      throw new Error(`CloudFlare createRecord error: ${errors}`);
    }

    return response.data.result;
  }

  /**
   * Delete DNS record
   */
  async deleteDNSRecord(zoneId: string, recordId: string): Promise<void> {
    const response = await this.api.delete<CloudFlareAPIResponse>(
      `/zones/${zoneId}/dns_records/${recordId}`
    );

    if (!response.data.success) {
      const errors = response.data.errors.map((e) => e.message).join("; ");
      throw new Error(`CloudFlare deleteRecord error: ${errors}`);
    }
  }

  /**
   * Create custom hostname for SaaS
   */
  async createCustomHostname(
    hostname: string,
    sslMethod: "http" | "txt" | "email" = "http"
  ): Promise<CloudFlareCustomHostname> {
    const payload: CreateCustomHostnameRequest = {
      hostname,
      ssl: {
        method: sslMethod,
        type: "dv",
        settings: {
          http2: "on",
          min_tls_version: "1.2",
        },
      },
    };

    const response = await this.api.post<
      CloudFlareAPIResponse<CloudFlareCustomHostname>
    >(`/zones/${this.config.zoneId}/custom_hostnames`, payload);

    if (!response.data.success) {
      const errors = response.data.errors.map((e) => e.message).join("; ");
      throw new Error(`CloudFlare createCustomHostname error: ${errors}`);
    }

    return response.data.result;
  }

  /**
   * Get custom hostname details
   */
  async getCustomHostname(
    customHostnameId: string
  ): Promise<CloudFlareCustomHostname> {
    const response = await this.api.get<
      CloudFlareAPIResponse<CloudFlareCustomHostname>
    >(`/zones/${this.config.zoneId}/custom_hostnames/${customHostnameId}`);

    if (!response.data.success) {
      const errors = response.data.errors.map((e) => e.message).join("; ");
      throw new Error(`CloudFlare getCustomHostname error: ${errors}`);
    }

    return response.data.result;
  }

  /**
   * Delete custom hostname
   */
  async deleteCustomHostname(customHostnameId: string): Promise<void> {
    const response = await this.api.delete<CloudFlareAPIResponse>(
      `/zones/${this.config.zoneId}/custom_hostnames/${customHostnameId}`
    );

    if (!response.data.success) {
      const errors = response.data.errors.map((e) => e.message).join("; ");
      throw new Error(`CloudFlare deleteCustomHostname error: ${errors}`);
    }
  }

  /**
   * Create subdomain A record for platform subdomains
   */
  async createSubdomainRecord(
    subdomain: string,
    targetIP: string = "74.234.194.84"
  ): Promise<CloudFlareDNSRecord> {
    // Use the platform zone ID for subdomains
    const platformZoneId = this.config.zoneId;

    const record: CreateDNSRecordRequest = {
      type: "A",
      name: subdomain,
      content: targetIP,
      ttl: 3600,
      proxied: true,
    };

    return this.createDNSRecord(platformZoneId, record);
  }

  /**
   * Get config for external use
   */
  getConfig(): CloudFlareConfig {
    return { ...this.config };
  }

  /**
   * Check if CloudFlare is properly configured
   */
  isConfigured(): boolean {
    return (
      this.config.apiToken !== 'dummy-token' &&
      this.config.accountId !== 'dummy-account' &&
      this.config.zoneId !== 'dummy-zone' &&
      !!this.config.apiToken
    );
  }

  /**
   * Verify DNS propagation (simplified check)
   */
  async verifyDNSPropagation(
    hostname: string,
    expectedValue: string,
    recordType: "A" | "CNAME" | "TXT" = "CNAME"
  ): Promise<boolean> {
    try {
      // In a real implementation, you'd use DNS lookup libraries
      // For now, we'll simulate verification by checking with CloudFlare
      const zoneId = await this.getZoneId(hostname);

      const response = await this.api.get<
        CloudFlareAPIResponse<CloudFlareDNSRecord[]>
      >(`/zones/${zoneId}/dns_records`, {
        params: {
          name: hostname,
          type: recordType,
        },
      });

      if (!response.data.success) {
        return false;
      }

      return response.data.result.some(
        (record) => record.content === expectedValue || record.name === hostname
      );
    } catch (error) {
      console.error("DNS verification error:", error);
      return false;
    }
  }
}
