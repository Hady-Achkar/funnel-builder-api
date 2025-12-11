import { z } from "zod";
import {
  UpdateFunnelSettingsRequest,
  UpdateFunnelSettingsResponse,
  updateFunnelSettingsRequest,
  updateFunnelSettingsResponse,
} from "../../../types/funnel-settings/update";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";

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

    // Get funnel with workspace information by slug
    const funnel = await prisma.funnel.findFirst({
      where: {
        slug: validatedData.funnelSlug,
        workspace: {
          slug: validatedData.workspaceSlug,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        workspaceId: true,
        workspace: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found");
    }

    // Check permissions using centralized PermissionManager
    await PermissionManager.requirePermission({
      userId,
      workspaceId: funnel.workspaceId,
      action: PermissionAction.EDIT_FUNNEL,
    });

    // Check if settings already exist
    const existingSettings = await prisma.funnelSettings.findUnique({
      where: { funnelId: funnel.id },
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
        let value = validatedData[field as keyof UpdateFunnelSettingsRequest];

        // Convert SEO keywords array to JSON string for database storage
        if (field === "defaultSeoKeywords" && Array.isArray(value)) {
          value = JSON.stringify(value) as any;
        }

        updateData[field] = value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error(
        "Nothing to update. Please provide at least one field to update."
      );
    }

    // Update the funnel settings in the database
    const updatedSettings = await prisma.funnelSettings.update({
      where: { funnelId: funnel.id },
      data: updateData,
    });

    // Invalidate relevant cache keys
    try {
      const cacheKeysToInvalidate = [
        // Funnel settings cache
        `workspace:${validatedData.workspaceSlug}:funnel:${funnel.slug}:settings:full`,
        // Full funnel cache (includes settings) - using workspace slug and funnel slug
        `workspace:${validatedData.workspaceSlug}:funnel:${funnel.slug}:full`,
        // All funnels cache (includes settings)
        `workspace:${funnel.workspaceId}:funnels:all`,
      ];

      // Delete all cache keys in parallel
      await Promise.all(
        cacheKeysToInvalidate.map((key) =>
          cacheService
            .del(key)
            .catch((err) =>
              console.warn(`Failed to invalidate cache key ${key}:`, err)
            )
        )
      );

      console.log(
        `[Cache] Invalidated funnel settings caches for funnel ${funnel.id}`
      );
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
