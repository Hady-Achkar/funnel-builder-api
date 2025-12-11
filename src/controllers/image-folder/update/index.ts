import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { updateImageFolder } from "../../../services/image-folder/update";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import {
  updateImageFolderParamsRequest,
  updateImageFolderRequest,
} from "../../../types/image-folder/update";
import { ZodError } from "zod";

export const updateImageFolderController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    let validatedParamsRequest;
    try {
      validatedParamsRequest = updateImageFolderParamsRequest.parse(req.params);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        throw new BadRequestError(message);
      }
      throw error;
    }

    let validatedRequest;
    try {
      validatedRequest = updateImageFolderRequest.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        throw new BadRequestError(message);
      }
      throw error;
    }

    const result = await updateImageFolder(
      userId,
      validatedParamsRequest,
      validatedRequest
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};