import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createForm } from "../../../services/form/create";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { createFormRequest } from "../../../types/form/create";
import { ZodError } from "zod";

export const createFormController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Check authentication
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    // 2. Validate URL parameters
    const { workspaceSlug, funnelSlug } = req.params;
    if (!workspaceSlug || !funnelSlug) {
      return res.status(400).json({
        error: "Workspace slug and funnel slug are required",
      });
    }

    // 3. Validate request body
    const validatedData = createFormRequest.parse(req.body);

    // 4. Call service
    const result = await createForm(
      userId,
      workspaceSlug,
      funnelSlug,
      validatedData
    );

    // 5. Send response
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return next(
        new BadRequestError(
          error.issues[0]?.message || "Invalid data provided"
        )
      );
    }
    next(error);
  }
};