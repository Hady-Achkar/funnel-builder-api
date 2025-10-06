import { z } from "zod";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import {
  hasPermissionToCreateFunnel,
  generateLinkingIdMap,
  replaceLinkingIdsInContent,
  getNewLinkingIdForPage
} from "../../../helpers/funnel/createFromTemplate";
import {
  generateSlug,
  generateUniqueSlug
} from "../../../helpers/funnel/shared";
import {
  createFromTemplateParams,
  CreateFromTemplateParams,
  createFromTemplateRequest,
  CreateFromTemplateRequest,
  createFromTemplateResponse,
  CreateFromTemplateResponse,
} from "../../../types/funnel/createFromTemplate";
import { AllocationService } from "../../../utils/allocations";

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

    // Check workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { slug: validatedData.workspaceSlug },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (!workspace) {
      throw new Error("The selected workspace does not exist");
    }

    // Check workspace funnel allocation limit
    const canCreate = await AllocationService.canCreateFunnel(userId, workspace.id);
    if (!canCreate) {
      const allocations = await AllocationService.checkAllocations(userId, workspace.id);
      throw new Error(
        `You've reached the maximum of ${allocations.allocations.workspaceAllocations.maxFunnels} funnels for this workspace. Please upgrade your plan to create more funnels.`
      );
    }

    // Check permissions
    const isOwner = workspace.ownerId === userId;

    if (!isOwner) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userId,
            workspaceId: workspace.id,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!member) {
        throw new Error(
          `You don't have access to the ${workspace.name} workspace. Please ask the workspace owner to invite you.`
        );
      }

      const canCreateFunnel = hasPermissionToCreateFunnel(
        member.role,
        member.permissions
      );

      if (!canCreateFunnel) {
        throw new Error(
          `You don't have permission to create funnels in this workspace. Please contact your workspace admin.`
        );
      }
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

    // Generate slug based on name or user-provided slug
    let slug: string;
    
    if (validatedData.slug) {
      // User provided a slug, make it unique
      slug = await generateUniqueSlug(validatedData.slug, workspace.id);
    } else {
      // Auto-generate slug from name
      try {
        const baseSlug = generateSlug(validatedData.name);
        slug = await generateUniqueSlug(baseSlug, workspace.id);
      } catch (slugError) {
        // If slug generation fails due to invalid characters, throw user-friendly error
        if (slugError instanceof Error && slugError.message.includes("invalid characters")) {
          throw new Error("Funnel name contains invalid characters. Please use letters, numbers, spaces, and hyphens only.");
        }
        throw slugError;
      }
    }

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