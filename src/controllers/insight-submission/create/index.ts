import { Request, Response, NextFunction } from "express";
import { createInsightSubmission } from "../../../services/insight-submission/create";
import { CreateInsightSubmissionRequest } from "../../../types/insight-submission/create";

export const createInsightSubmissionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestBody = req.body as CreateInsightSubmissionRequest;

    const result = await createInsightSubmission(requestBody);

    res.status(201).json(result);
  } catch (error: any) {
    next(error);
  }
};