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

      const { workspaceSlug, funnelSlug } = req.params;

      if (!workspaceSlug || !funnelSlug) {
        throw new BadRequestError("Workspace slug and funnel slug are required");
      }

      const result = await GetFunnelConnectionService.getFunnelConnection(userId, {
        workspaceSlug,
        funnelSlug
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}