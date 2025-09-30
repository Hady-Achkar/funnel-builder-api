import { z } from "zod";
import {
  UpdateFunnelSettingsRequest,
  UpdateFunnelSettingsResponse,
  updateFunnelSettingsRequest,
  updateFunnelSettingsResponse,
} from "../../../types/funnel-settings/update";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { hasPermissionToEditFunnelSettings } from "../../../helpers/funnel-settings/update";

export const updateFunnelSettings = async (
  userId: number,
  data: Partial<UpdateFunnelSettingsRequest>
): Promise<UpdateFunnelSettingsResponse> => {
  let validatedData: UpdateFunnelSettingsRequest =
    {} as UpdateFunnelSettingsRequest;

  try {
    if (!userId) throw new Error("User ID is required");

    validatedData = updateFunnelSettingsRequest.parse(data);

    const prisma = getPrisma();

    // Get funnel with workspace information
    const funnel = await prisma.funnel.findUnique({
      where: { id: validatedData.funnelId },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found");
    }

    // Check permissions
    const isOwner = funnel.workspace.ownerId === userId;

    if (!isOwner) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userId,
            workspaceId: funnel.workspaceId,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!member) {
        throw new Error(
          `You don't have access to the "${funnel.workspace.name}" workspace`
        );
      }

      const canEditSettings = hasPermissionToEditFunnelSettings(
        member.role,
        member.permissions
      );

      if (!canEditSettings) {
        throw new Error(
          "You don't have permission to edit funnel settings in this workspace"
        );
      }
    }

    // Check if settings already exist
    const existingSettings = await prisma.funnelSettings.findUnique({
      where: { funnelId: validatedData.funnelId },
    });

    if (!existingSettings) {
      throw new Error(
        "Funnel settings not found. Settings should have been created when the funnel was created."
      );
    }

    // Build update data from fields that were explicitly provided
    const updateFields = [
      "defaultSeoTitle",
      "defaultSeoDescription",
      "defaultSeoKeywords",
      "favicon",
      "ogImage",
      "googleAnalyticsId",
      "facebookPixelId",
      "customTrackingScripts",
      "enableCookieConsent",
      "cookieConsentText",
      "privacyPolicyUrl",
      "termsOfServiceUrl",
      "language",
      "timezone",
      "dateFormat",
    ];

    const updateData: any = {};

    updateFields.forEach((field) => {
      if (field in data) {
        updateData[field] =
          validatedData[field as keyof UpdateFunnelSettingsRequest];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error(
        "Nothing to update. Please provide at least one field to update."
      );
    }

    // Update the funnel settings in the database
    const updatedSettings = await prisma.funnelSettings.update({
      where: { funnelId: validatedData.funnelId },
      data: updateData,
    });

    // Invalidate relevant cache keys
    try {
      const cacheKeysToInvalidate = [
        // Funnel settings cache
        `funnel:${validatedData.funnelId}:settings:full`,
        // Full funnel cache (includes settings)
        `workspace:${funnel.workspaceId}:funnel:${funnel.id}:full`,
        // All funnels cache (includes settings)
        `workspace:${funnel.workspaceId}:funnels:all`,
      ];

      // Delete all cache keys in parallel
      await Promise.all(
        cacheKeysToInvalidate.map(key =>
          cacheService.del(key).catch(err =>
            console.warn(`Failed to invalidate cache key ${key}:`, err)
          )
        )
      );

      console.log(`[Cache] Invalidated funnel settings caches for funnel ${funnel.id}`);
    } catch (cacheError) {
      console.error("Failed to invalidate funnel settings cache:", cacheError);
      // Don't fail the operation if cache invalidation fails
    }

    const response = {
      message: "Funnel settings updated successfully",
      success: true,
    };

    return updateFunnelSettingsResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to update funnel settings: ${error.message}`);
    }
    throw new Error("Couldn't update the funnel settings. Please try again.");
  }
};
