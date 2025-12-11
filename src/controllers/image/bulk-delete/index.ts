import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { bulkDeleteImages } from "../../../services/image/bulk-delete";
import { bulkDeleteImagesRequest, BulkDeleteImagesRequest } from "../../../types/image/bulk-delete";
import { ZodError } from "zod";

export const bulkDeleteImagesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    let validatedRequest: BulkDeleteImagesRequest;
    try {
      validatedRequest = bulkDeleteImagesRequest.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        throw new BadRequestError(message);
      }
      throw error;
    }

    const result = await bulkDeleteImages(userId, validatedRequest);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};