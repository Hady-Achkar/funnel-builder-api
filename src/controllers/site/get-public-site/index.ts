import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { getPublicSiteRequestSchema } from "../../../types/site/get-public-site";
import { GetPublicSiteService } from "../../../services/site/get-public-site";
import { BadRequestError } from "../../../errors/http-errors";

export class GetPublicSiteController {
  static async getPublicSite(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request - hostname must be in query parameters
      const validatedData = getPublicSiteRequestSchema.parse(req.query);

      // Call service
      const result = await GetPublicSiteService.getPublicSite(validatedData);

      // Send response
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new BadRequestError(error.issues[0]?.message || "Invalid request data")
        );
      }
      next(error);
    }
  }
}
