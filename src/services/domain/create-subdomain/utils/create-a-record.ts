import { getCloudFlareAPIHelper } from "../../../../utils/domain-utils/cloudflare-api";

export const createARecord = async (
  subdomain: string,
  zoneId: string,
  ipAddress: string
) => {
  const cloudflareHelper = getCloudFlareAPIHelper();
  const cf = cloudflareHelper.getAxiosInstance();

  const payload = {
    type: "A",
    name: subdomain,
    content: ipAddress,
    ttl: 3600,
    proxied: true,
  };

  const url = `/zones/${zoneId}/dns_records`;
  const response = await cf.post(url, payload);

  return response.data.result;
};
