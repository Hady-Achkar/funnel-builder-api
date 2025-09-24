import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { ZodError } from "zod";
import { UpdateUserProfileService } from "../../../services/auth/update-user-profile";
import {
  updateUserProfileRequest,
  updateUserProfileResponse,
} from "../../../types/auth/update-user-profile";
import { UnauthorizedError } from "../../../errors/http-errors";

export class UpdateUserProfileController {
  static async updateUserProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const validatedData = updateUserProfileRequest.parse(req.body);

      const updatedUser = await UpdateUserProfileService.updateUserProfile(
        userId,
        validatedData
      );

      const response = updateUserProfileResponse.parse({ user: updatedUser });

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        res.status(400).json({
          error: firstError?.message || "Invalid request data",
        });
        return;
      }
      next(error);
    }
  }
}
