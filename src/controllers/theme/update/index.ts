import { Response, NextFunction } from "express";
import { updateTheme } from "../../../services/theme/update";
import { AuthRequest } from "../../../middleware/auth";

export const updateThemeController = async (
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

    const result = await updateTheme(userId, { id: req.params.id }, req.body);

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};