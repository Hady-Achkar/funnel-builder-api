-- CreateTable
CREATE TABLE "public"."workspace_role_perm_templates" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "role" "public"."WorkspaceRole" NOT NULL,
    "permissions" "public"."WorkspacePermission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_role_perm_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspace_role_perm_templates_workspaceId_idx" ON "public"."workspace_role_perm_templates"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_role_perm_templates_workspaceId_role_key" ON "public"."workspace_role_perm_templates"("workspaceId", "role");

-- AddForeignKey
ALTER TABLE "public"."workspace_role_perm_templates" ADD CONSTRAINT "workspace_role_perm_templates_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
