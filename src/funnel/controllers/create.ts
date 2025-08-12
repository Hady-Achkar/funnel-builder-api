import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../services";

export const createFunnel = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const result = await FunnelService.createFunnel(userId, req.body);

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Authentication failed")) {
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }

      if (error.message.includes("Invalid input")) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      if (
        error.message.includes("limit reached") ||
        error.message.includes("already exists")
      ) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred. Please try again.",
    });
  }
};
