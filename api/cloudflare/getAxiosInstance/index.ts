import axios, { AxiosInstance } from "axios";
import { CloudflareConfig } from "../types";

/**
 * Creates and returns a configured Axios instance for Cloudflare API calls
 *
 * @param config - Cloudflare configuration with API token
 * @returns Configured Axios instance
 *
 * @example
 * ```typescript
 * const cf = getAxiosInstance({
 *   apiToken: process.env.CF_API_TOKEN!,
 *   zoneId: 'your-zone-id'
 * });
 *
 * const response = await cf.get('/zones/your-zone-id/dns_records');
 * ```
 */
export function getAxiosInstance(config: CloudflareConfig): AxiosInstance {
  const CF_API_BASE = "https://api.cloudflare.com/client/v4";

  return axios.create({
    baseURL: CF_API_BASE,
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
    timeout: 30000, // 30 seconds
  });
}
