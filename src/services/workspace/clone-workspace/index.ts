import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  InternalServerError,
  BadGatewayError,
} from "../../../errors/http-errors";
import {
  CloneWorkspaceRequest,
  CloneWorkspaceResponse,
} from "../../../types/workspace/clone-workspace";
import {
  $Enums,
  UserPlan,
  DomainType,
  DomainStatus,
  SslStatus,
} from "../../../generated/prisma-client";
import { createARecord } from "../../domain/create-subdomain/utils/create-a-record";

export class CloneWorkspaceService {
  static async cloneWorkspace(
    data: CloneWorkspaceRequest
  ): Promise<CloneWorkspaceResponse> {
    try {
      const prisma = getPrisma();

    // 1. VALIDATE PAYMENT EXISTS AND NOT ALREADY USED
    const payment = await prisma.payment.findFirst({
      where: { transactionId: data.paymentId },
      include: { workspaceClone: true },
    });

    if (!payment) {
      throw new BadRequestError(
        "We couldn't find a payment with this transaction ID. Please verify your payment information"
      );
    }

    if (payment.workspaceClone) {
      throw new BadRequestError(
        "This payment has already been used to clone a workspace and cannot be used again"
      );
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
      select: {
        id: true,
        lastName: true,
        firstName: true,
      },
    });

    if (!newOwner) {
      throw new BadRequestError("New owner not found");
    }

    // 4. GENERATE UNIQUE SLUG BASED ON NEW OWNER'S LAST NAME
    // Use lastName as base slug, fallback to firstName if no lastName
    const baseSlug = (newOwner.lastName || newOwner.firstName || "workspace")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    let uniqueSlug = baseSlug;
    let counter = 2; // Start from 2 for incremental numbers

    while (true) {
      const exists = await prisma.workspace.findUnique({
        where: { slug: uniqueSlug },
      });

      if (!exists) {
        break;
      }

      // If slug exists, append -2, -3, -4, etc.
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
        if (
          newThemeId &&
          sourceFunnel.activeTheme?.type === $Enums.ThemeType.CUSTOM
        ) {
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
              defaultSeoDescription:
                sourceFunnel.settings.defaultSeoDescription,
              defaultSeoKeywords: sourceFunnel.settings.defaultSeoKeywords,
              favicon: sourceFunnel.settings.favicon,
              ogImage: sourceFunnel.settings.ogImage,
              googleAnalyticsId: null, // Clear tracking IDs
              facebookPixelId: null, // Clear pixel IDs
              customTrackingScripts:
                sourceFunnel.settings.customTrackingScripts,
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

      // Create WorkspaceClone tracking record
      const cloneRecord = await tx.workspaceClone.create({
        data: {
          sourceWorkspaceId: data.sourceWorkspaceId,
          clonedWorkspaceId: clonedWorkspace.id,
          sellerId: sourceWorkspace.ownerId,
          buyerId: data.newOwnerId,
          paymentId: payment.id, // Use the database payment ID
        },
      });

      return {
        clonedWorkspace,
        cloneRecord,
      };
    });

    // 6. CREATE WORKSPACE SUBDOMAIN ON DIGITALSITE.COM
      const workspaceDomain = process.env.WORKSPACE_DOMAIN;
      if (!workspaceDomain) {
        throw new InternalServerError("WORKSPACE_DOMAIN is not configured");
      }

      const workspaceHostname = `${uniqueSlug}.${workspaceDomain}`;

      try {
        // Get Cloudflare configuration for WORKSPACE domain (digitalsite.com)
        const workspaceZoneId = process.env.WORKSPACE_ZONE_ID;
        if (!workspaceZoneId) {
          throw new InternalServerError("WORKSPACE_ZONE_ID is not configured");
        }

        const targetIp = "74.234.194.84";

        // Create A record in Cloudflare for workspace subdomain
        const aRecord = await createARecord(uniqueSlug, workspaceZoneId, targetIp);

        // Create Domain record in database
        await prisma.domain.create({
          data: {
            hostname: workspaceHostname,
            type: DomainType.SUBDOMAIN,
            status: DomainStatus.ACTIVE,
            sslStatus: SslStatus.ACTIVE,
            workspaceId: result.clonedWorkspace.id,
            createdBy: data.newOwnerId,
            cloudflareRecordId: aRecord.id,
            cloudflareZoneId: workspaceZoneId,
            lastVerifiedAt: new Date(),
          },
        });

        console.log(
          `✅ Cloned workspace subdomain created: ${workspaceHostname}`
        );
      } catch (error: any) {
        const errMsg =
          error.response?.data?.errors?.[0]?.message || error.message;
        console.error(
          `[Workspace Clone] Failed to create subdomain: ${errMsg}`,
          {
            stack: error.stack,
          }
        );

        // Clean up: delete the cloned workspace since subdomain creation failed
        await prisma.workspace.delete({
          where: { id: result.clonedWorkspace.id },
        });

        throw new BadGatewayError(
          "We couldn't set up your workspace address. Please try again or contact support if the issue persists."
        );
      }

      // 7. RETURN RESPONSE
      return {
        message: "Workspace cloned successfully",
        clonedWorkspaceId: result.clonedWorkspace.id,
        clonedWorkspace: {
          id: result.clonedWorkspace.id,
          name: result.clonedWorkspace.name,
          slug: result.clonedWorkspace.slug,
          planType: result.clonedWorkspace.planType,
        },
        cloneRecordId: result.cloneRecord.id,
      };
    } catch (error: unknown) {
      // Re-throw known errors as-is (already user-friendly)
      if (
        error instanceof BadRequestError ||
        error instanceof InternalServerError ||
        error instanceof BadGatewayError
      ) {
        throw error;
      }

      // Log unexpected errors
      console.error("[Workspace Clone] Unexpected error:", error);

      // Throw generic error for unexpected failures
      throw new InternalServerError(
        "An unexpected error occurred while cloning the workspace. Please try again."
      );
    }
  }
}
