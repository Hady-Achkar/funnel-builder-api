import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getAllFormSubmissions } from "../../../services/form-submission/get-all";
import { getAllFormSubmissionsRequest } from "../../../types/form-submission/get-all";

export const getAllFormSubmissionsController = async (
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
      ...(req.query.formId && { formId: req.query.formId }),
      ...(req.query.sessionId && { sessionId: req.query.sessionId }),
      ...(req.query.startDate && { startDate: req.query.startDate }),
      ...(req.query.endDate && { endDate: req.query.endDate }),
      ...(req.query.completedOnly && { completedOnly: req.query.completedOnly }),
      ...(req.query.sortBy && { sortBy: req.query.sortBy }),
      ...(req.query.sortOrder && { sortOrder: req.query.sortOrder }),
      ...(req.query.page && { page: req.query.page }),
      ...(req.query.limit && { limit: req.query.limit }),
    };

    // Validate and transform request data using Zod
    const requestData = getAllFormSubmissionsRequest.parse(rawRequestData);

    const result = await getAllFormSubmissions(userId, requestData);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};