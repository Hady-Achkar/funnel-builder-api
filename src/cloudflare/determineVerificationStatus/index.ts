import {
  CloudflareHostnameStatus,
  CloudflareSslStatus,
  VerificationStatusResult,
  SslValidationRecord,
} from "../types";

/**
 * Determines the verification status of a custom hostname based on Cloudflare status
 *
 * @param hostnameStatus - Cloudflare hostname status (e.g., "active", "pending")
 * @param sslStatus - Cloudflare SSL status (e.g., "active", "pending_validation")
 * @param validationRecords - SSL validation records from Cloudflare
 * @returns Verification status result with next steps
 *
 * @example
 * ```typescript
 * const status = determineVerificationStatus(
 *   "active",
 *   "pending_validation",
 *   [{ txt_name: "_acme-challenge", txt_value: "..." }]
 * );
 *
 * console.log(status.message); // "DNS verified! SSL certificate is being issued."
 * console.log(status.isFullyActive); // false
 * console.log(status.nextStep); // { txt_name: "...", txt_value: "..." }
 * ```
 */
export function determineVerificationStatus(
  hostnameStatus: CloudflareHostnameStatus,
  sslStatus: CloudflareSslStatus,
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
    } else if (
      typeof validationRecords === "object" &&
      !Array.isArray(validationRecords)
    ) {
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
