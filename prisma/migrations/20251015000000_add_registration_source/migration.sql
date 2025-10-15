-- CreateEnum
CREATE TYPE "RegistrationSource" AS ENUM ('DIRECT', 'WORKSPACE_INVITE', 'AFFILIATE');

-- AlterEnum - Add NO_PLAN to UserPlan enum (must be in separate transaction)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'NO_PLAN' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserPlan')) THEN
        ALTER TYPE "UserPlan" ADD VALUE 'NO_PLAN';
    END IF;
END$$;

-- AlterEnum - Add WORKSPACE_MEMBER to UserPlan enum (must be in separate transaction)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WORKSPACE_MEMBER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserPlan')) THEN
        ALTER TYPE "UserPlan" ADD VALUE 'WORKSPACE_MEMBER';
    END IF;
END$$;

-- AlterTable - Add registrationSource column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "registrationSource" "RegistrationSource" DEFAULT 'DIRECT';

-- Update existing users to have DIRECT registration source
UPDATE "users" SET "registrationSource" = 'DIRECT' WHERE "registrationSource" IS NULL;

