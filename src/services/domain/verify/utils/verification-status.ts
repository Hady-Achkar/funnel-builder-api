import { DomainStatus, SslStatus } from "../../../../generated/prisma-client";

export interface VerificationStatusResult {
  message: string;
  shouldUpdateVerified: boolean;
  shouldUpdateActive: boolean;
  isFullyActive: boolean;
  nextStep: string | null;
}

export type CloudFlareHostnameStatus = string;
export type CloudFlareSslStatus = string;

export function determineVerificationStatus(
  hostnameStatus: CloudFlareHostnameStatus,
  sslStatus: CloudFlareSslStatus,
  validationRecords?: any
): VerificationStatusResult {
  // Azure-based verification logic
  return {
    message: "Verification in progress",
    shouldUpdateVerified: hostnameStatus === "Approved",
    shouldUpdateActive: hostnameStatus === "Approved" && sslStatus === "active",
    isFullyActive: hostnameStatus === "Approved" && sslStatus === "active",
    nextStep: "Add DNS records and wait for validation",
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
