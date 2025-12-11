import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { JoinByLinkService } from "../../../services/workspace/join-by-link";
import { JoinByLinkRequestSchema } from "../../../types/workspace/join-by-link";
import { BadRequestError, UnauthorizedError } from "../../../errors";

export class JoinByLinkController {
  static async joinByLink(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const validatedData = JoinByLinkRequestSchema.parse(req.body);

      const joinService = new JoinByLinkService();
      const result = await joinService.joinByLink(userId, validatedData);

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
