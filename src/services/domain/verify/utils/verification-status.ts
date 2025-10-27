import { DomainStatus, SslStatus } from "../../../../generated/prisma-client";

export interface SslValidationRecord {
  txt_name?: string;
  txt_value?: string;
  http_url?: string;
  http_body?: string;
  cname_target?: string;
  cname_name?: string;
}

export interface VerificationStatusResult {
  message: string;
  shouldUpdateVerified: boolean;
  shouldUpdateActive: boolean;
  isFullyActive: boolean;
  nextStep: SslValidationRecord | null;
}

export type CloudFlareHostnameStatus = string;
export type CloudFlareSslStatus = string;

export function determineVerificationStatus(
  hostnameStatus: CloudFlareHostnameStatus,
  sslStatus: CloudFlareSslStatus,
  validationRecords?: any
): VerificationStatusResult {
  // Cloudflare-based verification logic
  const isHostnameActive = hostnameStatus === "active";
  const isSslActive = sslStatus === "active";

  let message = "Verification in progress";
  let nextStep: SslValidationRecord | null = null;

  if (!isHostnameActive) {
    message = "Waiting for DNS propagation. This usually takes 5-10 minutes.";
  } else if (!isSslActive && validationRecords) {
    message = "DNS verified! SSL certificate is being issued.";
    // Cloudflare returns validation_records as an array, take the first one
    if (Array.isArray(validationRecords) && validationRecords.length > 0) {
      nextStep = validationRecords[0];
    } else if (typeof validationRecords === 'object' && !Array.isArray(validationRecords)) {
      nextStep = validationRecords;
    }
  } else if (isSslActive) {
    message = "Domain fully verified and active with SSL!";
  }

  return {
    message,
    shouldUpdateVerified: isHostnameActive,
    shouldUpdateActive: isHostnameActive && isSslActive,
    isFullyActive: isHostnameActive && isSslActive,
    nextStep,
  };
}

export function getStatusUpdateData(
  hostnameStatus: CloudFlareHostnameStatus,
  sslStatus: CloudFlareSslStatus,
  verificationResult: VerificationStatusResult
): any {
  return {
    status: verificationResult.shouldUpdateActive ? DomainStatus.ACTIVE : DomainStatus.VERIFIED,
    sslStatus: sslStatus === "active" ? SslStatus.ACTIVE : SslStatus.PENDING,
    lastVerifiedAt: new Date(),
  };
}
