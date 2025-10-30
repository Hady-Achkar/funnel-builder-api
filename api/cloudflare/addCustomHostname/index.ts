import { getAxiosInstance } from "../getAxiosInstance";
import { CloudflareConfig, CustomHostnameResult } from "../types";

/**
 * Adds a custom hostname to Cloudflare (SSL for SaaS)
 *
 * @param hostname - The custom hostname (e.g., "example.com")
 * @param zoneId - Cloudflare zone ID
 * @param config - Cloudflare configuration
 * @param options - Optional settings
 * @returns Custom hostname details
 *
 * @example
 * ```typescript
 * const result = await addCustomHostname(
 *   "example.com",
 *   "zone-id-123",
 *   { apiToken: process.env.CF_API_TOKEN! },
 *   {
 *     sslMethod: "txt",
 *     customOriginServer: "origin.myapp.com"
 *   }
 * );
 * ```
 */
export async function addCustomHostname(
  hostname: string,
  zoneId: string,
  config: CloudflareConfig,
  options?: {
    sslMethod?: string;
    customOriginServer?: string;
    customOriginSni?: string;
  }
): Promise<CustomHostnameResult> {
  const cf = getAxiosInstance(config);

  const payload: any = {
    hostname,
    ssl: {
      method: options?.sslMethod || "txt",
      type: "dv",
      settings: {
        http2: "on",
        min_tls_version: "1.2",
        tls_1_3: "on",
      },
    },
  };

  // Add custom origin server if provided
  if (options?.customOriginServer) {
    payload.custom_origin_server = options.customOriginServer;
  }

  // Add custom origin SNI if provided (requires Cloudflare Enterprise)
  if (options?.customOriginSni) {
    payload.custom_origin_sni = options.customOriginSni;
  }

  const url = `/zones/${zoneId}/custom_hostnames`;
  const response = await cf.post(url, payload);

  return response.data.result;
}
