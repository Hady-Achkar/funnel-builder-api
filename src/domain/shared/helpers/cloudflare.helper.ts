import { getCloudFlareAPIHelper } from "../helpers/cloudflare-api.helper";
import {
  CustomHostnamePayload,
  CustomHostnamePayloadSchema,
} from "../types";

export async function addCustomHostname(
  hostname: string,
  zoneId: string,
  sslMethod: string = "http"
) {
  const payload: CustomHostnamePayload = {
    hostname,
    ssl: {
      method: sslMethod,
      type: "dv",
      settings: {
        http2: "on",
        min_tls_version: "1.2",
      },
    },
  };

  const validatedPayload = CustomHostnamePayloadSchema.parse(payload);

  const cloudflareHelper = getCloudFlareAPIHelper();
  const cf = cloudflareHelper.getAxiosInstance();

  const url = `/zones/${zoneId}/custom_hostnames`;
  const response = await cf.post(url, validatedPayload);

  return response.data.result;
}

export async function getCustomHostnameDetails(
  customHostnameId: string,
  zoneId: string
) {
  const cloudflareHelper = getCloudFlareAPIHelper();
  const cf = cloudflareHelper.getAxiosInstance();

  const url = `/zones/${zoneId}/custom_hostnames/${customHostnameId}`;
  const response = await cf.get(url);

  return response.data.result;
}