import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { deleteFunnel } from "../../../services/funnel/delete";
import { UnauthorizedError } from "../../../errors/http-errors";
import { cacheService } from "../../../services/cache/cache.service";
import { getPrisma } from "../../../lib/prisma";

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
    
    const funnelId = parseInt(req.params.id);

    // Get workspace slug before deletion
    const prisma = getPrisma();
    const funnel = await prisma.funnel.findUnique({
      where: { id: funnelId },
      select: {
        workspace: {
          select: { slug: true }
        }
      }
    });

    const result = await deleteFunnel(funnelId, userId);

    // Invalidate workspace cache after successful deletion
    try {
      if (funnel?.workspace?.slug) {
        const workspaceCacheKey = `workspace:${funnel.workspace.slug}:user:${userId}`;
        await cacheService.del(workspaceCacheKey);
      }
    } catch (cacheError) {
      console.error("Failed to invalidate workspace cache:", cacheError);
    }

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};