-- Revert from Azure Front Door back to Cloudflare
-- This migration reverts the changes made in 20251027000000_switch_to_azure_frontdoor

-- Remove Azure fields
ALTER TABLE "domains" DROP COLUMN IF EXISTS "azureCustomDomainName";
ALTER TABLE "domains" DROP COLUMN IF EXISTS "azureDomainStatus";
ALTER TABLE "domains" DROP COLUMN IF EXISTS "azureCertStatus";

-- Add back Cloudflare fields
ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "cloudflareHostnameId" TEXT;
ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "cloudflareZoneId" TEXT;
ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "cloudflareRecordId" TEXT;
ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "sslCertificateId" TEXT;
ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "sslValidationRecords" JSONB;

-- Add unique constraint for cloudflareHostnameId
CREATE UNIQUE INDEX IF NOT EXISTS "domains_cloudflareHostnameId_key" ON "domains"("cloudflareHostnameId");
