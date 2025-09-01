import { getCloudFlareAPIHelper } from "../../shared/helpers";

export const deleteCustomHostname = async (
  customHostnameId: string,
  zoneId: string
): Promise<boolean> => {
  try {
    const cloudflareHelper = getCloudFlareAPIHelper();
    const cf = cloudflareHelper.getAxiosInstance();

    const url = `/zones/${zoneId}/custom_hostnames/${customHostnameId}`;

    const response = await cf.delete(url);

    if (response.data.success) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      return true;
    }
    throw error;
  }
};

export const deleteARecord = async (
  recordId: string,
  zoneId: string
): Promise<boolean> => {
  try {
    const cloudflareHelper = getCloudFlareAPIHelper();
    const cf = cloudflareHelper.getAxiosInstance();

    const url = `/zones/${zoneId}/dns_records/${recordId}`;

    const response = await cf.delete(url);

    if (response.data.success) {
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      return true;
    }
    throw error;
  }
};
