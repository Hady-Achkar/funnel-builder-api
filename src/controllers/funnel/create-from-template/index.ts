import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { CreateFunnelFromTemplateService } from "../../../services/funnel/create-from-template";
import { createFunnelFromTemplateRequestSchema } from "../../../types/funnel/create-from-template";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { ZodError } from "zod";

export class CreateFunnelFromTemplateController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError(
          "Please log in to create a funnel from template"
        );
      }

      // Validate request body
      const validationResult = createFunnelFromTemplateRequestSchema.safeParse(
        req.body
      );

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        throw new BadRequestError(firstError.message);
      }

      const result = await CreateFunnelFromTemplateService.create({
        userId,
        data: validationResult.data,
      });

      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        return next(new BadRequestError(firstError.message));
      }
      return next(error);
    }
  }
}
