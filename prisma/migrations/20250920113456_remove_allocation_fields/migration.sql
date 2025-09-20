/*
  Warnings:

  - You are about to drop the column `maximumAdmins` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maximumCustomDomains` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maximumFunnels` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maximumSubdomains` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `allocatedCustomDomains` on the `workspaces` table. All the data in the column will be lost.
  - You are about to drop the column `allocatedFunnels` on the `workspaces` table. All the data in the column will be lost.
  - You are about to drop the column `allocatedSubdomains` on the `workspaces` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "maximumAdmins",
DROP COLUMN "maximumCustomDomains",
DROP COLUMN "maximumFunnels",
DROP COLUMN "maximumSubdomains";

-- AlterTable
ALTER TABLE "public"."workspaces" DROP COLUMN "allocatedCustomDomains",
DROP COLUMN "allocatedFunnels",
DROP COLUMN "allocatedSubdomains";
