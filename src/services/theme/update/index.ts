import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import {
  UpdateThemeParams,
  UpdateThemeParamsInput,
  UpdateThemeRequest,
  UpdateThemeResponse,
  updateThemeParams,
  updateThemeRequest,
  updateThemeResponse,
} from "../../../types/theme/update";
import {
  checkThemeUpdatePermissions,
  updateThemeInCache,
} from "../../../helpers/theme/update";
import { BadRequestError, UnauthorizedError } from "../../../errors";

export const updateTheme = async (
  userId: number,
  params: UpdateThemeParamsInput,
  requestBody: UpdateThemeRequest
): Promise<UpdateThemeResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedParams = updateThemeParams.parse(params);
    const validatedRequest = updateThemeRequest.parse(requestBody);

    const prisma = getPrisma();

    // Check permissions using the helper
    const permissionResult = await checkThemeUpdatePermissions(
      userId,
      validatedParams.id
    );

    // Update theme in database
    const updatedTheme = await prisma.theme.update({
      where: { id: validatedParams.id },
      data: validatedRequest,
    });

    // Invalidate cache using the helper
    await updateThemeInCache(
      permissionResult.workspace?.slug || null,
      permissionResult.theme.funnel?.slug || null,
      permissionResult.workspace?.id || null,
      permissionResult.isGlobalTheme
    );

    const response = {
      message: "Theme updated successfully",
    };

    return updateThemeResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};