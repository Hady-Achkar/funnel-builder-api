import { getPrisma } from "../../../lib/prisma";
import { NotFoundError } from "../../../errors";
import { PageType } from "../../../generated/prisma-client";
import {
  GetTemplatePagesResponse,
  getTemplatePagesResponse,
  TemplateTheme,
} from "../../../types/template/get-pages";

export const getTemplatePages = async (
  templateSlug: string
): Promise<GetTemplatePagesResponse> => {
  const prisma = getPrisma();

  // Find template by slug with pages (excluding content) and theme
  const template = await prisma.template.findUnique({
    where: { slug: templateSlug },
    include: {
      pages: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          templateId: true,
          name: true,
          order: true,
          type: true,
          settings: true,
          linkingId: true,
          seoTitle: true,
          seoDescription: true,
          seoKeywords: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      theme: true,
    },
  });

  if (!template) {
    throw new NotFoundError("Template not found");
  }

  // Separate pages by type
  const pageTypes = template.pages.filter((p) => p.type === PageType.PAGE);
  const resultTypes = template.pages.filter((p) => p.type === PageType.RESULT);

  // Re-number order starting from 1 for each type
  const numberedPages = pageTypes.map((page, index) => ({
    ...page,
    order: index + 1,
  }));

  const numberedResults = resultTypes.map((page, index) => ({
    ...page,
    order: index + 1,
  }));

  // Combine: PAGE types first, then RESULT types
  const sortedPages = [...numberedPages, ...numberedResults];

  // Format theme response (only include styling fields, not internal IDs)
  const theme: TemplateTheme | null = template.theme
    ? {
        backgroundColor: template.theme.backgroundColor,
        textColor: template.theme.textColor,
        buttonColor: template.theme.buttonColor,
        buttonTextColor: template.theme.buttonTextColor,
        borderColor: template.theme.borderColor,
        optionColor: template.theme.optionColor,
        fontFamily: template.theme.fontFamily,
        borderRadius: template.theme.borderRadius,
      }
    : null;

  return getTemplatePagesResponse.parse({ pages: sortedPages, theme });
};
