import { getAxiosInstance } from "../getAxiosInstance";
import { CloudflareConfig, CloudflareAPIResponseSchema } from "../types";

/**
 * Deletes a DNS record from Cloudflare
 *
 * @param zoneId - Cloudflare zone ID
 * @param recordId - DNS record ID to delete
 * @param config - Cloudflare configuration
 *
 * @example
 * ```typescript
 * await deleteRecord(
 *   "zone-id-123",
 *   "record-id-456",
 *   { apiToken: process.env.CF_API_TOKEN! }
 * );
 * ```
 */
export async function deleteRecord(
  zoneId: string,
  recordId: string,
  config: CloudflareConfig
): Promise<void> {
  const cf = getAxiosInstance(config);
  const resp = await cf.delete(`/zones/${zoneId}/dns_records/${recordId}`);

  const response = CloudflareAPIResponseSchema.parse(resp.data);

  if (!response.success) {
    const errs = response.errors.map((e) => e.message).join("; ");
    throw new Error(`CloudFlare deleteRecord error: ${errs}`);
  }
}
