import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getSessionsByFunnel } from "../../../services/session/get-by-funnel";

export const getSessionsByFunnelController = async (
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

    const funnelId = parseInt(req.params.funnelId, 10);

    if (isNaN(funnelId)) {
      return res.status(400).json({
        message: "Invalid funnel ID",
      });
    }

    const result = await getSessionsByFunnel(funnelId, userId);

    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Handle permission errors
      if (
        error.message.includes("permission") ||
        error.message.includes("Unauthorized")
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
