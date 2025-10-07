import {
  CreateFunnelRequest,
  CreateFunnelResponse,
} from "../../../types/funnel/create";
import { getPrisma } from "../../../lib/prisma";
import { generateFunnelSlug } from "./utils/generateFunnelSlug";
import { generateUniqueName } from "./utils/generateUniqueName";
import { createFunnelInTransaction } from "./utils/createFunnelInTransaction";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager";
import { WorkspaceFunnelAllocations } from "../../../utils/allocations/workspace-funnel-allocations";
import { WorkspaceValidator } from "../../../utils/workspace-utils/workspace-existence-validation";

export const createFunnel = async (
  userId: number,
  data: CreateFunnelRequest
): Promise<{ response: CreateFunnelResponse; workspaceId: number }> => {
  if (!userId) {
    throw new Error("Please log in to continue");
  }

  const prisma = getPrisma();

  // Validate workspace existence and get allocation data
  const workspace = await WorkspaceValidator.validateWithAllocation(
    prisma,
    data.workspaceSlug
  );

  // Check permission using centralized PermissionManager
  await PermissionManager.requirePermission({
    userId,
    workspaceId: workspace.id,
    action: PermissionAction.CREATE_FUNNEL,
  });

  // Check funnel allocation limit using centralized allocation system
  const currentFunnelCount = await prisma.funnel.count({
    where: { workspaceId: workspace.id },
  });

  const canCreateFunnel = WorkspaceFunnelAllocations.canCreateFunnel(
    currentFunnelCount,
    {
      workspacePlanType: workspace.owner.plan,
      addOns: workspace.owner.addOns,
    }
  );

  if (!canCreateFunnel) {
    const summary = WorkspaceFunnelAllocations.getAllocationSummary(
      currentFunnelCount,
      {
        workspacePlanType: workspace.owner.plan,
        addOns: workspace.owner.addOns,
      }
    );

    throw new Error(
      `You've reached the maximum of ${summary.totalAllocation} ${
        summary.totalAllocation === 1 ? "funnel" : "funnels"
      } for this workspace. ` +
        `To create more funnels, upgrade your plan or add extra funnel slots.`
    );
  }

  // Generate unique name (adds -1, -2, etc. if duplicate)
  const uniqueName = await generateUniqueName(data.name, workspace.id);

  const slug = await generateFunnelSlug(uniqueName, workspace.id, data.slug);

  const result = await createFunnelInTransaction(prisma, {
    name: uniqueName,
    slug,
    status: data.status,
    workspaceId: workspace.id,
    userId,
  });

  const response: CreateFunnelResponse = {
    message: "Funnel created successfully!",
    funnelId: result.funnel.id,
  };

  return { response, workspaceId: workspace.id };
};
