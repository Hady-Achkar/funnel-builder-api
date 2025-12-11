-- AlterTable
ALTER TABLE "public"."workspaces" ADD COLUMN IF NOT EXISTS "isProtected" BOOLEAN NOT NULL DEFAULT false;
