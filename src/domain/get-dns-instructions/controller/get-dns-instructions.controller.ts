import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetDNSInstructionsService } from "../service";
import { UnauthorizedError } from "../../../errors/http-errors";

export class GetDNSInstructionsController {
  static async getByDomainId(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication is required");
      }

      const result = await GetDNSInstructionsService.getDNSInstructions(
        userId,
        {
          id: parseInt(req.params.id),
        }
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
