import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { generateAdminInvitationRequest } from "../../../types/auth/admin-invitation";
import { GenerateAdminInvitationService } from "../../../services/auth/admin-invitation";
import { validateAdminCode } from "./utils/validate-admin-code";
import { BadRequestError } from "../../../errors/http-errors";

export class GenerateAdminInvitationController {
  static async generateInvitation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. Validate request
      const validatedData = generateAdminInvitationRequest.parse(req.body);

      // 2. Validate admin code
      if (!validateAdminCode(validatedData.adminCode)) {
        return next(
          new BadRequestError(
            "The admin code you provided is invalid. Please check your code and try again."
          )
        );
      }

      // 3. Call service to generate invitation
      const result = await GenerateAdminInvitationService.generateInvitation(
        validatedData
      );

      // 4. Send response
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues[0].message;
        return next(new BadRequestError(errorMessage));
      }
      next(error);
    }
  }
}
