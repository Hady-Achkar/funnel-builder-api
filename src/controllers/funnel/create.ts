import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../../services/funnel";
import { sendErrorResponse } from "./helper";

export const createFunnel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { name, status } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Unauthorized - Please login to create a funnel",
      });
      return;
    }

    if (!name) {
      res.status(400).json({
        success: false,
        error: "Funnel name is required",
      });
      return;
    }

    const funnel = await FunnelService.createFunnel(userId, { name, status });

    res.status(201).json({
      success: true,
      ...funnel,
    });
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};