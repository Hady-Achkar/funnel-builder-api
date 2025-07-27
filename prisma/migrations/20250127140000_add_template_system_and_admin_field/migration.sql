-- AlterTable
ALTER TABLE "users" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "template_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "thumbnailImage" TEXT,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_images" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageType" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_pages" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL,
    "settings" JSONB,
    "linkingIdPrefix" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_pages_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "funnels" ADD COLUMN "templateId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "template_categories_name_key" ON "template_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "template_categories_slug_key" ON "template_categories"("slug");

-- CreateIndex
CREATE INDEX "template_categories_slug_idx" ON "template_categories"("slug");

-- CreateIndex
CREATE INDEX "template_categories_isActive_idx" ON "template_categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "templates_slug_key" ON "templates"("slug");

-- CreateIndex
CREATE INDEX "templates_slug_idx" ON "templates"("slug");

-- CreateIndex
CREATE INDEX "templates_categoryId_idx" ON "templates"("categoryId");

-- CreateIndex
CREATE INDEX "templates_isActive_isPublic_idx" ON "templates"("isActive", "isPublic");

-- CreateIndex
CREATE INDEX "templates_createdByUserId_idx" ON "templates"("createdByUserId");

-- CreateIndex
CREATE INDEX "template_images_templateId_idx" ON "template_images"("templateId");

-- CreateIndex
CREATE INDEX "template_pages_templateId_idx" ON "template_pages"("templateId");

-- CreateIndex
CREATE INDEX "funnels_templateId_idx" ON "funnels"("templateId");

-- AddForeignKey
ALTER TABLE "funnels" ADD CONSTRAINT "funnels_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "template_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_images" ADD CONSTRAINT "template_images_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_pages" ADD CONSTRAINT "template_pages_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;