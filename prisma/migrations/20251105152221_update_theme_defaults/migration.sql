-- AlterTable: Update default values for Theme color fields
-- Note: This only affects NEW records. Existing records will keep their current values.

ALTER TABLE "themes" ALTER COLUMN "backgroundColor" SET DEFAULT '#FFFFFF';
ALTER TABLE "themes" ALTER COLUMN "textColor" SET DEFAULT '#0d1911';
ALTER TABLE "themes" ALTER COLUMN "buttonColor" SET DEFAULT '#3c724b';
ALTER TABLE "themes" ALTER COLUMN "buttonTextColor" SET DEFAULT '#FFFFFF';
ALTER TABLE "themes" ALTER COLUMN "borderColor" SET DEFAULT '#f0f0f0';
ALTER TABLE "themes" ALTER COLUMN "optionColor" SET DEFAULT '#EFFFF3';
