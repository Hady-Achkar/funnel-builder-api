import { Response, NextFunction } from "express";
import { getGlobalThemes } from "../../../services/theme/get-global-themes";
import { AuthRequest } from "../../../middleware/auth";

export const getGlobalThemesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const themes = await getGlobalThemes(userId);

    res.json(themes);
  } catch (error) {
    console.error("Error in getGlobalThemesController:", error);
    next(error);
  }
};
