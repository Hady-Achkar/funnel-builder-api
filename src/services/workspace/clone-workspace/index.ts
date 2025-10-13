import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors/http-errors";
import {
  CloneWorkspaceRequest,
  CloneWorkspaceResponse,
} from "../../../types/workspace/clone-workspace";
import { $Enums, UserPlan } from "../../../generated/prisma-client";

/**
 * Service for cloning workspaces in the affiliate marketplace
 * Called from subscription webhook after successful workspace purchase
 */
export class CloneWorkspaceService {
  /**
   * Clones a workspace with all its content for a new owner
   *
   * Includes: workspace properties, funnels, pages, themes, settings, role templates
   * Excludes: domains, addons, members, affiliate links, domain connections
   *
   * @param data - Clone request containing source workspace, new owner, payment, and plan type
   * @returns Response with cloned workspace details
   */
  static async cloneWorkspace(
    data: CloneWorkspaceRequest
  ): Promise<CloneWorkspaceResponse> {
    const prisma = getPrisma();

    // 1. VALIDATE PAYMENT EXISTS AND NOT ALREADY USED (Skip for testing if no paymentId)
    if (data.paymentId) {
      const payment = await prisma.payment.findUnique({
        where: { id: data.paymentId },
        include: { workspaceClone: true },
      });

      if (!payment) {
        throw new BadRequestError("Payment not found");
      }

      if (payment.workspaceClone) {
        throw new BadRequestError(
          "This payment has already been used for workspace cloning"
        );
      }
    }

    // 2. VALIDATE SOURCE WORKSPACE EXISTS
    const sourceWorkspace = await prisma.workspace.findUnique({
      where: { id: data.sourceWorkspaceId },
      include: {
        funnels: {
          include: {
            pages: {
              orderBy: { order: "asc" },
            },
            settings: true,
            activeTheme: true,
          },
        },
        rolePermTemplates: true,
      },
    });

    if (!sourceWorkspace) {
      throw new BadRequestError("Source workspace not found");
    }

    // 3. VALIDATE NEW OWNER EXISTS
    const newOwner = await prisma.user.findUnique({
      where: { id: data.newOwnerId },
    });

    if (!newOwner) {
      throw new BadRequestError("New owner not found");
    }

    // 4. GENERATE UNIQUE SLUG
    const baseSlug = sourceWorkspace.slug;
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (true) {
      const exists = await prisma.workspace.findUnique({
        where: { slug: uniqueSlug },
      });

      if (!exists) {
        break;
      }

      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;

      if (counter > 10000) {
        throw new Error(`Unable to generate unique slug for: ${baseSlug}`);
      }
    }

    // 5. CLONE WORKSPACE IN TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // Create cloned workspace
      const clonedWorkspace = await tx.workspace.create({
        data: {
          name: sourceWorkspace.name,
          slug: uniqueSlug,
          ownerId: data.newOwnerId,
          description: sourceWorkspace.description,
          settings: sourceWorkspace.settings,
          image: sourceWorkspace.image,
          status: "ACTIVE",
          planType: data.planType,
        },
      });

      // Copy role permission templates
      if (sourceWorkspace.rolePermTemplates.length > 0) {
        for (const template of sourceWorkspace.rolePermTemplates) {
          await tx.workspaceRolePermTemplate.create({
            data: {
              workspaceId: clonedWorkspace.id,
              role: template.role,
              permissions: template.permissions,
            },
          });
        }
      }

      // Copy all funnels with their content
      for (const sourceFunnel of sourceWorkspace.funnels) {
        // 1. Handle theme (GLOBAL themes are shared, CUSTOM themes are duplicated)
        let newThemeId = null;
        if (sourceFunnel.activeTheme) {
          if (sourceFunnel.activeTheme.type === $Enums.ThemeType.GLOBAL) {
            // GLOBAL themes are shared across funnels - use same themeId
            newThemeId = sourceFunnel.activeTheme.id;
          } else {
            // CUSTOM themes are duplicated for the cloned funnel
            const newTheme = await tx.theme.create({
              data: {
                name: sourceFunnel.activeTheme.name,
                backgroundColor: sourceFunnel.activeTheme.backgroundColor,
                textColor: sourceFunnel.activeTheme.textColor,
                buttonColor: sourceFunnel.activeTheme.buttonColor,
                buttonTextColor: sourceFunnel.activeTheme.buttonTextColor,
                borderColor: sourceFunnel.activeTheme.borderColor,
                optionColor: sourceFunnel.activeTheme.optionColor,
                fontFamily: sourceFunnel.activeTheme.fontFamily,
                borderRadius: sourceFunnel.activeTheme.borderRadius,
                type: $Enums.ThemeType.CUSTOM,
                funnelId: null, // Will be updated after funnel creation
              },
            });
            newThemeId = newTheme.id;
          }
        }

        // 2. Create funnel (keep same name and slug)
        const newFunnel = await tx.funnel.create({
          data: {
            name: sourceFunnel.name,
            slug: sourceFunnel.slug,
            status: sourceFunnel.status,
            workspaceId: clonedWorkspace.id,
            createdBy: data.newOwnerId,
            activeThemeId: newThemeId,
          },
        });

        // Update CUSTOM theme to link it to the funnel (GLOBAL themes don't have funnelId)
        if (newThemeId && sourceFunnel.activeTheme?.type === $Enums.ThemeType.CUSTOM) {
          await tx.theme.update({
            where: { id: newThemeId },
            data: { funnelId: newFunnel.id },
          });
        }

        // 3. Copy funnel settings
        if (sourceFunnel.settings) {
          // Password protection: Remove for BUSINESS plan
          const shouldRemovePassword = data.planType === UserPlan.BUSINESS;

          await tx.funnelSettings.create({
            data: {
              funnelId: newFunnel.id,
              defaultSeoTitle: sourceFunnel.settings.defaultSeoTitle,
              defaultSeoDescription: sourceFunnel.settings.defaultSeoDescription,
              defaultSeoKeywords: sourceFunnel.settings.defaultSeoKeywords,
              favicon: sourceFunnel.settings.favicon,
              ogImage: sourceFunnel.settings.ogImage,
              googleAnalyticsId: null, // Clear tracking IDs
              facebookPixelId: null, // Clear pixel IDs
              customTrackingScripts: sourceFunnel.settings.customTrackingScripts,
              enableCookieConsent: sourceFunnel.settings.enableCookieConsent,
              cookieConsentText: sourceFunnel.settings.cookieConsentText,
              privacyPolicyUrl: sourceFunnel.settings.privacyPolicyUrl,
              termsOfServiceUrl: sourceFunnel.settings.termsOfServiceUrl,
              language: sourceFunnel.settings.language,
              timezone: sourceFunnel.settings.timezone,
              dateFormat: sourceFunnel.settings.dateFormat,
              isPasswordProtected: shouldRemovePassword
                ? false
                : sourceFunnel.settings.isPasswordProtected,
              passwordHash: shouldRemovePassword
                ? null
                : sourceFunnel.settings.passwordHash,
            },
          });
        }

        // 4. Copy all pages (visits reset to 0 by default)
        for (const sourcePage of sourceFunnel.pages) {
          await tx.page.create({
            data: {
              name: sourcePage.name,
              content: sourcePage.content,
              order: sourcePage.order,
              linkingId: sourcePage.linkingId,
              funnelId: newFunnel.id,
              type: sourcePage.type,
              seoTitle: sourcePage.seoTitle,
              seoDescription: sourcePage.seoDescription,
              seoKeywords: sourcePage.seoKeywords,
              // visits field is auto-initialized to 0
            },
          });
        }
      }

      // Create WorkspaceClone tracking record (skip if no paymentId for testing)
      let cloneRecord = null;
      if (data.paymentId) {
        cloneRecord = await tx.workspaceClone.create({
          data: {
            sourceWorkspaceId: data.sourceWorkspaceId,
            clonedWorkspaceId: clonedWorkspace.id,
            sellerId: sourceWorkspace.ownerId,
            buyerId: data.newOwnerId,
            paymentId: data.paymentId,
          },
        });
      }

      return {
        clonedWorkspace,
        cloneRecord,
      };
    });

    // 6. RETURN RESPONSE
    return {
      message: "Workspace cloned successfully",
      clonedWorkspaceId: result.clonedWorkspace.id,
      clonedWorkspace: {
        id: result.clonedWorkspace.id,
        name: result.clonedWorkspace.name,
        slug: result.clonedWorkspace.slug,
        planType: result.clonedWorkspace.planType,
      },
      cloneRecordId: result.cloneRecord !== null ? result.cloneRecord.id : 0,
    };
  }
}
