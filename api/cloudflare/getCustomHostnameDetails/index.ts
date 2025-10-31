import { getAxiosInstance } from "../getAxiosInstance";
import { CloudflareConfig, CustomHostnameResult } from "../types";

/**
 * Gets details for a custom hostname from Cloudflare
 *
 * @param customHostnameId - Custom hostname ID
 * @param zoneId - Cloudflare zone ID
 * @param config - Cloudflare configuration
 * @returns Custom hostname details including SSL status
 *
 * @example
 * ```typescript
 * const details = await getCustomHostnameDetails(
 *   "custom-hostname-id-123",
 *   "zone-id-456",
 *   { apiToken: process.env.CF_API_TOKEN! }
 * );
 *
 * console.log(details.ssl.status); // "active" or "pending_validation"
 * ```
 */
export async function getCustomHostnameDetails(
  customHostnameId: string,
  zoneId: string,
  config: CloudflareConfig
): Promise<CustomHostnameResult> {
  const cf = getAxiosInstance(config);

  const url = `/zones/${zoneId}/custom_hostnames/${customHostnameId}`;
  const response = await cf.get(url);

  return response.data.result;
}
