-- Switch from Cloudflare to Azure Front Door for custom domains
-- This migration removes Cloudflare fields and adds Azure Front Door fields

-- Remove Cloudflare-specific columns
ALTER TABLE "domains" DROP COLUMN IF EXISTS "cloudflareHostnameId";
ALTER TABLE "domains" DROP COLUMN IF EXISTS "cloudflareZoneId";
ALTER TABLE "domains" DROP COLUMN IF EXISTS "cloudflareRecordId";
ALTER TABLE "domains" DROP COLUMN IF EXISTS "sslCertificateId";
ALTER TABLE "domains" DROP COLUMN IF EXISTS "sslValidationRecords";

-- Add Azure Front Door columns
ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "azureCustomDomainName" TEXT;
ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "azureDomainStatus" TEXT;
ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "azureCertStatus" TEXT;

-- Add unique constraint for azureCustomDomainName
CREATE UNIQUE INDEX IF NOT EXISTS "domains_azureCustomDomainName_key" ON "domains"("azureCustomDomainName");

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "domains_azureCustomDomainName_idx" ON "domains"("azureCustomDomainName");
