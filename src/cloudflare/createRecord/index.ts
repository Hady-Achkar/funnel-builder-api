import { getAxiosInstance } from "../getAxiosInstance";
import {
  CloudflareConfig,
  DNSRecord,
  DNSRecordSchema,
  DNSRecordResult,
  CloudflareAPIResponseSchema,
} from "../types";

/**
 * Creates a DNS record in Cloudflare
 *
 * @param zoneId - Cloudflare zone ID
 * @param record - DNS record data
 * @param config - Cloudflare configuration
 * @returns Created DNS record details
 *
 * @example
 * ```typescript
 * const result = await createRecord(
 *   "zone-id-123",
 *   {
 *     type: "A",
 *     name: "subdomain",
 *     content: "192.0.2.1",
 *     ttl: 3600,
 *     proxied: true
 *   },
 *   { apiToken: process.env.CF_API_TOKEN! }
 * );
 * ```
 */
export async function createRecord(
  zoneId: string,
  record: DNSRecord,
  config: CloudflareConfig
): Promise<DNSRecordResult> {
  const validatedRecord = DNSRecordSchema.parse(record);

  const cf = getAxiosInstance(config);
  const resp = await cf.post(`/zones/${zoneId}/dns_records`, validatedRecord);

  const response = CloudflareAPIResponseSchema.parse(resp.data);

  if (!response.success) {
    const errs = response.errors.map((e) => e.message).join("; ");
    throw new Error(`CloudFlare createRecord error: ${errs}`);
  }

  return response.result;
}
