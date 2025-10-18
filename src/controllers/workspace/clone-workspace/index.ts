import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { CloneWorkspaceService } from "../../../services/workspace/clone-workspace";
import { CloneWorkspaceRequest } from "../../../types/workspace/clone-workspace";
import { BadRequestError } from "../../../errors/http-errors";

/**
 * Controller for workspace cloning operations
 * This is typically called from the subscription webhook, not directly from routes
 *
 * Note: No route is created for this controller as it's only used internally
 * by the subscription webhook handler after successful workspace purchase
 */
export class CloneWorkspaceController {
  static async cloneWorkspace(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. VALIDATE REQUEST SCHEMA with Zod
      const validatedData = CloneWorkspaceRequest.parse(req.body);

      // 2. CALL SERVICE (service handles all business validation)
      const result = await CloneWorkspaceService.cloneWorkspace(validatedData);

      // 3. SEND SUCCESS RESPONSE
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
