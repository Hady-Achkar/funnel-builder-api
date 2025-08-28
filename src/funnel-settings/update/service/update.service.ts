import { z } from "zod";
import {
  UpdateFunnelSettingsRequest,
  UpdateFunnelSettingsResponse,
  updateFunnelSettingsRequest,
  updateFunnelSettingsResponse,
} from "../types";
import { cacheService } from "../../../services/cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { hasPermissionToEditFunnelSettings } from "../helpers";

export const updateFunnelSettings = async (
  userId: number,
  data: Partial<UpdateFunnelSettingsRequest>
): Promise<UpdateFunnelSettingsResponse> => {
  let validatedData: UpdateFunnelSettingsRequest = {} as UpdateFunnelSettingsRequest;

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
      throw new Error("Funnel settings not found. Settings should have been created when the funnel was created.");
    }

    // Build update data from fields that were explicitly provided
    const updateFields = [
      'defaultSeoTitle',
      'defaultSeoDescription', 
      'defaultSeoKeywords',
      'favicon',
      'ogImage',
      'googleAnalyticsId',
      'facebookPixelId',
      'customTrackingScripts',
      'enableCookieConsent',
      'cookieConsentText',
      'privacyPolicyUrl',
      'termsOfServiceUrl',
      'language',
      'timezone',
      'dateFormat'
    ];

    const updateData: any = {};
    
    updateFields.forEach(field => {
      if (field in data) {
        updateData[field] = validatedData[field as keyof UpdateFunnelSettingsRequest];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new Error("Nothing to update. Please provide at least one field to update.");
    }

    const updatedSettings = await prisma.funnelSettings.update({
      where: { id: existingSettings.id },
      data: updateData,
    });

    // Update cache
    try {
      const cacheKey = `funnel:${validatedData.funnelId}:settings:full`;
      
      // Cache the full settings data
      await cacheService.set(cacheKey, updatedSettings, { ttl: 0 });
      
      // Also invalidate related funnel cache to ensure consistency
      await cacheService.del(`workspace:${funnel.workspaceId}:funnel:${funnel.id}:full`);
    } catch (cacheError) {
      console.warn("Cache update failed but settings were updated:", cacheError);
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