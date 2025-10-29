import { DNSRecords } from "../../../../types/domain/get-dns-instructions/get-dns-instructions.types";

export const calculateProgress = (
  domainRecord: any,
  dnsRecords: DNSRecords
) => {
  let totalRecords = 0;
  let completedRecords = 0;

  if (dnsRecords.ownership) {
    totalRecords++;
    if (
      dnsRecords.ownership.status === "verified" ||
      dnsRecords.ownership.status === "active"
    ) {
      completedRecords++;
    }
  }

  if (dnsRecords.traffic) {
    totalRecords++;
    if (dnsRecords.traffic.status === "active") {
      completedRecords++;
    }
  }

  // Count all SSL records, not just required ones
  // This gives users visibility of all DNS records they'll eventually need
  if (dnsRecords.ssl && dnsRecords.ssl.length > 0) {
    totalRecords += dnsRecords.ssl.length;
    completedRecords += dnsRecords.ssl.filter(
      (record) => record.status === "active"
    ).length;
  }

  const percentage =
    totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0;

  let nextStep: string | undefined;
  if (domainRecord.status === "PENDING") {
    nextStep = "Add the TXT record for domain ownership verification";
  } else if (
    domainRecord.status === "VERIFIED" &&
    domainRecord.sslStatus !== "ACTIVE"
  ) {
    if (dnsRecords.ssl && dnsRecords.ssl.length > 0) {
      nextStep = "Add the SSL validation records to complete setup";
    } else {
      nextStep = "Waiting for SSL certificate provisioning";
    }
  } else if (domainRecord.status === "ACTIVE") {
    nextStep = undefined;
  }

  return {
    totalRecords,
    completedRecords,
    progress: {
      percentage,
      nextStep,
    },
  };
};
