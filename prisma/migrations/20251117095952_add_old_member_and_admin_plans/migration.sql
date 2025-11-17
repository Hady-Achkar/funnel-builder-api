-- AlterEnum
-- Add OLD_MEMBER and ADMIN values to the UserPlan enum
ALTER TYPE "UserPlan" ADD VALUE 'OLD_MEMBER';
ALTER TYPE "UserPlan" ADD VALUE 'ADMIN';
