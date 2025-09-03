import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetAllDomainsService } from "../../../services/domain/get-all-domains";
import { UnauthorizedError } from "../../../errors/http-errors";

export class GetAllDomainsController {
  static async getAllDomains(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication is required");
      }

      const result = await GetAllDomainsService.getAllDomains(userId, {
        workspaceId: parseInt(req.params.workspaceId),
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        filters: {
          status: req.query.status as string,
          type: req.query.type as string,
          hostname: req.query.hostname as string,
        },
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as string,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}