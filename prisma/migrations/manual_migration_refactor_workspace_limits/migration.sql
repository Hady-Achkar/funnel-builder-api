-- AlterTable
-- Add new column for maximum workspaces
ALTER TABLE "users" ADD COLUMN "maximumWorkspaces" INTEGER NOT NULL DEFAULT 1;

-- Update existing users based on their current plan limits
UPDATE "users"
SET "maximumWorkspaces" = CASE
    WHEN "maximumFunnels" <= 5 THEN 1
    WHEN "maximumFunnels" <= 10 THEN 3
    ELSE 10
END;

-- AlterTable
-- Drop columns from users table
ALTER TABLE "users"
DROP COLUMN "maximumFunnels",
DROP COLUMN "maximumCustomDomains",
DROP COLUMN "maximumSubdomains";

-- AlterTable
-- Drop columns from workspaces table
ALTER TABLE "workspaces"
DROP COLUMN "allocatedFunnels",
DROP COLUMN "allocatedCustomDomains",
DROP COLUMN "allocatedSubdomains";