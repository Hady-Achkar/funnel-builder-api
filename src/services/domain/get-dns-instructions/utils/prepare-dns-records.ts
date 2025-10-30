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
    const verificationDomain = process.env.CF_SUBDOMAIN || "digitalsite.app";
    dnsRecords.traffic = {
      type: domainRecord.dnsInstructions.type || "CNAME",
      name: domainRecord.dnsInstructions.name,
      value: `origin.${verificationDomain}`,
      purpose: domainRecord.dnsInstructions.purpose || "Live Traffic",
      status: trafficStatus,
      required: true,
    };
  }

  const sslRecords =
    currentSslValidationRecords || domainRecord.sslValidationRecords;
  if (sslRecords && Array.isArray(sslRecords)) {
    const sslStatus = getRecordStatus(domainRecord.sslStatus, "ssl");
    dnsRecords.ssl = sslRecords.map((record: any) => {
      // Extract subdomain part from full TXT name
      // Example: "_acme-challenge.www.digitalsite.digital" -> "_acme-challenge.www"
      let txtNameShort = record.txt_name || record.cname_name || "ssl-validation";
      if (record.txt_name && domainRecord.hostname) {
        const parts = domainRecord.hostname.split('.');
        if (parts.length >= 2) {
          const baseDomain = parts.slice(-2).join('.');
          txtNameShort = record.txt_name.endsWith(`.${baseDomain}`)
            ? record.txt_name.slice(0, -(baseDomain.length + 1))
            : record.txt_name;
        }
      }

      return {
        type: record.txt_name ? "TXT" : "CNAME",
        name: txtNameShort,
        fullName: record.txt_name, // Include full name for reference
        value: record.txt_value || record.cname_target || "ssl-value",
        purpose: "SSL Certificate Validation",
        status: sslStatus,
        required:
          domainRecord.status === "VERIFIED" &&
          domainRecord.sslStatus !== "ACTIVE",
      };
    });
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
