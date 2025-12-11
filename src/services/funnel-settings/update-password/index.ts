import { getPrisma } from "../../../lib/prisma";
import { encrypt } from "../lock-funnel/utils/encryption";
import {
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  updatePasswordRequestSchema,
  updatePasswordResponseSchema,
} from "../../../types/funnel-settings/update-password";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../../errors/http-errors";
import { ZodError } from "zod";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import { cacheService } from "../../cache/cache.service";

export async function updateFunnelPassword(
  userId: number,
  request: UpdatePasswordRequest
): Promise<UpdatePasswordResponse> {
  try {
    // 1. Validate user ID
    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    // 2. Validate request data
    const validatedRequest = updatePasswordRequestSchema.parse(request);

    const prisma = getPrisma();

    // 3. Get funnel with workspace information by slug
    const funnel = await prisma.funnel.findFirst({
      where: {
        slug: validatedRequest.funnelSlug,
        workspace: {
          slug: validatedRequest.workspaceSlug,
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        workspaceId: true,
        workspace: {
          select: {
            id: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!funnel) {
      throw new NotFoundError("Funnel not found");
    }

    // 4. Check permissions (OWNER, ADMIN, or EDIT_FUNNELS permission required)
    await PermissionManager.requirePermission({
      userId,
      workspaceId: funnel.workspaceId,
      action: PermissionAction.EDIT_FUNNEL,
    });

    // 5. Get funnel settings
    const funnelSettings = await prisma.funnelSettings.findUnique({
      where: { funnelId: funnel.id },
      select: {
        id: true,
        isPasswordProtected: true,
        passwordHash: true,
      },
    });

    if (!funnelSettings) {
      throw new NotFoundError(
        "Funnel settings not found. Please initialize settings first."
      );
    }

    // 6. Validate funnel is password protected
    if (!funnelSettings.isPasswordProtected) {
      throw new ForbiddenError(
        "This funnel is not password protected. Please lock the funnel first before updating its password."
      );
    }

    if (!funnelSettings.passwordHash) {
      throw new ForbiddenError(
        "No password is set for this funnel. Please lock the funnel first."
      );
    }

    // 7. Encrypt new password
    const newPasswordHash = encrypt(validatedRequest.newPassword);

    // 8. Update password hash in settings
    await prisma.funnelSettings.update({
      where: { id: funnelSettings.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // 9. Invalidate cache (non-blocking)
    const cacheKeysToInvalidate = [
      // Funnel settings cache (slug-based)
      `workspace:${validatedRequest.workspaceSlug}:funnel:${funnel.slug}:settings:full`,
      // Full funnel cache (includes settings)
      `workspace:${validatedRequest.workspaceSlug}:funnel:${funnel.slug}:full`,
      // All funnels cache for workspace
      `workspace:${funnel.workspaceId}:funnels:all`,
    ];

    try {
      await Promise.all(
        cacheKeysToInvalidate.map((key) =>
          cacheService.del(key).catch((err) =>
            console.warn(`Failed to invalidate cache key ${key}:`, err)
          )
        )
      );

      console.log(
        `[Cache] Invalidated funnel ${funnel.id} settings cache after password update`
      );
    } catch (cacheError) {
      console.error(
        "Failed to invalidate cache after password update:",
        cacheError
      );
      // Don't fail the operation if cache invalidation fails
    }

    // 10. Return success response
    const response: UpdatePasswordResponse = {
      message: "Funnel password updated successfully",
      success: true,
    };

    return updatePasswordResponseSchema.parse(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
}
