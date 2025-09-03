import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { VerifyDomainService } from "../../../services/domain/verify";
import { UnauthorizedError } from "../../../errors/http-errors";

export class VerifyDomainController {
  static async verify(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication is required");
      }

      const result = await VerifyDomainService.verify(userId, {
        id: parseInt(req.params.id),
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}