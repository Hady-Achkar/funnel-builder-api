import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { deleteImageFolder } from "../service";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { deleteImageFolderRequest } from "../types";
import { ZodError } from "zod";

export const deleteImageFolderController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    let validatedRequest;
    try {
      validatedRequest = deleteImageFolderRequest.parse(req.params);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        throw new BadRequestError(message);
      }
      throw error;
    }

    const result = await deleteImageFolder(userId, validatedRequest);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
