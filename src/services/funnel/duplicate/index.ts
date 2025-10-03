import {
  DuplicateFunnelRequest,
  DuplicateFunnelResponse,
} from "../../../types/funnel/duplicate";
import { getPrisma } from "../../../lib/prisma";
import { $Enums } from "../../../generated/prisma-client";
import { validateOriginalFunnel } from "./utils/validateOriginalFunnel";
import { validateTargetWorkspace } from "./utils/validateTargetWorkspace";
import { checkWorkspaceFunnelLimit } from "./utils/checkWorkspaceFunnelLimit";
import { validateUserPermissions } from "./utils/validateUserPermissions";
import { generateUniqueFunnelName } from "./utils/generateUniqueFunnelName";
import { generateLinkingIdMap } from "./utils/generateLinkingIdMap";
import { replaceLinkingIdsInContent } from "./utils/replaceLinkingIdsInContent";
import { getNewLinkingIdForPage } from "./utils/getNewLinkingIdForPage";
import { generateSlug } from "./utils/generateSlug";
import { generateUniqueSlug } from "./utils/generateUniqueSlug";

export const duplicateFunnel = async (
  funnelId: number,
  userId: number,
  data: DuplicateFunnelRequest
): Promise<{ response: DuplicateFunnelResponse; workspaceId: number }> => {
  try {
    const prisma = getPrisma();

    // Get the original funnel with all its data
    const originalFunnel = await validateOriginalFunnel(prisma, funnelId);

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
    await validateUserPermissions(
      prisma,
      userId,
      originalFunnel,
      targetWorkspaceId
    );

    // Check against fixed workspace limit of 3 funnels
    await checkWorkspaceFunnelLimit(prisma, targetWorkspaceId);

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
      const baseSlug = generateSlug(finalFunnelName);
      const uniqueSlug = await generateUniqueSlug(baseSlug, targetWorkspaceId);

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
        },
      });

      return { funnel: newFunnelWithSettings, pages: createdPages };
    });

    const response: DuplicateFunnelResponse = {
      message: "Funnel duplicated successfully",
      funnelId: result.funnel!.id,
    };

    return { response, workspaceId: targetWorkspaceId };
  } catch (error) {
    throw error;
  }
};