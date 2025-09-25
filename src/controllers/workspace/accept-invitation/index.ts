import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { AcceptInvitationService } from "../../../services/workspace/accept-invitation";
import { AcceptInvitationRequestSchema } from "../../../types/workspace/accept-invitation";
import { BadRequestError } from "../../../errors";

export class AcceptInvitationController {
  static async acceptInvitation(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;

      // Validate request data
      const validatedData = AcceptInvitationRequestSchema.parse(req.body);

      const service = new AcceptInvitationService();
      const result = await service.acceptInvitation(userId, validatedData);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        const errorMessage = firstError
          ? firstError.message
          : "Invalid request data";
        next(new BadRequestError(errorMessage));
      } else {
        next(error);
      }
    }
  }
}
