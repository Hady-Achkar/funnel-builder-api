import axios, { AxiosInstance } from "axios";
import psl, { ParsedDomain } from "psl";
import {
  CloudFlareConfig,
  CloudFlareConfigSchema,
  DNSRecord,
  DNSRecordSchema,
  CloudFlareAPIResponse,
  CloudFlareAPIResponseSchema,
} from "../../../types/domain/shared";

const zoneCache = new Map<string, string>();

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

class CloudFlareAPIHelper {
  private cf: AxiosInstance;
  private config: CloudFlareConfig;

  constructor() {
    this.config = CloudFlareConfigSchema.parse({
      cfApiToken: process.env.CF_API_TOKEN,
      cfAccountId: process.env.CF_ACCOUNT_ID,
      cfVerificationDomain: process.env.CF_VERIFICATION_DOMAIN,
      cfDomain: process.env.CF_DOMAIN,
      cfZoneId: process.env.CF_ZONE_ID,
      cfCustomHostnameZoneId: process.env.CF_CUSTOM_HOSTNAME_ZONE_ID,
    });

    this.cf = axios.create({
      baseURL: CF_API_BASE,
      headers: {
        Authorization: `Bearer ${this.config.cfApiToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  async getZoneId(hostname: string): Promise<string> {
    const parsed = psl.parse(hostname);
    if (typeof (parsed as ParsedDomain).domain !== "string") {
      throw new Error(`Cannot derive root domain from: ${hostname}`);
    }

    const rootDomain = (parsed as ParsedDomain).domain as string;

    if (zoneCache.has(rootDomain)) {
      return zoneCache.get(rootDomain)!;
    }

    const resp = await this.cf.get("/zones", {
      params: { name: rootDomain, status: "active" },
    });

    const response = CloudFlareAPIResponseSchema.parse(resp.data);

    if (!response.success || response.result.length === 0) {
      throw new Error(`CloudFlare zone not found for domain: ${rootDomain}`);
    }

    const id = response.result[0].id;
    zoneCache.set(rootDomain, id);
    return id;
  }

  async createRecord(zoneId: string, record: DNSRecord) {
    const validatedRecord = DNSRecordSchema.parse(record);

    const resp = await this.cf.post(
      `/zones/${zoneId}/dns_records`,
      validatedRecord
    );
    const response = CloudFlareAPIResponseSchema.parse(resp.data);

    if (!response.success) {
      const errs = response.errors.map((e) => e.message).join("; ");
      throw new Error(`CloudFlare createRecord error: ${errs}`);
    }

    return response.result;
  }

  async deleteRecord(zoneId: string, recordId: string): Promise<void> {
    const resp = await this.cf.delete(
      `/zones/${zoneId}/dns_records/${recordId}`
    );
    const response = CloudFlareAPIResponseSchema.parse(resp.data);

    if (!response.success) {
      const errs = response.errors.map((e) => e.message).join("; ");
      throw new Error(`CloudFlare deleteRecord error: ${errs}`);
    }
  }

  getConfig(): CloudFlareConfig {
    return { ...this.config };
  }

  getAxiosInstance(): AxiosInstance {
    return this.cf;
  }
}

let cloudflareAPIHelper: CloudFlareAPIHelper | null = null;

export function getCloudFlareAPIHelper(): CloudFlareAPIHelper {
  if (!cloudflareAPIHelper) {
    cloudflareAPIHelper = new CloudFlareAPIHelper();
  }
  return cloudflareAPIHelper;
}

export type { DNSRecord, CloudFlareConfig, CloudFlareAPIResponse };
