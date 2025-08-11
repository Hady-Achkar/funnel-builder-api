import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { ThemeService } from "../services";

export const updateTheme = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const result = await ThemeService.updateTheme(
      { themeId: parseInt(req.params.id) },
      req.userId,
      req.body
    );
    return res.json({ success: true, ...result });
  } catch (e: any) {
    const status = e.message?.includes("not found")
      ? 404
      : e.message?.includes("permission")
      ? 403
      : 400;
    return res
      .status(status)
      .json({ success: false, error: e.message || "Failed to update theme" });
  }
};
