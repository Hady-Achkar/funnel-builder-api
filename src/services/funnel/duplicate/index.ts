import {
  DuplicateFunnelRequest,
  DuplicateFunnelResponse,
} from "../../../types/funnel/duplicate";
import { getPrisma } from "../../../lib/prisma";
import { $Enums } from "../../../generated/prisma-client";
import { validateOriginalFunnel } from "./utils/validateOriginalFunnel";
import { validateTargetWorkspace } from "./utils/validateTargetWorkspace";
import { generateUniqueFunnelName } from "./utils/generateUniqueFunnelName";
import {
  generateLinkingIdMap,
  replaceLinkingIdsInContent,
  getNewLinkingIdForPage,
} from "../../../utils/funnel-utils/linking-id-replacement";
import { generateSlug } from "../../../utils/funnel-utils/generate-slug";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import { WorkspaceFunnelAllocations } from "../../../utils/allocations/workspace-funnel-allocations";

export const duplicateFunnel = async (
  userId: number,
  params: { workspaceSlug: string; funnelSlug: string },
  data: DuplicateFunnelRequest
): Promise<{ response: DuplicateFunnelResponse; workspaceId: number; workspaceSlug: string; funnelSlug: string }> => {
  try {
    const prisma = getPrisma();

    // Get the original funnel by slug
    const originalFunnel = await prisma.funnel.findFirst({
      where: {
        slug: params.funnelSlug,
        workspace: {
          slug: params.workspaceSlug,
        },
      },
      include: {
        pages: {
          orderBy: { order: "asc" },
        },
        activeTheme: true,
        settings: true,
        workspace: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    if (!originalFunnel) {
      throw new Error("Funnel not found");
    }

    // Determine target workspace (same workspace if not provided)
    let targetWorkspaceId = originalFunnel.workspaceId;

    if (data.workspaceSlug) {
      const targetWorkspaceBySlug = await validateTargetWorkspace(
        prisma,
        data.workspaceSlug
      );

      if (targetWorkspaceBySlug) {
        targetWorkspaceId = targetWorkspaceBySlug.id;
      }
    }

    // Validate user permissions
    // Check permission to view original funnel
    await PermissionManager.requirePermission({
      userId,
      workspaceId: originalFunnel.workspaceId,
      action: PermissionAction.VIEW_FUNNEL,
    });

    // If duplicating to a different workspace, check target workspace create permission
    if (targetWorkspaceId !== originalFunnel.workspaceId) {
      await PermissionManager.requirePermission({
        userId,
        workspaceId: targetWorkspaceId,
        action: PermissionAction.CREATE_FUNNEL,
      });
    }

    // Check workspace funnel limit using centralized allocation system
    // Get workspace with owner plan and add-ons
    const workspace = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
      select: {
        id: true,
        owner: {
          select: {
            plan: true,
            addOns: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new Error("Target workspace does not exist");
    }

    // Check current funnel count
    const currentFunnelCount = await prisma.funnel.count({
      where: { workspaceId: targetWorkspaceId },
    });

    // Check if workspace can create more funnels
    const canCreateFunnel = WorkspaceFunnelAllocations.canCreateFunnel(
      currentFunnelCount,
      {
        workspacePlanType: workspace.owner.plan,
        addOns: workspace.owner.addOns,
      }
    );

    if (!canCreateFunnel) {
      const summary = WorkspaceFunnelAllocations.getAllocationSummary(
        currentFunnelCount,
        {
          workspacePlanType: workspace.owner.plan,
          addOns: workspace.owner.addOns,
        }
      );

      throw new Error(
        `You've reached the maximum of ${summary.totalAllocation} ${
          summary.totalAllocation === 1 ? "funnel" : "funnels"
        } for this workspace. ` +
          `To duplicate more funnels, upgrade your plan or add extra funnel slots.`
      );
    }

    // Generate unique funnel name
    const finalFunnelName = await generateUniqueFunnelName(
      prisma,
      originalFunnel.name,
      targetWorkspaceId
    );

    // Generate new linking ID mapping for all pages
    const linkingMap = generateLinkingIdMap(originalFunnel.pages);

    // Duplicate funnel and pages in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create new custom theme (copy of original active theme or default)
      const newTheme = await tx.theme.create({
        data: {
          name: originalFunnel.activeTheme?.name ,
          backgroundColor:
            originalFunnel.activeTheme?.backgroundColor ,
          textColor: originalFunnel.activeTheme?.textColor ,
          buttonColor: originalFunnel.activeTheme?.buttonColor ,
          buttonTextColor:
            originalFunnel.activeTheme?.buttonTextColor ,
          borderColor: originalFunnel.activeTheme?.borderColor ,
          optionColor: originalFunnel.activeTheme?.optionColor ,
          fontFamily:
            originalFunnel.activeTheme?.fontFamily ,
          borderRadius: originalFunnel.activeTheme?.borderRadius,
          type: $Enums.ThemeType.CUSTOM,
          funnelId: null, // Will be set after funnel creation
        },
      });

      // Generate unique slug for duplicated funnel
      const uniqueSlug = await generateSlug(prisma, finalFunnelName, targetWorkspaceId);

      // Create the new funnel (always set status to DRAFT for duplicates)
      const newFunnel = await tx.funnel.create({
        data: {
          name: finalFunnelName,
          slug: uniqueSlug,
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: targetWorkspaceId,
          createdBy: userId,
          activeThemeId: newTheme.id,
        },
        include: {
          activeTheme: true,
        },
      });

      // Update theme to link it to the funnel
      await tx.theme.update({
        where: { id: newTheme.id },
        data: { funnelId: newFunnel.id },
      });

      // Duplicate funnel settings if they exist (excluding tracking IDs)
      if (originalFunnel.settings) {
        await tx.funnelSettings.create({
          data: {
            funnelId: newFunnel.id,
            defaultSeoTitle: originalFunnel.settings.defaultSeoTitle,
            defaultSeoDescription:
              originalFunnel.settings.defaultSeoDescription,
            defaultSeoKeywords: originalFunnel.settings.defaultSeoKeywords,
            favicon: originalFunnel.settings.favicon,
            ogImage: originalFunnel.settings.ogImage,
            googleAnalyticsId: null, // Don't copy tracking ID
            facebookPixelId: null, // Don't copy pixel ID
            customTrackingScripts:
              originalFunnel.settings.customTrackingScripts,
            enableCookieConsent: originalFunnel.settings.enableCookieConsent,
            cookieConsentText: originalFunnel.settings.cookieConsentText,
            privacyPolicyUrl: originalFunnel.settings.privacyPolicyUrl,
            termsOfServiceUrl: originalFunnel.settings.termsOfServiceUrl,
            language: originalFunnel.settings.language,
            timezone: originalFunnel.settings.timezone,
            dateFormat: originalFunnel.settings.dateFormat,
            isPasswordProtected: originalFunnel.settings.isPasswordProtected,
            passwordHash: originalFunnel.settings.passwordHash,
          },
        });
      }

      // Duplicate pages with updated linking IDs and content
      const createdPages = [];
      for (const originalPage of originalFunnel.pages) {
        const newLinkingId = getNewLinkingIdForPage(
          originalPage.linkingId,
          linkingMap
        );
        const updatedContent = replaceLinkingIdsInContent(
          originalPage.content,
          linkingMap
        );

        const newPage = await tx.page.create({
          data: {
            name: originalPage.name,
            content: updatedContent,
            order: originalPage.order,
            type: originalPage.type, // Preserve the original type
            funnelId: newFunnel.id,
            linkingId: newLinkingId,
            seoTitle: originalPage.seoTitle,
            seoDescription: originalPage.seoDescription,
            seoKeywords: originalPage.seoKeywords,
          },
        });

        createdPages.push(newPage);
      }

      // Fetch the new funnel with settings for the result
      const newFunnelWithSettings = await tx.funnel.findUnique({
        where: { id: newFunnel.id },
        include: {
          activeTheme: true,
          settings: true,
          workspace: {
            select: {
              slug: true,
            },
          },
        },
      });

      return { funnel: newFunnelWithSettings, pages: createdPages };
    });

    const response: DuplicateFunnelResponse = {
      message: "Funnel duplicated successfully",
      funnelId: result.funnel!.id,
    };

    return {
      response,
      workspaceId: targetWorkspaceId,
      workspaceSlug: result.funnel!.workspace.slug,
      funnelSlug: result.funnel!.slug,
    };
  } catch (error) {
    throw error;
  }
};