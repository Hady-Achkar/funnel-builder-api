import { Request, Response, NextFunction } from "express";
import { createFormSubmission } from "../../../services/form-submission/create";

export const createFormSubmissionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createFormSubmission(req.body);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};