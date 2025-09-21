import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { createFunnel } from "../../../services/funnel/create";
import { createFunnelRequest } from "../../../types/funnel/create";
import { UnauthorizedError } from "../../../errors/http-errors";
import { cacheService } from "../../../services/cache/cache.service";

export const createFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createFunnelRequest.parse(req.body);

    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to create a funnel");
    }

    const { response, workspaceId } = await createFunnel(userId, validatedData);

    try {
      // Invalidate funnel list cache
      const funnelsCacheKey = `workspace:${workspaceId}:funnels:all`;
      await cacheService.del(funnelsCacheKey);

      // Invalidate workspace cache (includes funnel list)
      const workspaceSlug = validatedData.workspaceSlug;
      const workspaceCacheKey = `workspace:${workspaceSlug}:user:${userId}`;
      await cacheService.del(workspaceCacheKey);
    } catch (cacheError) {
      console.error(
        "Cache invalidation failed in funnel create controller:",
        cacheError
      );
    }

    return res.status(201).json(response);
  } catch (error) {
    console.error(
      "[FUNNEL_CREATE_CONTROLLER_ERROR] Error in funnel create controller:",
      error
    );
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details:
          error.issues.length > 0
            ? error.issues.map((issue) => issue.message)
            : ["Invalid request data"],
      });
    }
    return next(error);
  }
};
