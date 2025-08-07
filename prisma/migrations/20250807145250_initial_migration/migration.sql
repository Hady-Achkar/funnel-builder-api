-- CreateEnum
CREATE TYPE "public"."FunnelStatus" AS ENUM ('DRAFT', 'LIVE', 'ARCHIVED', 'SHARED');

-- CreateEnum
CREATE TYPE "public"."DomainType" AS ENUM ('CUSTOM_DOMAIN', 'SUBDOMAIN');

-- CreateEnum
CREATE TYPE "public"."DomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'ACTIVE', 'FAILED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."SslStatus" AS ENUM ('PENDING', 'ACTIVE', 'ERROR', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."BorderRadius" AS ENUM ('NONE', 'SOFT', 'ROUNDED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "passwordResetToken" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "maximumFunnels" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."funnels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."FunnelStatus" NOT NULL DEFAULT 'DRAFT',
    "userId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "themeId" INTEGER,

    CONSTRAINT "funnels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."domains" (
    "id" SERIAL NOT NULL,
    "hostname" TEXT NOT NULL,
    "type" "public"."DomainType" NOT NULL,
    "status" "public"."DomainStatus" NOT NULL DEFAULT 'PENDING',
    "sslStatus" "public"."SslStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "public"."funnel_domains" (
    "id" SERIAL NOT NULL,
    "funnelId" INTEGER NOT NULL,
    "domainId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL,
    "linkingId" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "funnelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "funnelId" INTEGER NOT NULL,
    "visitedPages" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "interactions" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."themes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Theme',
    "backgroundColor" TEXT NOT NULL DEFAULT '#0e1e12',
    "textColor" TEXT NOT NULL DEFAULT '#d4ecd0',
    "buttonColor" TEXT NOT NULL DEFAULT '#387e3d',
    "buttonTextColor" TEXT NOT NULL DEFAULT '#e8f5e9',
    "borderColor" TEXT NOT NULL DEFAULT '#214228',
    "optionColor" TEXT NOT NULL DEFAULT '#16331b',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter, sans-serif',
    "borderRadius" "public"."BorderRadius" NOT NULL DEFAULT 'SOFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."template_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "thumbnailImage" TEXT,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."template_images" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageType" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."template_pages" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL,
    "settings" JSONB,
    "linkingIdPrefix" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "public"."users"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "funnels_themeId_key" ON "public"."funnels"("themeId");

-- CreateIndex
CREATE INDEX "funnels_userId_idx" ON "public"."funnels"("userId");

-- CreateIndex
CREATE INDEX "funnels_status_idx" ON "public"."funnels"("status");

-- CreateIndex
CREATE INDEX "funnels_templateId_idx" ON "public"."funnels"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "domains_hostname_key" ON "public"."domains"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "domains_cloudflareHostnameId_key" ON "public"."domains"("cloudflareHostnameId");

-- CreateIndex
CREATE INDEX "domains_userId_idx" ON "public"."domains"("userId");

-- CreateIndex
CREATE INDEX "domains_status_idx" ON "public"."domains"("status");

-- CreateIndex
CREATE INDEX "domains_type_idx" ON "public"."domains"("type");

-- CreateIndex
CREATE INDEX "funnel_domains_funnelId_idx" ON "public"."funnel_domains"("funnelId");

-- CreateIndex
CREATE INDEX "funnel_domains_domainId_idx" ON "public"."funnel_domains"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_domains_funnelId_domainId_key" ON "public"."funnel_domains"("funnelId", "domainId");

-- CreateIndex
CREATE UNIQUE INDEX "pages_funnelId_linkingId_key" ON "public"."pages"("funnelId", "linkingId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionId_key" ON "public"."sessions"("sessionId");

-- CreateIndex
CREATE INDEX "sessions_sessionId_idx" ON "public"."sessions"("sessionId");

-- CreateIndex
CREATE INDEX "sessions_funnelId_idx" ON "public"."sessions"("funnelId");

-- CreateIndex
CREATE INDEX "sessions_createdAt_idx" ON "public"."sessions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "template_categories_name_key" ON "public"."template_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "template_categories_slug_key" ON "public"."template_categories"("slug");

-- CreateIndex
CREATE INDEX "template_categories_slug_idx" ON "public"."template_categories"("slug");

-- CreateIndex
CREATE INDEX "template_categories_isActive_idx" ON "public"."template_categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "templates_slug_key" ON "public"."templates"("slug");

-- CreateIndex
CREATE INDEX "templates_slug_idx" ON "public"."templates"("slug");

-- CreateIndex
CREATE INDEX "templates_categoryId_idx" ON "public"."templates"("categoryId");

-- CreateIndex
CREATE INDEX "templates_isActive_isPublic_idx" ON "public"."templates"("isActive", "isPublic");

-- CreateIndex
CREATE INDEX "templates_createdByUserId_idx" ON "public"."templates"("createdByUserId");

-- CreateIndex
CREATE INDEX "template_images_templateId_idx" ON "public"."template_images"("templateId");

-- CreateIndex
CREATE INDEX "template_pages_templateId_idx" ON "public"."template_pages"("templateId");

-- AddForeignKey
ALTER TABLE "public"."funnels" ADD CONSTRAINT "funnels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funnels" ADD CONSTRAINT "funnels_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funnels" ADD CONSTRAINT "funnels_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "public"."themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."domains" ADD CONSTRAINT "domains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funnel_domains" ADD CONSTRAINT "funnel_domains_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "public"."domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funnel_domains" ADD CONSTRAINT "funnel_domains_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "public"."funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pages" ADD CONSTRAINT "pages_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "public"."funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."templates" ADD CONSTRAINT "templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."template_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."templates" ADD CONSTRAINT "templates_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."template_images" ADD CONSTRAINT "template_images_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."template_pages" ADD CONSTRAINT "template_pages_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
