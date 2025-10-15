-- CreateEnum
CREATE TYPE "RegistrationSource" AS ENUM ('DIRECT', 'WORKSPACE_INVITE', 'AFFILIATE');

-- AlterEnum
-- Add NO_PLAN and WORKSPACE_MEMBER to UserPlan enum
ALTER TYPE "UserPlan" ADD VALUE IF NOT EXISTS 'NO_PLAN';
ALTER TYPE "UserPlan" ADD VALUE IF NOT EXISTS 'WORKSPACE_MEMBER';

-- AlterTable
-- Add registrationSource column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "registrationSource" "RegistrationSource" DEFAULT 'DIRECT';

-- Update existing users to have DIRECT registration source
UPDATE "users" SET "registrationSource" = 'DIRECT' WHERE "registrationSource" IS NULL;

-- Update default plan for new users (this won't affect existing users)
ALTER TABLE "users" ALTER COLUMN "plan" SET DEFAULT 'NO_PLAN';

-- Optional: Update existing FREE plan users if needed
-- Uncomment the line below if you want to migrate existing FREE users to NO_PLAN
-- UPDATE "users" SET "plan" = 'NO_PLAN' WHERE "plan" = 'FREE';
