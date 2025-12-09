-- AlterTable
ALTER TABLE "themes" ADD COLUMN "templateId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "themes_templateId_key" ON "themes"("templateId");

-- CreateIndex
CREATE INDEX "themes_templateId_idx" ON "themes"("templateId");

-- AddForeignKey
ALTER TABLE "themes" ADD CONSTRAINT "themes_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
