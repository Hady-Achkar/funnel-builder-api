import { getAxiosInstance } from "../getAxiosInstance";
import { CloudflareConfig } from "../types";

/**
 * Deletes a custom hostname from Cloudflare
 *
 * @param customHostnameId - Custom hostname ID to delete
 * @param zoneId - Cloudflare zone ID
 * @param config - Cloudflare configuration
 * @returns true if deleted or not found (404), false otherwise
 *
 * @example
 * ```typescript
 * const deleted = await deleteCustomHostname(
 *   "custom-hostname-id-123",
 *   "zone-id-456",
 *   { apiToken: process.env.CF_API_TOKEN! }
 * );
 * ```
 */
export async function deleteCustomHostname(
  customHostnameId: string,
  zoneId: string,
  config: CloudflareConfig
): Promise<boolean> {
  try {
    const cf = getAxiosInstance(config);
    const url = `/zones/${zoneId}/custom_hostnames/${customHostnameId}`;

    const response = await cf.delete(url);

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
