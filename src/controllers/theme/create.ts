import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { createTheme as createThemeService } from "../../services/theme";
import { CreateThemeRequest } from "../../types/theme.types";

export async function createTheme(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      name,
      funnelId,
      backgroundColor,
      textColor,
      buttonColor,
      buttonTextColor,
      borderColor,
      optionColor,
      fontFamily,
      borderRadius,
    }: CreateThemeRequest = req.body;

    // Guard: Validate required fields
    if (!funnelId) {
      res.status(400).json({
        success: false,
        error: "Funnel ID is required",
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

    // Create theme data (Prisma schema will handle defaults)
    const themeData = {
      funnelId,
      ...(name !== undefined && { name }),
      ...(backgroundColor !== undefined && { backgroundColor }),
      ...(textColor !== undefined && { textColor }),
      ...(buttonColor !== undefined && { buttonColor }),
      ...(buttonTextColor !== undefined && { buttonTextColor }),
      ...(borderColor !== undefined && { borderColor }),
      ...(optionColor !== undefined && { optionColor }),
      ...(fontFamily !== undefined && { fontFamily }),
      ...(borderRadius !== undefined && { borderRadius }),
    };

    // Create theme through service
    const theme = await createThemeService(themeData, req.userId);

    res.status(201).json({
      success: true,
      ...theme,
    });
  } catch (error: any) {
    console.error("ThemeController.createTheme error:", error);

    // Handle validation errors with appropriate status codes
    if (
      error.message.includes("required") ||
      error.message.includes("empty") ||
      error.message.includes("exceed")
    ) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    if (
      error.message.includes("not found") ||
      error.message.includes("don't have access")
    ) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }

    if (
      error.message.includes("already exists") ||
      error.message.includes("already has a theme")
    ) {
      res.status(409).json({
        success: false,
        error: error.message,
      });
      return;
    }

    // Generic server error for unexpected issues
    res.status(500).json({
      success: false,
      error: "Failed to create theme. Please try again later.",
    });
  }
}