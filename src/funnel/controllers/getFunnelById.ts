import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../services";

export const getFunnelById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const funnelId = Number(req.params.id);
    
    if (!req.params.id || isNaN(funnelId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid funnel ID provided",
      });
    }

    const result = await FunnelService.getFunnelById(
      funnelId,
      req.userId
    );

    return res.json({ success: true, ...result });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Invalid input"))
        return res.status(400).json({ success: false, error: error.message });
      if (error.message.includes("access"))
        return res.status(403).json({ success: false, error: "Access denied" });
      if (error.message.includes("not found"))
        return res
          .status(404)
          .json({ success: false, error: "Funnel not found" });
      if (error.message.includes("Failed to get funnel"))
        return res.status(500).json({ success: false, error: error.message });
    }
    return res
      .status(500)
      .json({ success: false, error: "Unable to retrieve funnel" });
  }
};
