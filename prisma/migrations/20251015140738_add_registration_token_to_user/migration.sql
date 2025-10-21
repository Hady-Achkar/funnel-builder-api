/*
  Warnings:

  - You are about to drop the column `themeId` on the `funnels` table. All the data in the column will be lost.
  - You are about to drop the column `maximumAdmins` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maximumWorkspaces` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[funnelId]` on the table `themes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workspaceId` to the `affiliate_links` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('PLAN_PURCHASE', 'ADDON_PURCHASE', 'ADDON_RENEWAL', 'WORKSPACE_PURCHASE');

-- CreateEnum
CREATE TYPE "public"."WorkspaceStatus" AS ENUM ('ACTIVE', 'DRAFT');

-- CreateEnum
CREATE TYPE "public"."ThemeType" AS ENUM ('GLOBAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."AddOnType" AS ENUM ('EXTRA_ADMIN', 'EXTRA_FUNNEL', 'EXTRA_PAGE', 'EXTRA_DOMAIN', 'EXTRA_WORKSPACE');

-- CreateEnum
CREATE TYPE "public"."AddOnStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."BalanceTransactionType" AS ENUM ('COMMISSION', 'WITHDRAWAL', 'ADJUSTMENT', 'REFUND', 'COMMISSION_HOLD', 'COMMISSION_RELEASE', 'COMMISSION_REVERSED');

-- CreateEnum
CREATE TYPE "public"."CommissionStatus" AS ENUM ('PENDING', 'RELEASED', 'REVERSED');

-- DropForeignKey
ALTER TABLE "public"."funnels" DROP CONSTRAINT "funnels_themeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subscriptions" DROP CONSTRAINT "subscriptions_userId_fkey";

-- DropIndex
DROP INDEX "public"."funnels_themeId_key";

-- AlterTable
ALTER TABLE "public"."affiliate_links" ADD COLUMN     "workspaceId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."funnels" DROP COLUMN "themeId",
ADD COLUMN     "activeThemeId" INTEGER;

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "addOnId" INTEGER,
ADD COLUMN     "addOnQuantity" INTEGER,
ADD COLUMN     "addOnType" "public"."AddOnType",
ADD COLUMN     "commissionAmount" DOUBLE PRECISION,
ADD COLUMN     "commissionHeldUntil" TIMESTAMP(3),
ADD COLUMN     "commissionReleasedAt" TIMESTAMP(3),
ADD COLUMN     "commissionStatus" "public"."CommissionStatus",
ADD COLUMN     "paymentType" "public"."PaymentType" NOT NULL DEFAULT 'PLAN_PURCHASE',
ADD COLUMN     "workspaceId" INTEGER,
ALTER COLUMN "itemType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."subscriptions" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."themes" ADD COLUMN     "funnelId" INTEGER,
ADD COLUMN     "type" "public"."ThemeType" NOT NULL DEFAULT 'CUSTOM';

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "maximumAdmins",
DROP COLUMN IF EXISTS "maximumWorkspaces",
ADD COLUMN IF NOT EXISTS "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "registrationToken" TEXT;

-- Update plan default if column exists
DO $$
BEGIN
    ALTER TABLE "public"."users" ALTER COLUMN "plan" SET DEFAULT 'NO_PLAN';
EXCEPTION
    WHEN undefined_column THEN
        NULL; -- Column doesn't exist, ignore
END $$;

-- AlterTable
ALTER TABLE "public"."workspace_members" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."workspaces" ADD COLUMN     "planType" "public"."UserPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "status" "public"."WorkspaceStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "public"."addons" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "workspaceId" INTEGER,
    "type" "public"."AddOnType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "status" "public"."AddOnStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "public"."IntervalUnit" NOT NULL DEFAULT 'MONTH',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."balance_transactions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "public"."BalanceTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "notes" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_clones" (
    "id" SERIAL NOT NULL,
    "sourceWorkspaceId" INTEGER NOT NULL,
    "clonedWorkspaceId" INTEGER NOT NULL,
    "sellerId" INTEGER,
    "buyerId" INTEGER,
    "paymentId" INTEGER NOT NULL,
    "clonedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_clones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "addons_userId_idx" ON "public"."addons"("userId");

-- CreateIndex
CREATE INDEX "addons_workspaceId_idx" ON "public"."addons"("workspaceId");

-- CreateIndex
CREATE INDEX "addons_status_idx" ON "public"."addons"("status");

-- CreateIndex
CREATE INDEX "balance_transactions_userId_idx" ON "public"."balance_transactions"("userId");

-- CreateIndex
CREATE INDEX "balance_transactions_referenceType_referenceId_idx" ON "public"."balance_transactions"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "balance_transactions_createdAt_idx" ON "public"."balance_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_clones_clonedWorkspaceId_key" ON "public"."workspace_clones"("clonedWorkspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_clones_paymentId_key" ON "public"."workspace_clones"("paymentId");

-- CreateIndex
CREATE INDEX "workspace_clones_sourceWorkspaceId_idx" ON "public"."workspace_clones"("sourceWorkspaceId");

-- CreateIndex
CREATE INDEX "workspace_clones_clonedWorkspaceId_idx" ON "public"."workspace_clones"("clonedWorkspaceId");

-- CreateIndex
CREATE INDEX "workspace_clones_sellerId_idx" ON "public"."workspace_clones"("sellerId");

-- CreateIndex
CREATE INDEX "workspace_clones_buyerId_idx" ON "public"."workspace_clones"("buyerId");

-- CreateIndex
CREATE INDEX "workspace_clones_paymentId_idx" ON "public"."workspace_clones"("paymentId");

-- CreateIndex
CREATE INDEX "affiliate_links_workspaceId_idx" ON "public"."affiliate_links"("workspaceId");

-- CreateIndex
CREATE INDEX "funnels_activeThemeId_idx" ON "public"."funnels"("activeThemeId");

-- CreateIndex
CREATE INDEX "payments_workspaceId_idx" ON "public"."payments"("workspaceId");

-- CreateIndex
CREATE INDEX "payments_commissionStatus_idx" ON "public"."payments"("commissionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "themes_funnelId_key" ON "public"."themes"("funnelId");

-- CreateIndex
CREATE INDEX "themes_funnelId_idx" ON "public"."themes"("funnelId");

-- CreateIndex
CREATE INDEX "themes_type_idx" ON "public"."themes"("type");

-- AddForeignKey
ALTER TABLE "public"."affiliate_links" ADD CONSTRAINT "affiliate_links_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "public"."addons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funnels" ADD CONSTRAINT "funnels_activeThemeId_fkey" FOREIGN KEY ("activeThemeId") REFERENCES "public"."themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."themes" ADD CONSTRAINT "themes_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "public"."funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."addons" ADD CONSTRAINT "addons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."addons" ADD CONSTRAINT "addons_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."balance_transactions" ADD CONSTRAINT "balance_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_clones" ADD CONSTRAINT "workspace_clones_sourceWorkspaceId_fkey" FOREIGN KEY ("sourceWorkspaceId") REFERENCES "public"."workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_clones" ADD CONSTRAINT "workspace_clones_clonedWorkspaceId_fkey" FOREIGN KEY ("clonedWorkspaceId") REFERENCES "public"."workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_clones" ADD CONSTRAINT "workspace_clones_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_clones" ADD CONSTRAINT "workspace_clones_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_clones" ADD CONSTRAINT "workspace_clones_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
