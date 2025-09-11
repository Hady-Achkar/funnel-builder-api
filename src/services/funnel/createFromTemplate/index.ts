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

      // Create theme
      const theme = await tx.theme.create({ 
        data: { 
          funnelId: funnel.id 
        } 
      });

      // Update funnel with theme
      const funnelWithTheme = await tx.funnel.update({
        where: { id: funnel.id },
        data: { themeId: theme.id },
        include: {
          theme: true,
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

    // Cache management
    try {
      // Cache the individual funnel with full data including pages (without content)
      const fullFunnelCacheKey = `workspace:${workspace.id}:funnel:${result.funnel.id}:full`;
      const pagesWithoutContent = result.pages.map(page => ({
        id: page.id,
        name: page.name,
        order: page.order,
        linkingId: page.linkingId,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        seoKeywords: page.seoKeywords,
      }));

      const fullFunnelData = {
        id: result.funnel.id,
        name: result.funnel.name,
        slug: result.funnel.slug,
        status: result.funnel.status,
        workspaceId: result.funnel.workspaceId,
        createdBy: result.funnel.createdBy,
        themeId: result.funnel.themeId,
        createdAt: result.funnel.createdAt,
        updatedAt: result.funnel.updatedAt,
        theme: result.funnel.theme,
        pages: pagesWithoutContent,
      };
      await cacheService.set(fullFunnelCacheKey, fullFunnelData, { ttl: 0 });

      // Update the workspace's all funnels cache
      const allFunnelsCacheKey = `workspace:${workspace.id}:funnels:all`;
      const existingFunnels = await cacheService.get<any[]>(allFunnelsCacheKey) || [];
      
      // Add new funnel summary to the list
      const funnelSummary = {
        id: result.funnel.id,
        name: result.funnel.name,
        slug: result.funnel.slug,
        status: result.funnel.status,
        workspaceId: result.funnel.workspaceId,
        createdBy: result.funnel.createdBy,
        themeId: result.funnel.themeId,
        createdAt: result.funnel.createdAt,
        updatedAt: result.funnel.updatedAt,
        theme: result.funnel.theme,
      };
      
      const updatedFunnels = [...existingFunnels, funnelSummary];
      await cacheService.set(allFunnelsCacheKey, updatedFunnels, { ttl: 0 });

      // Cache each page content separately
      for (const page of result.pages) {
        const pageCacheKey = `funnel:${result.funnel.id}:page:${page.id}:full`;
        const pageData = {
          id: page.id,
          name: page.name,
          content: page.content,
          order: page.order,
          funnelId: page.funnelId,
          linkingId: page.linkingId,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoKeywords: page.seoKeywords,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        };
        await cacheService.set(pageCacheKey, pageData, { ttl: 0 });
      }

      // Invalidate old list caches
      await cacheService.del(
        `workspace:${workspace.id}:funnels:list`
      );

      await cacheService.del(
        `user:${userId}:workspace:${workspace.id}:funnels`
      );

      // Update template cache with new usage count
      const templateCacheKey = `template:${validatedParams.templateId}:full`;
      const cachedTemplate = await cacheService.get(templateCacheKey);
      
      if (cachedTemplate && typeof cachedTemplate === 'object') {
        const updatedTemplateCache = {
          ...cachedTemplate,
          usageCount: result.updatedTemplate.usageCount,
          updatedAt: new Date(),
        };
        await cacheService.set(templateCacheKey, updatedTemplateCache, { ttl: 0 });
      }
    } catch (cacheError) {
      console.warn("Cache update failed but funnel was created from template:", cacheError);
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