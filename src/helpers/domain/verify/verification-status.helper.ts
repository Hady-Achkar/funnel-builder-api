import {
  CloudFlareHostnameStatus,
  CloudFlareSslStatus,
  SslValidationRecord,
} from "../../../types/domain/verify";

export interface VerificationStatusResult {
  message: string;
  isFullyActive: boolean;
  shouldUpdateVerified: boolean;
  shouldUpdateActive: boolean;
  nextStep: SslValidationRecord | null;
}

export function determineVerificationStatus(
  hostnameStatus: CloudFlareHostnameStatus,
  sslStatus: CloudFlareSslStatus,
  sslValidationRecords?: any[]
): VerificationStatusResult {
  let message: string;
  let isFullyActive = false;
  let shouldUpdateVerified = false;
  let shouldUpdateActive = false;
  let nextStep: SslValidationRecord | null = null;

  if (hostnameStatus === "active" && sslStatus === "active") {
    message = "Congratulations! Your domain is fully configured and active.";
    isFullyActive = true;
    shouldUpdateVerified = true;
    shouldUpdateActive = true;
  } else if (hostnameStatus === "active" && sslStatus !== "active") {
    if (sslValidationRecords && sslValidationRecords.length > 0) {
      nextStep = parseSslValidationRecord(sslValidationRecords[0]);
      message =
        "Domain ownership verified. Please add the SSL validation records to complete setup.";
    } else {
      message = `Domain ownership verified. SSL certificate is being processed. Status: "${sslStatus}".`;
    }
    shouldUpdateVerified = true;
    shouldUpdateActive = true;
  } else {
    message = `Verification is still in progress. Status: "${hostnameStatus}", SSL: "${sslStatus}".`;

    if (sslValidationRecords && sslValidationRecords.length > 0) {
      nextStep = parseSslValidationRecord(sslValidationRecords[0]);
    }
  }

  return {
    message,
    isFullyActive,
    shouldUpdateVerified,
    shouldUpdateActive,
    nextStep,
  };
}

function parseSslValidationRecord(record: any): SslValidationRecord | null {
  if (!record) return null;

  try {
    return {
      txt_name: record.txt_name || undefined,
      txt_value: record.txt_value || undefined,
      http_url: record.http_url || undefined,
      http_body: record.http_body || undefined,
      cname_target: record.cname_target || undefined,
      cname_name: record.cname_name || undefined,
    };
  } catch (error) {
    console.error("Error parsing SSL validation record:", error);
    return null;
  }
}

export function getStatusUpdateData(
  hostnameStatus: CloudFlareHostnameStatus,
  sslStatus: CloudFlareSslStatus,
  verificationResult: VerificationStatusResult
) {
  const updateData: any = {
    status: hostnameStatus === "active" ? "VERIFIED" : "PENDING",
    sslStatus: sslStatus === "active" ? "ACTIVE" : "PENDING",
    lastVerifiedAt: new Date(),
  };

  if (verificationResult.shouldUpdateActive) {
    updateData.status = "ACTIVE";
  }

  return updateData;
}
