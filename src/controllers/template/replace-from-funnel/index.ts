import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { ReplaceTemplateFromFunnelService } from "../../../services/template/replace-from-funnel";
import { replaceTemplateFromFunnelRequestSchema } from "../../../types/template/replace-from-funnel";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { ZodError } from "zod";

export class ReplaceTemplateFromFunnelController {
  static async replace(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const templateSlug = req.params.templateSlug;

      if (!templateSlug) {
        throw new BadRequestError("Template slug is required");
      }

      // Validate request body
      const validationResult = replaceTemplateFromFunnelRequestSchema.safeParse(
        req.body
      );

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        throw new BadRequestError(firstError.message);
      }

      const result = await ReplaceTemplateFromFunnelService.replace({
        userId,
        templateSlug,
        data: validationResult.data,
      });

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        return next(new BadRequestError(firstError.message));
      }
      return next(error);
    }
  }
}
