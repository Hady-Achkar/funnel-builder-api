import {
  CreateFormRequest,
  CreateFormResponse,
  createFormResponse,
} from "../../../types/form/create";
import { getPrisma } from "../../../lib/prisma";
import {
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";

export const createForm = async (
  userId: number,
  workspaceSlug: string,
  funnelSlug: string,
  data: CreateFormRequest
): Promise<CreateFormResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const prisma = getPrisma();

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Find funnel using slugs
    const funnel = await prisma.funnel.findFirst({
      where: {
        slug: funnelSlug,
        workspace: {
          slug: workspaceSlug,
        },
      },
      select: { id: true, workspaceId: true },
    });

    if (!funnel) {
      throw new NotFoundError(
        "Funnel not found in the specified workspace"
      );
    }

    // Check permissions
    await PermissionManager.requirePermission({
      userId,
      workspaceId: funnel.workspaceId,
      action: PermissionAction.EDIT_FUNNEL,
    });

    // Create form linked to funnel
    const form = await prisma.form.create({
      data: {
        name: data.name,
        description: data.description,
        formContent: data.formContent,
        isActive: data.isActive ?? true,
        funnelId: funnel.id,
        webhookUrl: data.webhookUrl,
        webhookEnabled: data.webhookEnabled ?? false,
        webhookHeaders: data.webhookHeaders || {},
        webhookSecret: data.webhookSecret,
      },
      include: {
        submissions: {
          take: 0,
        },
      },
    });

    const response = {
      message: "Form created successfully",
      formId: form.id,
    };

    return createFormResponse.parse(response);
  } catch (error) {
    throw error;
  }
};
