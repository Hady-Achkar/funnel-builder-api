import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getAllInsightSubmissions } from "../service/getAll.service";
import { getAllInsightSubmissionsRequest } from "../types/getAll.types";

export const getAllInsightSubmissionsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId as number;
    const funnelId = parseInt(req.params.funnelId);
    
    // Build request data with proper validation
    const rawRequestData = {
      funnelId,
      ...(req.query.type && { type: req.query.type }),
      ...(req.query.insightId && { insightId: req.query.insightId }),
      ...(req.query.sessionId && { sessionId: req.query.sessionId }),
      ...(req.query.dateFrom && { dateFrom: req.query.dateFrom }),
      ...(req.query.dateTo && { dateTo: req.query.dateTo }),
      ...(req.query.completedOnly && { completedOnly: req.query.completedOnly }),
      ...(req.query.sortBy && { sortBy: req.query.sortBy }),
      ...(req.query.sortOrder && { sortOrder: req.query.sortOrder }),
      ...(req.query.page && { page: req.query.page }),
      ...(req.query.limit && { limit: req.query.limit }),
    };

    // Validate and transform request data using Zod
    const requestData = getAllInsightSubmissionsRequest.parse(rawRequestData);

    const result = await getAllInsightSubmissions(userId, requestData);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};