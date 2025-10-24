-- CreateEnum (only if not exists)
DO $$ BEGIN
    CREATE TYPE "SubscriptionItemType" AS ENUM ('PLAN', 'ADDON');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (only if not exists)
DO $$ BEGIN
    CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'ON_HOLD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (only if not exists)
DO $$ BEGIN
    CREATE TYPE "PayoutMethod" AS ENUM ('UAE_BANK', 'INTERNATIONAL_BANK', 'USDT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterEnum
BEGIN;
CREATE TYPE "AddOnType_new" AS ENUM ('EXTRA_ADMIN', 'EXTRA_FUNNEL', 'EXTRA_PAGE', 'EXTRA_SUBDOMAIN', 'EXTRA_CUSTOM_DOMAIN', 'EXTRA_WORKSPACE');
ALTER TABLE "payments" ALTER COLUMN "addOnType" TYPE "AddOnType_new" USING ("addOnType"::text::"AddOnType_new");
ALTER TABLE "addons" ALTER COLUMN "type" TYPE "AddOnType_new" USING ("type"::text::"AddOnType_new");
ALTER TYPE "AddOnType" RENAME TO "AddOnType_old";
ALTER TYPE "AddOnType_new" RENAME TO "AddOnType";
DROP TYPE "AddOnType_old";
COMMIT;

-- AlterEnum (add value if not exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WITHDRAWAL_REVERSAL' AND enumtypid = '"BalanceTransactionType"'::regtype) THEN
        ALTER TYPE "BalanceTransactionType" ADD VALUE 'WITHDRAWAL_REVERSAL';
    END IF;
END $$;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentType_new" AS ENUM ('PLAN_PURCHASE', 'ADDON_PURCHASE', 'ADDON_RENEWAL');
ALTER TABLE "payments" ALTER COLUMN "paymentType" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "paymentType" TYPE "PaymentType_new" USING ("paymentType"::text::"PaymentType_new");
ALTER TYPE "PaymentType" RENAME TO "PaymentType_old";
ALTER TYPE "PaymentType_new" RENAME TO "PaymentType";
DROP TYPE "PaymentType_old";
ALTER TABLE "payments" ALTER COLUMN "paymentType" SET DEFAULT 'PLAN_PURCHASE';
COMMIT;

-- AlterEnum (add values if not exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ARCHIVED' AND enumtypid = '"WorkspaceStatus"'::regtype) THEN
        ALTER TYPE "WorkspaceStatus" ADD VALUE 'ARCHIVED';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUSPENDED' AND enumtypid = '"WorkspaceStatus"'::regtype) THEN
        ALTER TYPE "WorkspaceStatus" ADD VALUE 'SUSPENDED';
    END IF;
END $$;

-- AlterTable (add column if not exists)
ALTER TABLE "addons" ADD COLUMN IF NOT EXISTS "expirationReminders" JSONB DEFAULT '{}';

-- AlterTable (add column if not exists)
ALTER TABLE "balance_transactions" ADD COLUMN IF NOT EXISTS "payoutId" INTEGER;

-- AlterTable (drop not null if exists)
DO $$ BEGIN
    ALTER TABLE "domains" ALTER COLUMN "workspaceId" DROP NOT NULL;
EXCEPTION
    WHEN others THEN null;
END $$;

-- AlterTable (add columns if not exist)
ALTER TABLE "subscriptions"
ADD COLUMN IF NOT EXISTS "addonType" "AddOnType",
ADD COLUMN IF NOT EXISTS "itemType" "SubscriptionItemType",
ADD COLUMN IF NOT EXISTS "subscriberId" TEXT;

-- Set default for itemType if it was just added
UPDATE "subscriptions" SET "itemType" = 'PLAN' WHERE "itemType" IS NULL;
ALTER TABLE "subscriptions" ALTER COLUMN "itemType" SET NOT NULL;
ALTER TABLE "subscriptions" ALTER COLUMN "itemType" SET DEFAULT 'PLAN';

-- Drop not null constraint on subscriptionType
ALTER TABLE "subscriptions" ALTER COLUMN "subscriptionType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN IF EXISTS "maximumWorkspaces";

-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "payouts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PayoutStatus" NOT NULL,
    "method" "PayoutMethod" NOT NULL,
    "accountHolderName" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "swiftCode" TEXT,
    "bankAddress" TEXT,
    "usdtWalletAddress" TEXT,
    "usdtNetwork" TEXT,
    "documentUrl" TEXT,
    "documentType" TEXT,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "transactionId" TEXT,
    "transactionProof" TEXT,
    "userNotes" TEXT,
    "adminNotes" TEXT,
    "adminHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "payouts_transactionId_key" ON "payouts"("transactionId");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "payouts_userId_idx" ON "payouts"("userId");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts"("status");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "payouts_method_idx" ON "payouts"("method");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "payouts_createdAt_idx" ON "payouts"("createdAt");

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "balance_transactions_payoutId_key" ON "balance_transactions"("payoutId");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "subscriptions_itemType_idx" ON "subscriptions"("itemType");

-- AddForeignKey (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'balance_transactions_payoutId_fkey'
    ) THEN
        ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payouts_userId_fkey'
    ) THEN
        ALTER TABLE "payouts" ADD CONSTRAINT "payouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;