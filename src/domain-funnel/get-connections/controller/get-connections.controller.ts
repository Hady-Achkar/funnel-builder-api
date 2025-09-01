import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetConnectionsService } from "../service";
import { UnauthorizedError } from "../../../errors/http-errors";

export class GetConnectionsController {
  static async getConnections(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication is required");
      }

      const workspaceId = parseInt(req.params.workspaceId);
      const result = await GetConnectionsService.getConnections(userId, { workspaceId });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}