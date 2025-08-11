import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../services";
import { FunnelListQuery } from "../types";

export const getUserFunnels = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const result = await FunnelService.getUserFunnels(
      req.userId,
      req.query as unknown as FunnelListQuery
    );
    return res.json({ success: true, ...result });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Invalid input")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Unable to retrieve funnels",
    });
  }
};
