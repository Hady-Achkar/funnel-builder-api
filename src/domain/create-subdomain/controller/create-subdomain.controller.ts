import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { CreateSubdomainService } from "../service/create-subdomain.service";
import { UnauthorizedError } from "../../../errors/http-errors";

export class CreateSubdomainController {
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

      console.log(
        `[Subdomain Create] Processing subdomain creation for user ${userId}`
      );

      const result = await CreateSubdomainService.create(userId, req.body);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}