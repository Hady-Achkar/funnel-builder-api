import { Request, Response, NextFunction } from "express";
import { createInsightSubmission } from "../service/create.service";
import { CreateInsightSubmissionRequest } from "../types/create.types";

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
