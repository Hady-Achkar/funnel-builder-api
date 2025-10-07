import { z } from "zod";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import {
  generateLinkingIdMap,
  replaceLinkingIdsInContent,
  getNewLinkingIdForPage
} from "../../../utils/funnel-utils/linking-id-replacement";
import { generateSlug } from "../../../utils/funnel-utils/generate-slug";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import { WorkspaceFunnelAllocations } from "../../../utils/allocations/workspace-funnel-allocations";
import {
  createFromTemplateParams,
  CreateFromTemplateParams,
  createFromTemplateRequest,
  CreateFromTemplateRequest,
  createFromTemplateResponse,
  CreateFromTemplateResponse,
} from "../../../types/funnel/createFromTemplate";

export const createFromTemplate = async (
  templateId: number,
  userId: number,
  data: Partial<CreateFromTemplateRequest>
): Promise<CreateFromTemplateResponse> => {
  let validatedParams: CreateFromTemplateParams;
  let validatedData: CreateFromTemplateRequest;

  try {
    if (!userId) throw new Error("User ID is required");

    validatedParams = createFromTemplateParams.parse({ templateId });
    validatedData = createFromTemplateRequest.parse(data);

    if (!validatedData.workspaceSlug) {
      throw new Error("Please select a workspace to create the funnel in");
    }

    const prisma = getPrisma();

    // Check workspace exists and get allocation data
    const workspace = await prisma.workspace.findUnique({
      where: { slug: validatedData.workspaceSlug },
      select: {
        id: true,
        name: true,
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
      throw new Error("The selected workspace does not exist");
    }

    // Check permission using centralized PermissionManager
    await PermissionManager.requirePermission({
      userId,
      workspaceId: workspace.id,
      action: PermissionAction.CREATE_FUNNEL,
    });

    // Check funnel allocation limit using centralized allocation system
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

      throw new Error(
        `You've reached the maximum of ${summary.totalAllocation} ${
          summary.totalAllocation === 1 ? "funnel" : "funnels"
        } for this workspace. ` +
          `To create more funnels, upgrade your plan or add extra funnel slots.`
      );
    }

    // Get template with all pages
    const template = await prisma.template.findUnique({
      where: { id: validatedParams.templateId },
      include: {
        pages: {
          orderBy: { order: "asc" }
        }
      }
    });
    
    if (!template) {
      throw new Error("Template not found");
    }
    
    if (!template.isActive || !template.isPublic) {
      throw new Error("Template is not available");
    }

    // Generate linking ID mapping for all template pages
    const linkingMap = generateLinkingIdMap(template.pages);

    // Generate unique slug from provided slug or name
    const slug = await generateSlug(
      prisma,
      validatedData.slug || validatedData.name,
      workspace.id
    );

    // Create funnel and pages in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the funnel
      const funnel = await tx.funnel.create({
        data: {
          name: validatedData.name,
          slug: slug,
          status: "DRAFT",
          workspaceId: workspace.id,
          createdBy: userId,
        },
      });

      // Create theme with funnelId to establish customTheme relation
      const theme = await tx.theme.create({
        data: {
          funnelId: funnel.id,
          type: 'CUSTOM',
        },
      });

      // Set the active theme for the funnel
      const funnelWithTheme = await tx.funnel.update({
        where: { id: funnel.id },
        data: { activeThemeId: theme.id },
        include: {
          activeTheme: true,
        },
      });

      // Create funnel settings
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
        },
      });

      // Create pages with updated linking IDs and content
      const createdPages = [];
      for (const templatePage of template.pages) {
        const newLinkingId = getNewLinkingIdForPage(templatePage.linkingId, linkingMap);
        const updatedContent = replaceLinkingIdsInContent(templatePage.content, linkingMap);
        
        const page = await tx.page.create({
          data: {
            name: templatePage.name,
            content: updatedContent,
            order: templatePage.order,
            type: templatePage.type, // Preserve the type from template
            funnelId: funnel.id,
            linkingId: newLinkingId,
            seoTitle: templatePage.seoTitle,
            seoDescription: templatePage.seoDescription,
            seoKeywords: templatePage.seoKeywords,
          },
        });
        
        createdPages.push(page);
      }

      // Increment template usage count
      const updatedTemplate = await tx.template.update({
        where: { id: validatedParams.templateId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
        select: {
          id: true,
          usageCount: true,
        },
      });

      return { funnel: funnelWithTheme, pages: createdPages, updatedTemplate };
    });

    // Invalidate caches
    try {
      await cacheService.del(`workspace:${workspace.id}:funnel:${result.funnel.id}:full`);
      await cacheService.del(`workspace:${workspace.id}:funnels:all`);
      await cacheService.del(`workspace:${workspace.id}:funnels:list`);
      await cacheService.del(`user:${userId}:workspace:${workspace.id}:funnels`);
    } catch (cacheError) {
      console.warn("Cache invalidation failed but funnel was created from template:", cacheError);
    }

    const response = {
      message: `Funnel created successfully from template in workspace ${workspace.name}`,
      funnelId: result.funnel.id,
    };

    return createFromTemplateResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }

    if (error instanceof Error) {
      // Check for Prisma unique constraint violation
      if (
        error.message.includes("Unique constraint failed") ||
        error.message.includes("duplicate key value") ||
        error.message.includes("P2002")
      ) {
        throw new Error(
          `A funnel with the name ${validatedData.name} already exists in this workspace. Please choose a different name.`
        );
      }

      throw new Error(`Failed to create funnel from template: ${error.message}`);
    }

    throw new Error("Couldn't create the funnel from template. Please try again.");
  }
};