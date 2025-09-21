import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { updateFunnel } from "../../../services/funnel/update";
import { UnauthorizedError } from "../../../errors/http-errors";
import { cacheService } from "../../../services/cache/cache.service";
import { getPrisma } from "../../../lib/prisma";

export const updateFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to update a funnel");
    }
    const funnelId = parseInt(req.params.id);
    if (!funnelId || isNaN(funnelId)) {
      throw new Error("Invalid funnel ID");
    }
    const result = await updateFunnel(funnelId, userId, req.body);

    // Invalidate workspace cache after successful update
    try {
      const prisma = getPrisma();
      const funnel = await prisma.funnel.findUnique({
        where: { id: funnelId },
        select: {
          workspace: {
            select: { slug: true }
          }
        }
      });

      if (funnel?.workspace?.slug) {
        const workspaceCacheKey = `workspace:${funnel.workspace.slug}:user:${userId}`;
        await cacheService.del(workspaceCacheKey);
      }
    } catch (cacheError) {
      console.error("Failed to invalidate workspace cache:", cacheError);
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};