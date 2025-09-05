import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { AffiliateLinkService } from "../../services/affiliate";
import { UnauthorizedError } from "../../errors/http-errors";

export class AffiliateLinkController {
  static async generateLink(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication is required");
      }

      const result = await AffiliateLinkService.generateLink(userId, req.body);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}