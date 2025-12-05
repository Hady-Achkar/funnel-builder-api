import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { createTemplateFromFunnelRequestSchema } from "../../../types/template/create-from-funnel";
import { CreateTemplateFromFunnelService } from "../../../services/template/create-from-funnel";
import { BadRequestError, UnauthorizedError } from "../../../errors";
import { validateImages } from "./utils/validate-images";

export class CreateTemplateFromFunnelController {
  static async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      // Validate request body with Zod
      const validatedData = createTemplateFromFunnelRequestSchema.parse(
        req.body
      );

      // Additional validation for images (exactly 1 thumbnail required)
      const imageValidation = validateImages(validatedData.images);
      if (!imageValidation.isValid) {
        res.status(400).json({ error: imageValidation.error });
        return;
      }

      // Call service
      const result = await CreateTemplateFromFunnelService.create({
        userId,
        data: validatedData,
      });

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        return next(new BadRequestError(message));
      }
      return next(error);
    }
  }
}
