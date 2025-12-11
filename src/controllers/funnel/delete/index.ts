import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { deleteFunnel } from "../../../services/funnel/delete";
import { UnauthorizedError } from "../../../errors/http-errors";
import { cacheService } from "../../../services/cache/cache.service";

export const deleteFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to delete the funnel");
    }

    const workspaceSlug = req.params.workspaceSlug;
    const funnelSlug = req.params.funnelSlug;

    const result = await deleteFunnel(userId, {
      workspaceSlug,
      funnelSlug,
    });

    // Invalidate workspace cache after successful deletion
    try {
      const workspaceCacheKey = `workspace:${workspaceSlug}:user:${userId}`;
      await cacheService.del(workspaceCacheKey);
    } catch (cacheError) {
      console.error("Failed to invalidate workspace cache:", cacheError);
    }

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};