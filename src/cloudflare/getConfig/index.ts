import { CloudflareConfig, CloudflareConfigSchema } from "../types";

/**
 * Validates Cloudflare configuration using Zod schema
 * This is a pure validation function with no environment variable access
 *
 * @param config - Configuration object to validate
 * @returns Validated Cloudflare configuration
 *
 * @example
 * ```typescript
 * const config = validateConfig({
 *   apiToken: "your-token",
 *   accountId: "your-account-id",
 *   zoneId: "your-zone-id"
 * });
 * ```
 */
export function validateConfig(
  config: Partial<CloudflareConfig>
): CloudflareConfig {
  return CloudflareConfigSchema.parse(config);
}
