import { getCloudFlareAPIHelper } from "../../../../utils/domain-utils/cloudflare-api";

/**
 * Creates a workspace subdomain DNS record on workspace.digitalsite.io
 * This is called automatically when a workspace is created
 * NOTE: Only creates DNS record in Cloudflare, NOT in database
 */
export async function createWorkspaceSubdomain(
  workspaceId: number,
  workspaceSlug: string,
  userId: number
): Promise<void> {
  // Configuration for workspace subdomains
  const WORKSPACE_SUBDOMAIN_BASE = process.env.WORKSPACE_DOMAIN || "workspace.digitalsite.io";
  const WORKSPACE_ZONE_ID = process.env.WORKSPACE_ZONE_ID || "00fe01ea57882846ed426795d5f017e9";
  const WORKSPACE_IP = process.env.WORKSPACE_IP || "132.164.127.184";

  const fullHostname = `${workspaceSlug}.${WORKSPACE_SUBDOMAIN_BASE}`;

  // Create A record in Cloudflare
  const cloudflareHelper = getCloudFlareAPIHelper();
  const cf = cloudflareHelper.getAxiosInstance();

  const dnsPayload = {
    type: "A",
    name: `${workspaceSlug}.workspace`, // This will create subdomain.workspace.digitalsite.io
    content: WORKSPACE_IP,
    ttl: 3600,
    proxied: true,
  };

  try {
    const dnsResponse = await cf.post(`/zones/${WORKSPACE_ZONE_ID}/dns_records`, dnsPayload);
    const aRecord = dnsResponse.data.result;

    console.log(`[Workspace Subdomain] Successfully created DNS record: ${fullHostname} (Record ID: ${aRecord.id})`);
  } catch (error: any) {
    const errMsg = error.response?.data?.errors?.[0]?.message || error.message;
    console.error(`[Workspace Subdomain] Cloudflare API Error: ${errMsg}`);
    throw error;
  }
}
