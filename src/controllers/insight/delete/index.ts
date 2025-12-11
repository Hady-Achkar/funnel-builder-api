import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { deleteInsight } from "../../../services/insight/delete";
import { DeleteInsightRequest } from "../../../types/insight/delete";

export const deleteInsightController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId as number;
    const insightId = parseInt(req.params.id);
    
    const requestData: DeleteInsightRequest = { insightId };

    const result = await deleteInsight(userId, requestData);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};