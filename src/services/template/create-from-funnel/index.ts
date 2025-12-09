import { getPrisma } from "../../../lib/prisma";
import {
  CreateTemplateFromFunnelRequest,
  CreateTemplateFromFunnelResponse,
} from "../../../types/template/create-from-funnel";
import { transformSlug } from "./utils/transform-slug";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors";
import { ThemeType } from "../../../generated/prisma-client";
import {
  replaceServerIdsInContent,
  ServerIdMap,
} from "../../../utils/funnel-utils/server-id-replacement";

interface CreateTemplateFromFunnelParams {
  userId: number;
  data: CreateTemplateFromFunnelRequest;
}

export class CreateTemplateFromFunnelService {
  static async create({
    userId,
    data,
  }: CreateTemplateFromFunnelParams): Promise<CreateTemplateFromFunnelResponse> {
    try {
      const prisma = getPrisma();

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isAdmin: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (!user.isAdmin) {
        throw new ForbiddenError("Only administrators can create templates");
      }

      // Validate category exists
      const category = await prisma.templateCategory.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new NotFoundError("Template category not found");
      }

      // Validate workspace exists
      const workspace = await prisma.workspace.findUnique({
        where: { slug: data.workspaceSlug },
        select: { id: true },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Validate funnel exists and has pages (find by workspace + funnel slug)
      const funnel = await prisma.funnel.findFirst({
        where: {
          slug: data.funnelSlug,
          workspaceId: workspace.id,
        },
        include: {
          pages: {
            orderBy: { order: "asc" },
          },
          activeTheme: true,
          insights: true,
        },
      });

      // Fetch forms linked to the funnel (separate query since no relation exists)
      const originalForms = await prisma.form.findMany({
        where: { funnelId: funnel?.id },
      });

      if (!funnel) {
        throw new NotFoundError("Funnel not found");
      }

      if (!funnel.pages || funnel.pages.length === 0) {
        throw new BadRequestError(
          "Cannot create template from a funnel with no pages"
        );
      }

      // Transform and validate slug
      const transformedSlug = transformSlug(data.slug);

      // Check slug uniqueness
      const existingTemplate = await prisma.template.findUnique({
        where: { slug: transformedSlug },
        select: { id: true },
      });

      if (existingTemplate) {
        throw new BadRequestError("A template with this slug already exists");
      }

      // Create template with pages, theme, and images in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the template (inactive and private by default)
        const template = await tx.template.create({
          data: {
            name: data.name,
            slug: transformedSlug,
            description: data.description,
            categoryId: data.categoryId,
            tags: data.tags ?? [],
            isActive: false,
            isPublic: false,
            createdByUserId: userId,
          },
        });

        // Duplicate funnel's active theme for the template
        if (funnel.activeTheme) {
          await tx.theme.create({
            data: {
              name: funnel.activeTheme.name,
              backgroundColor: funnel.activeTheme.backgroundColor,
              textColor: funnel.activeTheme.textColor,
              buttonColor: funnel.activeTheme.buttonColor,
              buttonTextColor: funnel.activeTheme.buttonTextColor,
              borderColor: funnel.activeTheme.borderColor,
              optionColor: funnel.activeTheme.optionColor,
              fontFamily: funnel.activeTheme.fontFamily,
              borderRadius: funnel.activeTheme.borderRadius,
              type: ThemeType.CUSTOM,
              templateId: template.id,
            },
          });
        }

        // Duplicate forms and build ID mapping
        const formIdMap = new Map<number, number>();
        for (const form of originalForms) {
          const newForm = await tx.form.create({
            data: {
              name: form.name,
              description: form.description,
              formContent: form.formContent,
              isActive: form.isActive,
              templateId: template.id,
              // Webhooks are NOT copied - user should configure separately
              webhookUrl: null,
              webhookEnabled: false,
              webhookHeaders: {},
              webhookSecret: null,
            },
          });
          formIdMap.set(form.id, newForm.id);
        }

        // Duplicate insights and build ID mapping
        const insightIdMap = new Map<number, number>();
        for (const insight of funnel.insights) {
          const newInsight = await tx.insight.create({
            data: {
              type: insight.type,
              name: insight.name,
              description: insight.description,
              content: insight.content,
              settings: insight.settings,
              templateId: template.id,
            },
          });
          insightIdMap.set(insight.id, newInsight.id);
        }

        // Build server ID map for content replacement
        const serverIdMap: ServerIdMap = {
          forms: formIdMap,
          insights: insightIdMap,
        };

        // Create template pages from funnel pages with server ID replacement
        const templatePagesData = funnel.pages.map((page) => ({
          templateId: template.id,
          name: page.name,
          content: replaceServerIdsInContent(page.content, serverIdMap),
          order: page.order,
          type: page.type,
          settings: null,
          linkingId: page.linkingId,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoKeywords: page.seoKeywords,
        }));

        await tx.templatePage.createMany({
          data: templatePagesData,
        });

        // Create template images
        const templateImagesData = data.images.map((image) => ({
          templateId: template.id,
          imageUrl: image.imageUrl,
          imageType: image.imageType,
          order: image.order,
          caption: image.caption ?? null,
        }));

        await tx.templateImage.createMany({
          data: templateImagesData,
        });

        return template;
      });

      return {
        message: "Template created successfully",
        templateId: result.id,
        slug: result.slug,
      };
    } catch (error) {
      throw error;
    }
  }
}
