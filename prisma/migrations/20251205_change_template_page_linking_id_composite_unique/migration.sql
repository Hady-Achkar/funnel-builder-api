-- DropIndex
DROP INDEX IF EXISTS "template_pages_linkingId_key";

-- CreateIndex
CREATE UNIQUE INDEX "template_pages_templateId_linkingId_key" ON "template_pages"("templateId", "linkingId");
