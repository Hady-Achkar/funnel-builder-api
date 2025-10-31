import { getAxiosInstance } from "../getAxiosInstance";
import { CloudflareConfig } from "../types";

/**
 * Deletes an A record from Cloudflare
 *
 * @param recordId - DNS record ID to delete
 * @param zoneId - Cloudflare zone ID
 * @param config - Cloudflare configuration
 * @returns true if deleted or not found (404), false otherwise
 *
 * @example
 * ```typescript
 * const deleted = await deleteARecord(
 *   "record-id-456",
 *   "zone-id-123",
 *   { apiToken: process.env.CF_API_TOKEN! }
 * );
 * ```
 */
export async function deleteARecord(
  recordId: string,
  zoneId: string,
  config: CloudflareConfig
): Promise<boolean> {
  try {
    const cf = getAxiosInstance(config);
    const response = await cf.delete(`/zones/${zoneId}/dns_records/${recordId}`);

    if (response.data.success) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    // Treat 404 as success (already deleted)
    if (error.response?.status === 404) {
      return true;
    }
    throw error;
  }
}
