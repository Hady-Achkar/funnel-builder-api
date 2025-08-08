import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { ThemeService } from "../../services/theme";

export const updateTheme = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const themeId = parseInt(req.params.id);
    const {
      name,
      backgroundColor,
      textColor,
      buttonColor,
      buttonTextColor,
      borderColor,
      optionColor,
      fontFamily,
      borderRadius
    } = req.body;

    if (!themeId || isNaN(themeId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid theme ID"
      });
    }

    const result = await ThemeService.updateTheme(themeId, userId, {
      name,
      backgroundColor,
      textColor,
      buttonColor,
      buttonTextColor,
      borderColor,
      optionColor,
      fontFamily,
      borderRadius
    });

    res.json(result);
  } catch (e: any) {
    const status = e.message?.includes("not found") ? 404 : 
                  e.message?.includes("permission") ? 403 : 400;
    res.status(status).json({
      success: false,
      error: e.message || "Failed to update theme"
    });
  }
};