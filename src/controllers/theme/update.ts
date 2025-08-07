import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { updateTheme as updateThemeService } from "../../services/theme";
import { UpdateThemeRequest } from "../../types/theme.types";

export async function updateTheme(req: AuthRequest, res: Response): Promise<void> {
  try {
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
      borderRadius,
    }: UpdateThemeRequest = req.body;

    // Guard: Validate theme ID
    if (isNaN(themeId) || themeId <= 0) {
      res.status(400).json({
        success: false,
        error: "Valid theme ID is required",
      });
      return;
    }

    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: "User authentication required",
      });
      return;
    }

    // Prepare update data (only include defined fields)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (backgroundColor !== undefined)
      updateData.backgroundColor = backgroundColor;
    if (textColor !== undefined) updateData.textColor = textColor;
    if (buttonColor !== undefined) updateData.buttonColor = buttonColor;
    if (buttonTextColor !== undefined)
      updateData.buttonTextColor = buttonTextColor;
    if (borderColor !== undefined) updateData.borderColor = borderColor;
    if (optionColor !== undefined) updateData.optionColor = optionColor;
    if (fontFamily !== undefined) updateData.fontFamily = fontFamily;
    if (borderRadius !== undefined) updateData.borderRadius = borderRadius;

    // Update theme through service
    const theme = await updateThemeService(
      themeId,
      updateData,
      req.userId
    );

    res.status(200).json({
      success: true,
      ...theme,
    });
  } catch (error: any) {
    console.error("ThemeController.updateTheme error:", error);

    // Handle validation errors with appropriate status codes
    if (
      error.message.includes("required") ||
      error.message.includes("empty") ||
      error.message.includes("exceed") ||
      error.message.includes("must be provided")
    ) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    if (
      error.message.includes("not found") ||
      error.message.includes("permission")
    ) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }

    if (error.message.includes("already exists")) {
      res.status(409).json({
        success: false,
        error: error.message,
      });
      return;
    }

    // Generic server error for unexpected issues
    res.status(500).json({
      success: false,
      error: "Failed to update theme. Please try again later.",
    });
  }
}