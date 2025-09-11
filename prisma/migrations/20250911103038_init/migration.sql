-- DropForeignKey
ALTER TABLE "public"."funnels" DROP CONSTRAINT "funnels_themeId_fkey";

-- AddForeignKey
ALTER TABLE "public"."funnels" ADD CONSTRAINT "funnels_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "public"."themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
