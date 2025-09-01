import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { ConnectFunnelDomainService } from "../service";
import { UnauthorizedError } from "../../../errors/http-errors";

export class ConnectFunnelDomainController {
  static async connect(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication is required");
      }

      const result = await ConnectFunnelDomainService.connect(userId, req.body);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}