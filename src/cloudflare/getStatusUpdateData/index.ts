import { DomainStatus, SslStatus } from "../../generated/prisma-client";
import {
  CloudflareHostnameStatus,
  CloudflareSslStatus,
  VerificationStatusResult,
  StatusUpdateData,
} from "../types";

/**
 * Gets database status update data based on Cloudflare status
 * Maps Cloudflare statuses to Prisma enum values
 *
 * @param hostnameStatus - Cloudflare hostname status
 * @param sslStatus - Cloudflare SSL status
 * @param verificationResult - Result from determineVerificationStatus
 * @returns Status update data for database
 *
 * @example
 * ```typescript
 * const statusData = getStatusUpdateData(
 *   "active",
 *   "active",
 *   verificationResult
 * );
 *
 * await prisma.domain.update({
 *   where: { id: domainId },
 *   data: statusData
 * });
 * ```
 */
export function getStatusUpdateData(
  hostnameStatus: CloudflareHostnameStatus,
  sslStatus: CloudflareSslStatus,
  verificationResult: VerificationStatusResult
): StatusUpdateData {
  return {
    status: verificationResult.shouldUpdateActive
      ? DomainStatus.ACTIVE
      : DomainStatus.VERIFIED,
    sslStatus: sslStatus === "active" ? SslStatus.ACTIVE : SslStatus.PENDING,
    lastVerifiedAt: new Date(),
  };
}
