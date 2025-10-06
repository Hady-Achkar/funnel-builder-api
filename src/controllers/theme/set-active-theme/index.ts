import { Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { setActiveTheme } from "../../../services/theme/set-active-theme";
import { UnauthorizedError } from "../../../errors/http-errors";

export const setActiveThemeController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to update the theme");
    }

    const funnelId = parseInt(req.params.funnelId);
    if (isNaN(funnelId)) {
      return res.status(400).json({ error: "Invalid funnel ID" });
    }

    const response = await setActiveTheme(funnelId, userId, req.body);

    return res.status(200).json(response);
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
