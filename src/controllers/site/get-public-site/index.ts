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

      // Extract cookies from request
      const cookies = req.cookies || {};

      // Call service with cookies
      const result = await GetPublicSiteService.getPublicSite(
        validatedData,
        cookies
      );

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
