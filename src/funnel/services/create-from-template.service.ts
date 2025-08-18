import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { 
  CreateFunnelFromTemplateRequest, 
  CreateFunnelFromTemplateResponse,
  createFunnelFromTemplateRequest,
  createFunnelFromTemplateResponse 
} from "../types/create-from-template.types";
import { NotFoundError, BadRequestError } from "../../errors";
import { ZodError } from "zod";
import { 
  generateLinkingIdMap, 
  replaceLinkingIdsInContent, 
  getNewLinkingIdForPage 
} from "../helpers/linking-id-replacement.helper";

export const createFunnelFromTemplate = async (
  params: CreateFunnelFromTemplateRequest & { userId: number }
): Promise<CreateFunnelFromTemplateResponse> => {
  try {
    const validatedParams = createFunnelFromTemplateRequest.parse(params);
    const { templateId, name } = validatedParams;
    const { userId } = params;
    
    const prisma = getPrisma();
    
    // Get template with all pages
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        pages: {
          orderBy: { order: "asc" }
        }
      }
    });
    
    if (!template) {
      throw new NotFoundError("Template not found");
    }
    
    if (!template.isActive || !template.isPublic) {
      throw new NotFoundError("Template is not available");
    }
    
    // Generate linking ID mapping for all template pages
    const linkingMap = generateLinkingIdMap(template.pages);
    
    // Create funnel and pages in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the funnel
      const newFunnel = await tx.funnel.create({
        data: {
          name,
          userId,
          status: "DRAFT"
        }
      });

      // Create default theme
      const theme = await tx.theme.create({ data: {} });

      // Update funnel with theme
      const funnelWithTheme = await tx.funnel.update({
        where: { id: newFunnel.id },
        data: { themeId: theme.id },
        include: { theme: true }
      });
      
      // Create pages with updated linking IDs
      const createdPages = [];
      
      for (const templatePage of template.pages) {
        // Replace linking IDs in content
        const updatedContent = replaceLinkingIdsInContent(templatePage.content, linkingMap);
        
        // Get new linking ID for this page
        const newLinkingId = getNewLinkingIdForPage(templatePage.linkingId, linkingMap);
        
        const newPage = await tx.page.create({
          data: {
            name: templatePage.name,
            content: updatedContent,
            order: templatePage.order,
            linkingId: newLinkingId,
            seoTitle: templatePage.seoTitle,
            seoDescription: templatePage.seoDescription,
            seoKeywords: templatePage.seoKeywords,
            funnelId: funnelWithTheme.id
          }
        });
        
        createdPages.push(newPage);
      }
      
      return { funnel: funnelWithTheme, pages: createdPages };
    });
    
    // Cache the funnel data
    try {
      const { funnel, pages } = result;
      
      // Cache full funnel data
      const fullCacheData = {
        id: funnel.id,
        name: funnel.name,
        status: funnel.status,
        userId: funnel.userId,
        themeId: funnel.themeId,
        createdAt: funnel.createdAt,
        updatedAt: funnel.updatedAt,
        theme: funnel.theme,
        pages: pages.map(page => ({
          id: page.id,
          name: page.name,
          order: page.order,
          linkingId: page.linkingId,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoKeywords: page.seoKeywords,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt
        }))
      };
      
      await cacheService.set(`user:${userId}:funnel:${funnel.id}:full`, fullCacheData, { ttl: 0 });
      
      // Cache summary funnel data
      const summaryCacheData = {
        id: funnel.id,
        name: funnel.name,
        status: funnel.status,
        userId: funnel.userId,
        themeId: funnel.themeId,
        createdAt: funnel.createdAt,
        updatedAt: funnel.updatedAt,
        theme: funnel.theme
      };
      
      await cacheService.set(`user:${userId}:funnel:${funnel.id}:summary`, summaryCacheData, { ttl: 0 });
      
      // Cache each page
      for (const page of pages) {
        const pageCacheData = {
          id: page.id,
          name: page.name,
          content: page.content,
          order: page.order,
          linkingId: page.linkingId,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoKeywords: page.seoKeywords,
          funnelId: page.funnelId,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt
        };
        
        await cacheService.set(`user:${userId}:page:${page.id}:full`, pageCacheData, { ttl: 0 });
      }
      
    } catch (cacheError) {
      console.warn("Failed to cache funnel data:", cacheError);
    }
    
    const response = {
      message: "Funnel created successfully"
    };
    
    return createFunnelFromTemplateResponse.parse(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid request data";
      throw new BadRequestError(message);
    }
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    throw new Error(
      `Failed to create funnel from template: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};