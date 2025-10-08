import { getCloudFlareAPIHelper } from "../../../../utils/domain-utils/cloudflare-api";
import { DNSRecords, DNSRecordStatus } from "../../../../types/domain/get-dns-instructions";

export const prepareDNSRecords = (
  domainRecord: any,
  currentSslValidationRecords?: any[]
): DNSRecords => {
  const dnsRecords: DNSRecords = {};

  if (domainRecord.ownershipVerification) {
    const ownershipStatus = getRecordStatus(domainRecord.status, "ownership");
    dnsRecords.ownership = {
      type: "TXT",
      name:
        domainRecord.ownershipVerification.name?.split(".")[0] ||
        "_cf-custom-hostname",
      value: domainRecord.ownershipVerification.value,
      purpose: "Domain Ownership Verification",
      status: ownershipStatus,
      required: true,
    };
  }

  if (domainRecord.dnsInstructions) {
    const trafficStatus = getRecordStatus(domainRecord.status, "traffic");
    const cloudflareHelper = getCloudFlareAPIHelper();
    const config = cloudflareHelper.getConfig();
    dnsRecords.traffic = {
      type: domainRecord.dnsInstructions.type || "CNAME",
      name: domainRecord.dnsInstructions.name,
      value: `fallback.${config.cfDomain}`,
      purpose: domainRecord.dnsInstructions.purpose || "Live Traffic",
      status: trafficStatus,
      required: true,
    };
  }

  const sslRecords =
    currentSslValidationRecords || domainRecord.sslValidationRecords;
  if (sslRecords && Array.isArray(sslRecords)) {
    const sslStatus = getRecordStatus(domainRecord.sslStatus, "ssl");
    dnsRecords.ssl = sslRecords.map((record: any) => ({
      type: record.txt_name ? "TXT" : "CNAME",
      name: record.txt_name || record.cname_name || "ssl-validation",
      value: record.txt_value || record.cname_target || "ssl-value",
      purpose: "SSL Certificate Validation",
      status: sslStatus,
      required:
        domainRecord.status === "VERIFIED" &&
        domainRecord.sslStatus !== "ACTIVE",
    }));
  }

  return dnsRecords;
};

const getRecordStatus = (
  domainStatus: string,
  recordType: "ownership" | "traffic" | "ssl"
): DNSRecordStatus => {
  switch (recordType) {
    case "ownership":
      return domainStatus === "PENDING"
        ? "pending"
        : domainStatus === "VERIFIED"
        ? "verified"
        : domainStatus === "ACTIVE"
        ? "active"
        : "pending";

    case "traffic":
      return domainStatus === "ACTIVE" ? "active" : "pending";

    case "ssl":
      return domainStatus === "ACTIVE"
        ? "active"
        : domainStatus === "VERIFIED"
        ? "pending"
        : "pending";

    default:
      return "pending";
  }
};
