import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetFunnelConnectionService } from "../../../services/domain-funnel/get-funnel-connection";
import { UnauthorizedError, BadRequestError } from "../../../errors/http-errors";

export class GetFunnelConnectionController {
  static async getFunnelConnection(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication is required");
      }

      const funnelId = parseInt(req.params.funnelId);

      if (!funnelId || isNaN(funnelId)) {
        throw new BadRequestError("Invalid funnel ID");
      }

      const result = await GetFunnelConnectionService.getFunnelConnection(userId, { funnelId });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}