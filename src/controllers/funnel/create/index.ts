import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createFunnelRequest } from "../../../types/funnel/create";
import { checkUserCanCreateFunnel } from "./utils/checkUserPermissions";
import { isFunnelNameAvailable } from "./utils/validateFunnelName";
import { canWorkspaceCreateFunnel } from "./utils/checkWorkspaceLimit";
import { createFunnel } from "../../../services/funnel/create";
import { cacheService } from "../../../services/cache/cache.service";
import z from "zod";

export const createFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ error: "Please log in to create a funnel" });
    }
    const validatedData = createFunnelRequest.parse(req.body);

    // Generate slug if not provided
    if (!validatedData.slug) {
      validatedData.slug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    const canCreate = await checkUserCanCreateFunnel(
      userId,
      validatedData.workspaceSlug
    );
    if (!canCreate) {
      return res.status(403).json({
        error: "You don't have permission to create funnels in this workspace",
      });
    }

    const canCreateFunnel = await canWorkspaceCreateFunnel(
      validatedData.workspaceSlug
    );
    if (!canCreateFunnel) {
      return res.status(400).json({
        error: "Workspace has reached its maximum funnel limit",
      });
    }

    const isValidName = await isFunnelNameAvailable(
      validatedData.name,
      validatedData.workspaceSlug
    );
    if (!isValidName) {
      return res.status(400).json({
        error: "Invalid funnel name or name already exists in this workspace",
      });
    }

    const funnel = await createFunnel(userId, validatedData);

    // Invalidate workspace funnels cache
    try {
      const cacheKey = `workspace:${funnel.workspaceId}:funnels:all`;
      await cacheService.del(cacheKey);
    } catch (cacheError) {
      console.error("Cache invalidation failed in funnel create controller:", cacheError);
    }

    return res.status(201).json({
      message: "Funnel created successfully",
      funnelId: funnel.id,
      funnelSlug: funnel.slug,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      const field = firstIssue.path.join(".");
      return res.status(400).json({
        error: `${field} ${firstIssue.message}`,
      });
    }

    next(error);
  }
};
