import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetAllAffiliateLinksService } from "../../../services/affiliate/get-all-affiliate-links";
import { getAllAffiliateLinksRequestSchema } from "../../../types/affiliate/get-all-affiliate-links";
import { ZodError } from "zod";

export class GetAllAffiliateLinksController {
  static async getAllAffiliateLinks(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. Check authentication
      if (!req.userId) {
        res.status(401).json({
          error: "Please sign in to view your affiliate links",
        });
        return;
      }

      // 2. Validate request query parameters
      const validatedRequest = getAllAffiliateLinksRequestSchema.parse(req.query);

      // 3. Call service
      const result = await GetAllAffiliateLinksService.getAllAffiliateLinks(
        req.userId,
        validatedRequest
      );

      // 4. Send response
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid request parameters",
          details: error.issues[0]?.message || "Please check your input",
        });
        return;
      }
      next(error);
    }
  }
}
