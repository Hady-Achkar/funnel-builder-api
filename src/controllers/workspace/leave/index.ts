import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { LeaveWorkspaceService } from "../../../services/workspace/leave";
import { BadRequestError, UnauthorizedError } from "../../../errors/http-errors";
import { leaveWorkspaceParams } from "../../../types/workspace/leave";
import { ZodError } from "zod";

export class LeaveWorkspaceController {
  static async leave(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      const { slug } = req.params;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      leaveWorkspaceParams.parse({ slug });

      const result = await LeaveWorkspaceService.leave(userId, slug);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        return next(new BadRequestError(message));
      }
      next(error);
    }
  }
}
