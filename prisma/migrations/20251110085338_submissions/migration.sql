/*
  Warnings:

  - You are about to drop the column `maximumWorkspaces` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."subscriptions" ALTER COLUMN "itemType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "maximumWorkspaces";
