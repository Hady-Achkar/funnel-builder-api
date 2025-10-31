import { getAxiosInstance } from "../getAxiosInstance";
import { CloudflareConfig, DNSRecordResult } from "../types";

/**
 * Creates an A record in Cloudflare
 *
 * @param subdomain - The subdomain name (just the subdomain part, not full hostname)
 * @param zoneId - Cloudflare zone ID
 * @param ipAddress - IP address to point to
 * @param config - Cloudflare configuration
 * @param options - Optional settings (ttl, proxied)
 * @returns Created DNS record details
 *
 * @example
 * ```typescript
 * const result = await createARecord(
 *   "subdomain",
 *   "zone-id-123",
 *   "192.0.2.1",
 *   { apiToken: process.env.CF_API_TOKEN! },
 *   { ttl: 3600, proxied: true }
 * );
 * ```
 */
export async function createARecord(
  subdomain: string,
  zoneId: string,
  ipAddress: string,
  config: CloudflareConfig,
  options?: {
    ttl?: number;
    proxied?: boolean;
  }
): Promise<DNSRecordResult> {
  const cf = getAxiosInstance(config);

  const payload = {
    type: "A",
    name: subdomain,
    content: ipAddress,
    ttl: options?.ttl || 3600,
    proxied: options?.proxied !== undefined ? options.proxied : true,
  };

  const response = await cf.post(`/zones/${zoneId}/dns_records`, payload);

  return response.data.result;
}
