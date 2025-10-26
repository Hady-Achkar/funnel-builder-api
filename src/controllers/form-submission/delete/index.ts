import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { deleteFormSubmission } from "../../../services/form-submission/delete";
import { deleteFormSubmissionParams } from "../../../types/form-submission/delete";

export const deleteFormSubmissionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized: User ID is required",
      });
      return;
    }

    // Parse and validate submissionId from params
    const validatedParams = deleteFormSubmissionParams.parse({
      submissionId: req.params.submissionId,
    });

    const result = await deleteFormSubmission(userId, validatedParams);

    res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error.message.includes("permission")) {
        res.status(403).json({ message: error.message });
        return;
      }
      if (error.message.includes("Invalid")) {
        res.status(400).json({ message: error.message });
        return;
      }
    }
    next(error);
  }
};
