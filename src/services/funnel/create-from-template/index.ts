import { getPrisma } from "../../../lib/prisma";
import {
  CreateFunnelFromTemplateRequest,
  CreateFunnelFromTemplateResponse,
} from "../../../types/funnel/create-from-template";
import { generateSlug } from "../../../utils/funnel-utils/generate-slug";
import { generateUniqueName } from "../create/utils/generateUniqueName";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import { WorkspaceFunnelAllocations } from "../../../utils/allocations/workspace-funnel-allocations";
import { cacheService } from "../../cache/cache.service";
import { encrypt } from "../../funnel-settings/lock-funnel/utils/encryption";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors";
import { $Enums } from "../../../generated/prisma-client";
import {
  replaceServerIdsInContent,
  ServerIdMap,
} from "../../../utils/funnel-utils/server-id-replacement";

const DEFAULT_FUNNEL_PASSWORD =
  process.env.DEFAULT_FUNNEL_PASSWORD || "FunnelDefault123!";

interface CreateFunnelFromTemplateParams {
  userId: number;
  data: CreateFunnelFromTemplateRequest;
}

export class CreateFunnelFromTemplateService {
  static async create({
    userId,
    data,
  }: CreateFunnelFromTemplateParams): Promise<CreateFunnelFromTemplateResponse> {
    try {
      const prisma = getPrisma();

      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Validate workspace exists and get allocation data + status
      const workspace = await prisma.workspace.findUnique({
        where: { slug: data.workspaceSlug },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          ownerId: true,
          owner: {
            select: {
              plan: true,
              addOns: true,
            },
          },
        },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Check permission using centralized PermissionManager
      const permissionCheck = await PermissionManager.can({
        userId,
        workspaceId: workspace.id,
        action: PermissionAction.CREATE_FUNNEL,
      });

      if (!permissionCheck.allowed) {
        throw new ForbiddenError(
          permissionCheck.reason ||
            "You don't have permission to create funnels in this workspace"
        );
      }

      // Check funnel allocation limit
      const currentFunnelCount = await prisma.funnel.count({
        where: { workspaceId: workspace.id },
      });

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

        throw new BadRequestError(
          `You've reached the maximum of ${summary.totalAllocation} ${
            summary.totalAllocation === 1 ? "funnel" : "funnels"
          } for this workspace. To create more funnels, upgrade your plan or add extra funnel slots.`
        );
      }

      // Validate template exists by slug, is active, and is public
      const template = await prisma.template.findUnique({
        where: { slug: data.templateSlug },
        include: {
          pages: {
            orderBy: { order: "asc" },
          },
          theme: true,
          forms: true,
          insights: true,
        },
      });

      if (!template) {
        throw new NotFoundError("Template not found");
      }

      if (!template.isActive) {
        throw new BadRequestError("Template is not active");
      }

      if (!template.isPublic) {
        throw new BadRequestError("Template is not public");
      }

      if (!template.pages || template.pages.length === 0) {
        throw new BadRequestError(
          "Cannot create funnel from a template with no pages"
        );
      }

      // Determine funnel name (use provided or fallback to template name)
      const baseName = data.name || template.name;
      const uniqueName = await generateUniqueName(baseName, workspace.id);

      // Generate unique slug (use provided or fallback to template slug)
      const baseSlug = data.slug || template.slug;
      const uniqueSlug = await generateSlug(prisma, baseSlug, workspace.id);

      // Determine password protection based on workspace status
      let isPasswordProtected = false;
      let passwordHash: string | null = null;

      if (workspace.status === $Enums.WorkspaceStatus.DRAFT) {
        isPasswordProtected = true;
        passwordHash = encrypt(DEFAULT_FUNNEL_PASSWORD);
      }

      // Create funnel and pages in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the funnel
        const funnel = await tx.funnel.create({
          data: {
            name: uniqueName,
            slug: uniqueSlug,
            status: $Enums.FunnelStatus.DRAFT,
            workspaceId: workspace.id,
            createdBy: userId,
          },
        });

        // Create custom theme linked to funnel (copy from template theme or use defaults)
        const theme = await tx.theme.create({
          data: {
            funnelId: funnel.id,
            type: $Enums.ThemeType.CUSTOM,
            name: template.theme?.name ?? "Default Theme",
            backgroundColor: template.theme?.backgroundColor ?? "#FFFFFF",
            textColor: template.theme?.textColor ?? "#0d1911",
            buttonColor: template.theme?.buttonColor ?? "#3c724b",
            buttonTextColor: template.theme?.buttonTextColor ?? "#FFFFFF",
            borderColor: template.theme?.borderColor ?? "#f0f0f0",
            optionColor: template.theme?.optionColor ?? "#EFFFF3",
            fontFamily: template.theme?.fontFamily ?? "Inter, sans-serif",
            borderRadius: template.theme?.borderRadius ?? $Enums.BorderRadius.SOFT,
          },
        });

        // Set the active theme for the funnel
        await tx.funnel.update({
          where: { id: funnel.id },
          data: { activeThemeId: theme.id },
        });

        // Create funnel settings with password protection if workspace is DRAFT
        await tx.funnelSettings.create({
          data: {
            funnelId: funnel.id,
            defaultSeoTitle: null,
            defaultSeoDescription: null,
            defaultSeoKeywords: null,
            favicon: null,
            ogImage: null,
            googleAnalyticsId: null,
            facebookPixelId: null,
            cookieConsentText: null,
            privacyPolicyUrl: null,
            termsOfServiceUrl: null,
            isPasswordProtected,
            passwordHash,
          },
        });

        // Duplicate forms from template and build ID mapping
        const formIdMap = new Map<number, number>();
        for (const form of template.forms) {
          const newForm = await tx.form.create({
            data: {
              name: form.name,
              description: form.description,
              formContent: form.formContent,
              isActive: form.isActive,
              funnelId: funnel.id,
              // Webhooks are NOT copied - user should configure separately
              webhookUrl: null,
              webhookEnabled: false,
              webhookHeaders: {},
              webhookSecret: null,
            },
          });
          formIdMap.set(form.id, newForm.id);
        }

        // Duplicate insights from template and build ID mapping
        const insightIdMap = new Map<number, number>();
        for (const insight of template.insights) {
          const newInsight = await tx.insight.create({
            data: {
              type: insight.type,
              name: insight.name,
              description: insight.description,
              content: insight.content,
              settings: insight.settings,
              funnelId: funnel.id,
            },
          });
          insightIdMap.set(insight.id, newInsight.id);
        }

        // Build server ID map for content replacement
        const serverIdMap: ServerIdMap = {
          forms: formIdMap,
          insights: insightIdMap,
        };

        // Create pages from template pages with server ID replacement
        const pagesData = template.pages.map((templatePage) => ({
          funnelId: funnel.id,
          name: templatePage.name,
          content: replaceServerIdsInContent(templatePage.content, serverIdMap),
          order: templatePage.order,
          type: templatePage.type,
          linkingId: templatePage.linkingId,
          seoTitle: templatePage.seoTitle,
          seoDescription: templatePage.seoDescription,
          seoKeywords: templatePage.seoKeywords,
        }));

        await tx.page.createMany({
          data: pagesData,
        });

        // Increment template usage count
        await tx.template.update({
          where: { id: template.id },
          data: {
            usageCount: {
              increment: 1,
            },
          },
        });

        return funnel;
      });

      // Invalidate caches
      try {
        await cacheService.del(`workspace:${workspace.id}:funnels:all`);
        await cacheService.del(`workspace:${workspace.id}:funnels:list`);
        await cacheService.del(
          `user:${userId}:workspace:${workspace.id}:funnels`
        );
      } catch (cacheError) {
        console.warn(
          "Cache invalidation failed but funnel was created from template:",
          cacheError
        );
      }

      return {
        message: `Funnel created successfully from template in workspace ${workspace.name}`,
        funnelId: result.id,
        funnelSlug: result.slug,
      };
    } catch (error) {
      throw error;
    }
  }
}
