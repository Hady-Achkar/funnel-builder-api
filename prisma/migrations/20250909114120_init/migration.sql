-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."IntervalUnit" AS ENUM ('WEEK', 'MONTH', 'YEAR');

-- AlterEnum
ALTER TYPE "public"."UserPlan" ADD VALUE 'FREE';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "maximumAdmins" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "referralLinkUsedId" INTEGER,
ADD COLUMN     "trialEndDate" TIMESTAMP(3),
ADD COLUMN     "trialStartDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."affiliate_links" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "itemType" "public"."UserPlan" NOT NULL,
    "userId" INTEGER NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "settings" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" SERIAL NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "itemType" "public"."UserPlan" NOT NULL,
    "buyerId" INTEGER,
    "affiliateLinkId" INTEGER,
    "level1AffiliateAmount" DOUBLE PRECISION,
    "affiliatePaid" BOOLEAN NOT NULL DEFAULT false,
    "rawData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" SERIAL NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" INTEGER NOT NULL,
    "intervalUnit" "public"."IntervalUnit" NOT NULL,
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "rawData" JSONB DEFAULT '{}',
    "subscriptionType" "public"."UserPlan" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_links_token_key" ON "public"."affiliate_links"("token");

-- CreateIndex
CREATE INDEX "affiliate_links_token_idx" ON "public"."affiliate_links"("token");

-- CreateIndex
CREATE INDEX "affiliate_links_userId_idx" ON "public"."affiliate_links"("userId");

-- CreateIndex
CREATE INDEX "affiliate_links_itemType_idx" ON "public"."affiliate_links"("itemType");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "public"."payments"("transactionId");

-- CreateIndex
CREATE INDEX "payments_buyerId_idx" ON "public"."payments"("buyerId");

-- CreateIndex
CREATE INDEX "payments_affiliateLinkId_idx" ON "public"."payments"("affiliateLinkId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_transactionId_idx" ON "public"."payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_subscriptionId_key" ON "public"."subscriptions"("subscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "public"."subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "public"."subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_subscriptionId_idx" ON "public"."subscriptions"("subscriptionId");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_referralLinkUsedId_fkey" FOREIGN KEY ("referralLinkUsedId") REFERENCES "public"."affiliate_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."affiliate_links" ADD CONSTRAINT "affiliate_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_affiliateLinkId_fkey" FOREIGN KEY ("affiliateLinkId") REFERENCES "public"."affiliate_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
