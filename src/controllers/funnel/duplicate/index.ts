import { Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { duplicateFunnel } from "../../../services/funnel/duplicate";
import { duplicateFunnelRequest } from "../../../types/funnel/duplicate";
import { UnauthorizedError } from "../../../errors/http-errors";
import { cacheService } from "../../../services/cache/cache.service";

export const duplicateFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const validatedData = duplicateFunnelRequest.parse(req.body);

    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to duplicate a funnel");
    }

    const funnelId = parseInt(req.params.id);
    if (isNaN(funnelId)) {
      return res.status(400).json({ error: "Invalid funnel ID" });
    }

    const { response, workspaceId } = await duplicateFunnel(
      funnelId,
      userId,
      validatedData
    );

    try {
      const cacheKeysToInvalidate = [
        `workspace:${workspaceId}:funnels:all`,
        `workspace:${workspaceId}:funnels:list`,
        `user:${userId}:workspace:${workspaceId}:funnels`,
      ];

      await Promise.all(
        cacheKeysToInvalidate.map((key) =>
          cacheService.del(key).catch((err) =>
            console.warn(`Failed to invalidate cache key ${key}:`, err)
          )
        )
      );
    } catch (cacheError) {
      console.error(
        "Cache invalidation failed in funnel duplicate controller:",
        cacheError
      );
    }

    return res.status(201).json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      return res.status(400).json({
        error: firstError?.message || "Invalid request data",
      });
    }
    return next(error);
  }
};