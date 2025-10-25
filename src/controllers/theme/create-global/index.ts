import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createGlobalTheme } from "../../../services/theme/create-global";

export const createGlobalThemeController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized: User ID is required",
      });
    }

    const result = await createGlobalTheme(userId, req.body);

    return res.status(201).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Handle authorization errors
      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("administrators")
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      // Handle validation errors
      if (error.message.includes("Invalid input")) {
        return res.status(400).json({
          message: error.message,
        });
      }

      // Handle not found errors
      if (error.message.includes("not found")) {
        return res.status(404).json({
          message: error.message,
        });
      }

      // Handle other errors
      return res.status(500).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "An unexpected error occurred",
    });
  }
};
