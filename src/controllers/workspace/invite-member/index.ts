import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { InviteMemberService } from "../../../services/workspace/invite-member";
import { InviteMemberRequestSchema } from "../../../types/workspace/invite-member";
import { BadRequestError, UnauthorizedError } from "../../../errors";

export class InviteMemberController {
  static async inviteMember(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const { slug } = req.params;
      const requestData = { ...req.body, workspaceSlug: slug };

      const validatedData = InviteMemberRequestSchema.parse(requestData);

      const result = await InviteMemberService.inviteMember(
        userId,
        validatedData
      );
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
