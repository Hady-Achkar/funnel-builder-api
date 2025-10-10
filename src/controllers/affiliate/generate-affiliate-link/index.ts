import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { AffiliateLinkService } from "../../../services/affiliate/generate-affiliate-link";
import { GenerateAffiliateLinkRequest } from "../../../types/affiliate/generate-affiliate-link";
import { BadRequestError } from "../../../errors/http-errors";

export class AffiliateLinkController {
  static async generateLink(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. GET USER ID FROM AUTH MIDDLEWARE
      const userId = req.userId!;

      // 2. VALIDATE REQUEST SCHEMA with Zod
      const validatedData = GenerateAffiliateLinkRequest.parse(req.body);

      // 3. CALL SERVICE (service handles all business validation)
      const result = await AffiliateLinkService.generateLink(
        userId,
        validatedData
      );

      // 4. SEND SUCCESS RESPONSE
      res.status(201).json(result);
    } catch (error) {
      // Handle Zod validation errors with user-friendly messages
      if (error instanceof ZodError) {
        const friendlyMessage =
          error.issues[0]?.message || "Please check your input and try again";
        return next(new BadRequestError(friendlyMessage));
      }

      // All other errors (BadRequestError, etc.) pass through
      next(error);
    }
  }
}
