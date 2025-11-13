import { z } from "zod";
import {
  GetFunnelSettingsResponse,
  getFunnelSettingsRequest,
  getFunnelSettingsResponse,
} from "../../../types/funnel-settings/get";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";

export const getFunnelSettings = async (
  workspaceSlug: string,
  funnelSlug: string,
  userId: number
): Promise<GetFunnelSettingsResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedData = getFunnelSettingsRequest.parse({ workspaceSlug, funnelSlug });

    const prisma = getPrisma();

    // Find workspace by slug
    const workspace = await prisma.workspace.findUnique({
      where: { slug: validatedData.workspaceSlug },
      select: { id: true },
    });

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Find funnel by slug and workspaceId
    const funnel = await prisma.funnel.findFirst({
      where: {
        slug: validatedData.funnelSlug,
        workspaceId: workspace.id,
      },
      select: {
        id: true,
        slug: true,
        workspaceId: true,
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found");
    }

    // Check permissions
    const permissionCheck = await PermissionManager.can({
      userId,
      workspaceId: funnel.workspaceId,
      action: PermissionAction.VIEW_FUNNEL,
    });

    if (!permissionCheck.allowed) {
      throw new Error(
        permissionCheck.reason ||
        `You don't have permission to view this funnel's settings. Please contact your workspace admin.`
      );
    }

    // Try to get from cache
    const cacheKey = `workspace:${validatedData.workspaceSlug}:funnel:${validatedData.funnelSlug}:settings:full`;

    const cachedSettings = await cacheService.get<GetFunnelSettingsResponse>(
      cacheKey
    );

    if (cachedSettings) {
      return getFunnelSettingsResponse.parse(cachedSettings);
    }

    // Fetch from database
    const settings = await prisma.funnelSettings.findUnique({
      where: { funnelId: funnel.id },
      include: {
        funnel: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!settings) {
      throw new Error("Funnel settings not found");
    }

    const responseData = {
      id: settings.id,
      funnelId: settings.funnelId,
      defaultSeoTitle: settings.defaultSeoTitle ?? null,
      defaultSeoDescription: settings.defaultSeoDescription ?? null,
      defaultSeoKeywords: settings.defaultSeoKeywords ?? null,
      favicon: settings.favicon ?? null,
      ogImage: settings.ogImage ?? null,
      googleAnalyticsId: settings.googleAnalyticsId ?? null,
      facebookPixelId: settings.facebookPixelId ?? null,
      customTrackingScripts: settings.customTrackingScripts ?? null,
      enableCookieConsent: settings.enableCookieConsent ?? false,
      cookieConsentText: settings.cookieConsentText ?? null,
      privacyPolicyUrl: settings.privacyPolicyUrl ?? null,
      termsOfServiceUrl: settings.termsOfServiceUrl ?? null,
      language: settings.language ?? null,
      timezone: settings.timezone ?? null,
      dateFormat: settings.dateFormat ?? null,
      isPasswordProtected: settings.isPasswordProtected ?? false,
      passwordHash: settings.passwordHash ?? null,
      funnelStatus: settings.funnel.status,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };

    try {
      await cacheService.set(cacheKey, responseData, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Failed to cache funnel settings:", cacheError);
    }

    return getFunnelSettingsResponse.parse(responseData);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.issues.map(issue => {
        const received = 'received' in issue ? JSON.stringify(issue.received) : 'unknown';
        return `${issue.path.join('.')}: ${issue.message} (received: ${received})`;
      }).join(', ');
      throw new Error(`Validation failed: ${errorDetails}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to get funnel settings: ${error.message}`);
    }
    throw new Error("Couldn't retrieve the funnel settings. Please try again.");
  }
};
