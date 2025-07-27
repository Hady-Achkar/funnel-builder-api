import { PrismaClient, Funnel, Page } from '../generated/prisma-client';
import { templateService } from './template.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface CreateFunnelFromTemplateData {
  templateId: number;
  userId: number;
  funnelName: string;
  customizations?: {
    replaceText?: Record<string, string>;
    replaceImages?: Record<string, string>;
    pageNames?: Record<number, string>;
  };
}

interface CreateFunnelFromTemplateResult {
  funnel: Funnel;
  pages: Page[];
  linkingMap: Record<string, string>; // Old linking ID -> New linking ID
}

interface PageLinkingContext {
  oldLinkingId: string;
  newLinkingId: string;
  templatePageId: number;
  newPageId: number;
}

export class FunnelFromTemplateService {
  async createFunnelFromTemplate(
    data: CreateFunnelFromTemplateData
  ): Promise<CreateFunnelFromTemplateResult> {
    // Get template with all pages
    const template = await prisma.template.findUnique({
      where: { id: data.templateId, isActive: true },
      include: {
        pages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (!template.isPublic) {
      throw new Error('Template is not publicly available');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create funnel
    const funnel = await prisma.funnel.create({
      data: {
        name: data.funnelName,
        status: 'draft',
        userId: data.userId,
        templateId: data.templateId,
      },
    });

    // Generate linking context for all pages first to avoid circular dependencies
    const linkingContexts: PageLinkingContext[] = template.pages.map((templatePage) => {
      const newLinkingId = uuidv4();
      const settings = templatePage.settings as any;
      const oldLinkingId = templatePage.linkingIdPrefix 
        ? `${templatePage.linkingIdPrefix}-${templatePage.order}`
        : settings?.originalLinkingId || uuidv4();

      return {
        oldLinkingId,
        newLinkingId,
        templatePageId: templatePage.id,
        newPageId: 0, // Will be filled after page creation
      };
    });

    // Create linking map
    const linkingMap: Record<string, string> = {};
    linkingContexts.forEach(context => {
      linkingMap[context.oldLinkingId] = context.newLinkingId;
    });

    // Create pages with proper linking
    const createdPages: Page[] = [];
    for (let i = 0; i < template.pages.length; i++) {
      const templatePage = template.pages[i];
      const context = linkingContexts[i];

      // Get custom page name if provided
      const pageName = data.customizations?.pageNames?.[templatePage.id] 
        || templatePage.name;

      // Process content to replace linking IDs and apply customizations
      let processedContent = templatePage.content || '';
      
      // Replace all old linking IDs with new ones in content
      Object.entries(linkingMap).forEach(([oldId, newId]) => {
        processedContent = processedContent.replace(new RegExp(oldId, 'g'), newId);
      });

      // Apply text replacements if provided
      if (data.customizations?.replaceText) {
        Object.entries(data.customizations.replaceText).forEach(([search, replace]) => {
          processedContent = processedContent.replace(new RegExp(search, 'g'), replace);
        });
      }

      // Apply image replacements if provided
      if (data.customizations?.replaceImages) {
        Object.entries(data.customizations.replaceImages).forEach(([oldUrl, newUrl]) => {
          processedContent = processedContent.replace(new RegExp(oldUrl, 'g'), newUrl);
        });
      }

      // Create the page
      const page = await prisma.page.create({
        data: {
          name: pageName,
          content: processedContent,
          order: templatePage.order,
          linkingId: context.newLinkingId,
          funnelId: funnel.id,
        },
      });

      // Update context with created page ID
      context.newPageId = page.id;
      createdPages.push(page);
    }

    // Increment template usage count
    await templateService.incrementUsageCount(data.templateId);

    return {
      funnel,
      pages: createdPages,
      linkingMap,
    };
  }

  async getTemplatePreview(templateId: number): Promise<{
    template: any;
    pageStructure: Array<{
      id: number;
      name: string;
      order: number;
      hasContent: boolean;
      estimatedElements: number;
    }>;
  }> {
    const template = await templateService.getTemplateById(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    // Get detailed page information
    const templatePages = await prisma.templatePages.findMany({
      where: { templateId },
      orderBy: { order: 'asc' },
    });

    const pageStructure = templatePages.map(page => ({
      id: page.id,
      name: page.name,
      order: page.order,
      hasContent: !!(page.content && page.content.length > 0),
      estimatedElements: this.estimateContentElements(page.content || ''),
    }));

    return {
      template,
      pageStructure,
    };
  }

  async duplicateFunnelAsTemplate(
    funnelId: number,
    userId: number,
    templateData: {
      name: string;
      description?: string;
      categoryId: number;
      tags?: string[];
    }
  ): Promise<CreateFunnelFromTemplateResult> {
    // This is essentially creating a template and then immediately creating a funnel from it
    // Useful for users who want to duplicate their own funnels

    // First verify the user has access to the funnel
    const funnel = await prisma.funnel.findFirst({
      where: {
        id: funnelId,
        userId,
      },
    });

    if (!funnel) {
      throw new Error('Funnel not found or access denied');
    }

    // Create template from funnel (admin only for now, but this could be extended)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isAdmin) {
      throw new Error('Template creation requires admin privileges');
    }

    const templateResult = await templateService.createTemplateFromFunnel(userId, {
      ...templateData,
      funnelId,
      isPublic: false, // Private template for duplication
    });

    // Now create a new funnel from the template
    return this.createFunnelFromTemplate({
      templateId: templateResult.template.id,
      userId,
      funnelName: `${templateData.name} (Copy)`,
    });
  }

  private estimateContentElements(content: string): number {
    if (!content) return 0;
    
    // Simple heuristic to estimate content complexity
    const htmlTags = (content.match(/<[^>]+>/g) || []).length;
    const textBlocks = content.split(/\s+/).filter(word => word.length > 0).length;
    
    return Math.max(1, Math.floor((htmlTags + textBlocks) / 20));
  }

  async validateTemplate(templateId: number): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        pages: {
          orderBy: { order: 'asc' },
        },
        category: true,
      },
    });

    if (!template) {
      errors.push('Template not found');
      return { isValid: false, errors, warnings };
    }

    // Check if template has pages
    if (template.pages.length === 0) {
      errors.push('Template must have at least one page');
    }

    // Check for sequential page ordering
    const expectedOrders = template.pages.map((_, index) => index + 1);
    const actualOrders = template.pages.map(page => page.order);
    if (JSON.stringify(expectedOrders) !== JSON.stringify(actualOrders.sort((a, b) => a - b))) {
      warnings.push('Page ordering is not sequential');
    }

    // Check for pages with empty content
    const emptyPages = template.pages.filter(page => !page.content || page.content.trim().length === 0);
    if (emptyPages.length > 0) {
      warnings.push(`${emptyPages.length} page(s) have empty content`);
    }

    // Check category validity
    if (!template.category?.isActive) {
      errors.push('Template category is inactive or missing');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export const funnelFromTemplateService = new FunnelFromTemplateService();