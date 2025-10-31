import psl, { ParsedDomain } from "psl";
import { getAxiosInstance } from "../getAxiosInstance";
import { CloudflareConfig, CloudflareAPIResponseSchema, ZoneListResult } from "../types";

const zoneCache = new Map<string, string>();

/**
 * Gets Cloudflare zone ID for a hostname
 *
 * @param hostname - The hostname to get zone ID for (e.g., "example.com" or "subdomain.example.com")
 * @param config - Cloudflare configuration
 * @returns Zone ID for the domain
 *
 * @example
 * ```typescript
 * const zoneId = await getZoneId("example.com", {
 *   apiToken: process.env.CF_API_TOKEN!
 * });
 * ```
 */
export async function getZoneId(
  hostname: string,
  config: CloudflareConfig
): Promise<string> {
  const parsed = psl.parse(hostname);
  if (typeof (parsed as ParsedDomain).domain !== "string") {
    throw new Error(`Cannot derive root domain from: ${hostname}`);
  }

  const rootDomain = (parsed as ParsedDomain).domain as string;

  // Check cache first
  if (zoneCache.has(rootDomain)) {
    return zoneCache.get(rootDomain)!;
  }

  const cf = getAxiosInstance(config);
  const resp = await cf.get("/zones", {
    params: { name: rootDomain, status: "active" },
  });

  const response = CloudflareAPIResponseSchema.parse(resp.data);

  if (!response.success || response.result.length === 0) {
    throw new Error(`CloudFlare zone not found for domain: ${rootDomain}`);
  }

  const id = response.result[0].id;
  zoneCache.set(rootDomain, id);
  return id;
}

/**
 * Clears the zone ID cache
 * Useful for testing or when zones are updated
 */
export function clearZoneCache(): void {
  zoneCache.clear();
}
