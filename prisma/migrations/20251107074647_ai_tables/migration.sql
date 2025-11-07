/*
  Warnings:

  - You are about to drop the column `maximumWorkspaces` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ai_generation_logs" ALTER COLUMN "model" SET DEFAULT 'claude-3-5-sonnet-20240620';

-- AlterTable
ALTER TABLE "public"."subscriptions" ALTER COLUMN "itemType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "maximumWorkspaces";
