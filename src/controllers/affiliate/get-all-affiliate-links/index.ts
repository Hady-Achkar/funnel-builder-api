import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetAllAffiliateLinksService } from "../../../services/affiliate/get-all-affiliate-links";
import { UnauthorizedError } from "../../../errors/http-errors";

export class GetAllAffiliateLinksController {
  static async getAllAffiliateLinks(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication is required");
      }

      // Convert Express query to proper format for validation
      const queryParams = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        planType: req.query.planType,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await GetAllAffiliateLinksService.getAllAffiliateLinks(
        userId,
        queryParams
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}