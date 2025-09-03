import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { updateInsight } from "../../../services/insight/update";
import { UpdateInsightRequest } from "../../../types/insight/update";

export const updateInsightController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId as number;
    const insightId = parseInt(req.params.id);
    
    const requestData: UpdateInsightRequest = {
      insightId,
      ...req.body,
    };

    const result = await updateInsight(userId, requestData);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};