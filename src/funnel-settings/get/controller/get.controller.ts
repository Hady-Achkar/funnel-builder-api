import { Request, Response, NextFunction } from "express";
import { getFunnelSettings } from "../service";

export const getFunnelSettingsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const funnelId = parseInt(req.params.funnelId);

    if (!funnelId || isNaN(funnelId)) {
      throw new Error("Invalid funnel ID");
    }

    const result = await getFunnelSettings(funnelId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};