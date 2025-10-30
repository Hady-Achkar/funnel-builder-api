import { getAxiosInstance } from "../getAxiosInstance";
import { CloudflareConfig } from "../types";

/**
 * Deletes a workspace subdomain DNS record from Cloudflare
 *
 * @param workspaceSlug - The workspace slug (subdomain name)
 * @param zoneId - Cloudflare zone ID for workspace domain
 * @param domain - The base domain (e.g., "digitalsite.io")
 * @param config - Cloudflare configuration
 * @returns Object with success status and deleted record IDs
 *
 * @example
 * ```typescript
 * const result = await deleteWorkspaceSubdomain(
 *   "my-workspace",
 *   "workspace-zone-id",
 *   "digitalsite.io",
 *   { apiToken: process.env.CF_API_TOKEN! }
 * );
 * // Deletes: my-workspace.digitalsite.io
 * ```
 */
export async function deleteWorkspaceSubdomain(
  workspaceSlug: string,
  zoneId: string,
  domain: string,
  config: CloudflareConfig
): Promise<{
  success: boolean;
  deleted: string[];
  error?: string;
}> {
  try {
    const cf = getAxiosInstance(config);
    const fullHostname = `${workspaceSlug}.${domain}`;

    // First, find the DNS record
    const listResponse = await cf.get(`/zones/${zoneId}/dns_records`, {
      params: {
        type: "A",
        name: fullHostname,
      },
    });

    const records = listResponse.data.result;

    if (!records || records.length === 0) {
      return {
        success: true,
        deleted: [],
      };
    }

    // Delete each matching record
    const deletedIds: string[] = [];
    for (const record of records) {
      await cf.delete(`/zones/${zoneId}/dns_records/${record.id}`);
      deletedIds.push(record.id);
    }

    return {
      success: true,
      deleted: deletedIds,
    };
  } catch (error: any) {
    return {
      success: false,
      deleted: [],
      error: error.message || "Unknown error",
    };
  }
}
