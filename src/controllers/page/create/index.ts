import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createPage } from "../../../services/page/create";
import { UnauthorizedError, NotFoundError } from "../../../errors";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import { getPrisma } from "../../../lib/prisma";

export const createPageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const funnelId = parseInt(req.params.funnelId);
    if (isNaN(funnelId)) {
      throw new NotFoundError("Invalid funnel ID");
    }

    // Get the funnel's workspace ID for permission check
    const prisma = getPrisma();
    const funnel = await prisma.funnel.findUnique({
      where: { id: funnelId },
      select: { workspaceId: true },
    });

    if (!funnel) {
      throw new NotFoundError("Funnel not found");
    }

    // Check permissions using centralized PermissionManager
    await PermissionManager.requirePermission({
      userId,
      workspaceId: funnel.workspaceId,
      action: PermissionAction.CREATE_PAGE,
    });

    const requestData = {
      ...req.body,
      funnelId,
    };

    const result = await createPage(userId, requestData);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
