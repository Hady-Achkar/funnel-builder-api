-- AlterTable
ALTER TABLE "template_pages" RENAME COLUMN "linkingIdPrefix" TO "linkingId";
ALTER TABLE "template_pages" DROP COLUMN IF EXISTS "metadata";
ALTER TABLE "template_pages" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "template_pages" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
ALTER TABLE "template_pages" ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "template_pages_linkingId_key" ON "template_pages"("linkingId");
