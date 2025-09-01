import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { CreateCustomDomainService } from "../service";
import { UnauthorizedError } from "../../../errors/http-errors";

export class CreateCustomDomainController {
  static async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication is required");
      }

      const result = await CreateCustomDomainService.create(userId, req.body);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
