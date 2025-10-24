import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { CreateSubdomainService } from "../../../services/domain/create-subdomain";
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
      console.log('[Subdomain Create] Request headers:', req.headers);
      console.log('[Subdomain Create] Request body:', req.body);
      console.log('[Subdomain Create] Request body type:', typeof req.body);
      console.log('[Subdomain Create] subdomain value:', req.body?.subdomain);
      console.log('[Subdomain Create] workspaceSlug value:', req.body?.workspaceSlug);

      const result = await CreateSubdomainService.create(userId, req.body);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}