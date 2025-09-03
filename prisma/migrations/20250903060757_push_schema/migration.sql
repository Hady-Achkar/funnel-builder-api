/*
  Warnings:

  - You are about to drop the column `userId` on the `domains` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `funnels` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `funnels` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `template_categories` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `template_categories` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `template_categories` table. All the data in the column will be lost.
  - The `imageType` column on the `template_images` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `metadata` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailImage` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workspaceId,name]` on the table `funnels` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,slug]` on the table `funnels` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,name]` on the table `image_folders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verificationToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `domains` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `domains` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `funnels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `funnels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `funnels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `image_folders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `maximumFunnels` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."UserPlan" AS ENUM ('BUSINESS', 'AGENCY');

-- CreateEnum
CREATE TYPE "public"."WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."WorkspacePermission" AS ENUM ('MANAGE_WORKSPACE', 'MANAGE_MEMBERS', 'CREATE_FUNNELS', 'EDIT_FUNNELS', 'EDIT_PAGES', 'DELETE_FUNNELS', 'VIEW_ANALYTICS', 'MANAGE_DOMAINS', 'CREATE_DOMAINS', 'DELETE_DOMAINS', 'CONNECT_DOMAINS');

-- CreateEnum
CREATE TYPE "public"."PageType" AS ENUM ('PAGE', 'RESULT');

-- CreateEnum
CREATE TYPE "public"."InsightType" AS ENUM ('QUIZ', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE');

-- CreateEnum
CREATE TYPE "public"."TemplateImageType" AS ENUM ('THUMBNAIL', 'PREVIEW');

-- DropForeignKey
ALTER TABLE "public"."domains" DROP CONSTRAINT "domains_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."funnels" DROP CONSTRAINT "funnels_templateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."funnels" DROP CONSTRAINT "funnels_userId_fkey";

-- DropIndex
DROP INDEX "public"."domains_userId_idx";

-- DropIndex
DROP INDEX "public"."funnels_templateId_idx";

-- DropIndex
DROP INDEX "public"."funnels_userId_idx";

-- DropIndex
DROP INDEX "public"."template_categories_isActive_idx";

-- AlterTable
ALTER TABLE "public"."domains" DROP COLUMN "userId",
ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "workspaceId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."funnels" DROP COLUMN "templateId",
DROP COLUMN "userId",
ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "workspaceId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."image_folders" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."pages" ADD COLUMN     "type" "public"."PageType" NOT NULL DEFAULT 'PAGE';

-- AlterTable
ALTER TABLE "public"."template_categories" DROP COLUMN "icon",
DROP COLUMN "isActive",
DROP COLUMN "order";

-- AlterTable
ALTER TABLE "public"."template_images" DROP COLUMN "imageType",
ADD COLUMN     "imageType" "public"."TemplateImageType" NOT NULL DEFAULT 'PREVIEW';

-- AlterTable
ALTER TABLE "public"."template_pages" ADD COLUMN     "type" "public"."PageType" NOT NULL DEFAULT 'PAGE';

-- AlterTable
ALTER TABLE "public"."templates" DROP COLUMN "metadata",
DROP COLUMN "thumbnailImage";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "name",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "maximumCustomDomains" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "maximumSubdomains" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "plan" "public"."UserPlan" NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "maximumFunnels" SET NOT NULL,
ALTER COLUMN "maximumFunnels" SET DEFAULT 5;

-- CreateTable
CREATE TABLE "public"."workspaces" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "description" TEXT,
    "settings" JSONB DEFAULT '{}',
    "allocatedFunnels" INTEGER NOT NULL DEFAULT 0,
    "allocatedCustomDomains" INTEGER NOT NULL DEFAULT 0,
    "allocatedSubdomains" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_members" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "role" "public"."WorkspaceRole" NOT NULL,
    "permissions" "public"."WorkspacePermission"[],
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."insights" (
    "id" SERIAL NOT NULL,
    "type" "public"."InsightType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "settings" JSONB DEFAULT '{}',
    "funnelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."insight_submissions" (
    "id" SERIAL NOT NULL,
    "insightId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "answers" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insight_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formContent" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "funnelId" INTEGER,
    "webhookUrl" TEXT,
    "webhookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "webhookHeaders" JSONB DEFAULT '{}',
    "webhookSecret" TEXT,
    "webhookSuccessCount" INTEGER NOT NULL DEFAULT 0,
    "webhookFailureCount" INTEGER NOT NULL DEFAULT 0,
    "lastWebhookAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_submissions" (
    "id" SERIAL NOT NULL,
    "formId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "submittedData" JSONB,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."funnel_settings" (
    "id" SERIAL NOT NULL,
    "funnelId" INTEGER NOT NULL,
    "defaultSeoTitle" TEXT,
    "defaultSeoDescription" TEXT,
    "defaultSeoKeywords" TEXT,
    "favicon" TEXT,
    "ogImage" TEXT,
    "googleAnalyticsId" TEXT,
    "facebookPixelId" TEXT,
    "customTrackingScripts" JSONB DEFAULT '[]',
    "enableCookieConsent" BOOLEAN NOT NULL DEFAULT false,
    "cookieConsentText" TEXT,
    "privacyPolicyUrl" TEXT,
    "termsOfServiceUrl" TEXT,
    "language" TEXT DEFAULT 'en',
    "timezone" TEXT DEFAULT 'UTC',
    "dateFormat" TEXT DEFAULT 'DD.MM.YYYY',
    "isPasswordProtected" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "public"."workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspace_members_workspaceId_idx" ON "public"."workspace_members"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_members_userId_idx" ON "public"."workspace_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_userId_workspaceId_key" ON "public"."workspace_members"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX "insights_funnelId_idx" ON "public"."insights"("funnelId");

-- CreateIndex
CREATE INDEX "insights_type_idx" ON "public"."insights"("type");

-- CreateIndex
CREATE INDEX "insight_submissions_sessionId_idx" ON "public"."insight_submissions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "insight_submissions_insightId_sessionId_key" ON "public"."insight_submissions"("insightId", "sessionId");

-- CreateIndex
CREATE INDEX "forms_isActive_idx" ON "public"."forms"("isActive");

-- CreateIndex
CREATE INDEX "forms_funnelId_idx" ON "public"."forms"("funnelId");

-- CreateIndex
CREATE INDEX "forms_webhookEnabled_idx" ON "public"."forms"("webhookEnabled");

-- CreateIndex
CREATE INDEX "form_submissions_sessionId_idx" ON "public"."form_submissions"("sessionId");

-- CreateIndex
CREATE INDEX "form_submissions_isCompleted_idx" ON "public"."form_submissions"("isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "form_submissions_formId_sessionId_key" ON "public"."form_submissions"("formId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_settings_funnelId_key" ON "public"."funnel_settings"("funnelId");

-- CreateIndex
CREATE INDEX "funnel_settings_funnelId_idx" ON "public"."funnel_settings"("funnelId");

-- CreateIndex
CREATE INDEX "domains_workspaceId_idx" ON "public"."domains"("workspaceId");

-- CreateIndex
CREATE INDEX "domains_createdBy_idx" ON "public"."domains"("createdBy");

-- CreateIndex
CREATE INDEX "funnels_workspaceId_idx" ON "public"."funnels"("workspaceId");

-- CreateIndex
CREATE INDEX "funnels_createdBy_idx" ON "public"."funnels"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "funnels_workspaceId_name_key" ON "public"."funnels"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "funnels_workspaceId_slug_key" ON "public"."funnels"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "image_folders_userId_idx" ON "public"."image_folders"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "image_folders_userId_name_key" ON "public"."image_folders"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_verificationToken_key" ON "public"."users"("verificationToken");

-- AddForeignKey
ALTER TABLE "public"."workspaces" ADD CONSTRAINT "workspaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funnels" ADD CONSTRAINT "funnels_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funnels" ADD CONSTRAINT "funnels_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."domains" ADD CONSTRAINT "domains_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."domains" ADD CONSTRAINT "domains_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."insights" ADD CONSTRAINT "insights_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "public"."funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."insight_submissions" ADD CONSTRAINT "insight_submissions_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "public"."insights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."insight_submissions" ADD CONSTRAINT "insight_submissions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."image_folders" ADD CONSTRAINT "image_folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_submissions" ADD CONSTRAINT "form_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "public"."forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_submissions" ADD CONSTRAINT "form_submissions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funnel_settings" ADD CONSTRAINT "funnel_settings_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "public"."funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
