import { getAxiosInstance } from "../getAxiosInstance";
import { CloudflareConfig, DNSRecordResult } from "../types";

/**
 * Creates a workspace subdomain DNS record
 * This creates only the DNS A record in Cloudflare (not stored in database)
 *
 * @param workspaceSlug - The workspace slug (becomes subdomain name)
 * @param zoneId - Cloudflare zone ID for workspace domain
 * @param ipAddress - IP address to point to
 * @param config - Cloudflare configuration
 * @returns Created DNS record details
 *
 * @example
 * ```typescript
 * const result = await createWorkspaceSubdomain(
 *   "my-workspace",
 *   "workspace-zone-id",
 *   "192.0.2.1",
 *   { apiToken: process.env.CF_API_TOKEN! }
 * );
 * // Creates: my-workspace.digitalsite.io -> 192.0.2.1
 * ```
 */
export async function createWorkspaceSubdomain(
  workspaceSlug: string,
  zoneId: string,
  ipAddress: string,
  config: CloudflareConfig
): Promise<DNSRecordResult> {
  const cf = getAxiosInstance(config);

  const dnsPayload = {
    type: "A",
    name: workspaceSlug,
    content: ipAddress,
    ttl: 3600,
    proxied: true,
  };

  const dnsResponse = await cf.post(`/zones/${zoneId}/dns_records`, dnsPayload);

  return dnsResponse.data.result;
}
