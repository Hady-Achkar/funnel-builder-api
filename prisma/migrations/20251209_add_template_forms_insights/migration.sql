-- Add templateId to forms table
ALTER TABLE "forms" ADD COLUMN "templateId" INTEGER;
CREATE INDEX "forms_templateId_idx" ON "forms"("templateId");
ALTER TABLE "forms" ADD CONSTRAINT "forms_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Make funnelId optional on insights (it was required before)
ALTER TABLE "insights" ALTER COLUMN "funnelId" DROP NOT NULL;

-- Add templateId to insights table
ALTER TABLE "insights" ADD COLUMN "templateId" INTEGER;
CREATE INDEX "insights_templateId_idx" ON "insights"("templateId");
ALTER TABLE "insights" ADD CONSTRAINT "insights_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
