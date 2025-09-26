-- CreateEnum
CREATE TYPE "public"."MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."workspace_members" ADD COLUMN     "email" TEXT,
ADD COLUMN     "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "invitedBy" INTEGER,
ADD COLUMN     "status" "public"."MembershipStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "joinedAt" DROP NOT NULL,
ALTER COLUMN "joinedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "workspace_members_email_idx" ON "public"."workspace_members"("email");

-- CreateIndex
CREATE INDEX "workspace_members_status_idx" ON "public"."workspace_members"("status");

-- AddForeignKey
ALTER TABLE "public"."workspace_members" ADD CONSTRAINT "workspace_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
