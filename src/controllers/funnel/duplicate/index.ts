import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { duplicateFunnel } from "../../../services/funnel/duplicate";
import { UnauthorizedError } from "../../../errors/http-errors";
import { cacheService } from "../../../services/cache/cache.service";
import { getPrisma } from "../../../lib/prisma";

export const duplicateFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to duplicate the funnel");
    }

    const funnelId = parseInt(req.params.id);
    const data = req.body;

    const result = await duplicateFunnel(funnelId, userId, data);

    // Invalidate workspace cache after successful duplication
    try {
      const prisma = getPrisma();
      const newFunnel = await prisma.funnel.findUnique({
        where: { id: result.funnelId },
        select: {
          workspace: {
            select: { slug: true }
          }
        }
      });

      if (newFunnel?.workspace?.slug) {
        const workspaceCacheKey = `workspace:${newFunnel.workspace.slug}:user:${userId}`;
        await cacheService.del(workspaceCacheKey);
      }
    } catch (cacheError) {
      console.error("Failed to invalidate workspace cache:", cacheError);
    }

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};