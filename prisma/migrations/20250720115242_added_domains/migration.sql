-- CreateEnum
CREATE TYPE "DomainType" AS ENUM ('CUSTOM_DOMAIN', 'SUBDOMAIN');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'ACTIVE', 'FAILED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SslStatus" AS ENUM ('PENDING', 'ACTIVE', 'ERROR', 'EXPIRED');

-- CreateTable
CREATE TABLE "domains" (
    "id" SERIAL NOT NULL,
    "hostname" TEXT NOT NULL,
    "type" "DomainType" NOT NULL,
    "status" "DomainStatus" NOT NULL DEFAULT 'PENDING',
    "sslStatus" "SslStatus" NOT NULL DEFAULT 'PENDING',
    "userId" INTEGER NOT NULL,
    "cloudflareHostnameId" TEXT,
    "cloudflareZoneId" TEXT,
    "cloudflareRecordId" TEXT,
    "verificationToken" TEXT,
    "ownershipVerification" JSONB,
    "dnsInstructions" JSONB,
    "sslCertificateId" TEXT,
    "sslValidationRecords" JSONB,
    "lastVerifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_domains" (
    "id" SERIAL NOT NULL,
    "funnelId" INTEGER NOT NULL,
    "domainId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_domains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domains_hostname_key" ON "domains"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "domains_cloudflareHostnameId_key" ON "domains"("cloudflareHostnameId");

-- CreateIndex
CREATE INDEX "domains_userId_idx" ON "domains"("userId");

-- CreateIndex
CREATE INDEX "domains_status_idx" ON "domains"("status");

-- CreateIndex
CREATE INDEX "domains_type_idx" ON "domains"("type");

-- CreateIndex
CREATE INDEX "funnel_domains_funnelId_idx" ON "funnel_domains"("funnelId");

-- CreateIndex
CREATE INDEX "funnel_domains_domainId_idx" ON "funnel_domains"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_domains_funnelId_domainId_key" ON "funnel_domains"("funnelId", "domainId");

-- CreateIndex
CREATE INDEX "funnels_userId_idx" ON "funnels"("userId");

-- CreateIndex
CREATE INDEX "funnels_status_idx" ON "funnels"("status");

-- AddForeignKey
ALTER TABLE "domains" ADD CONSTRAINT "domains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_domains" ADD CONSTRAINT "funnel_domains_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_domains" ADD CONSTRAINT "funnel_domains_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
