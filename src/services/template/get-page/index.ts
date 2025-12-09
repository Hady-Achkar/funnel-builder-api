import { getPrisma } from "../../../lib/prisma";
import { NotFoundError } from "../../../errors";
import {
  GetTemplatePageResponse,
  getTemplatePageResponse,
} from "../../../types/template/get-page";

export const getTemplatePage = async (
  templateSlug: string,
  linkingId: string
): Promise<GetTemplatePageResponse> => {
  const prisma = getPrisma();

  // Find template by slug
  const template = await prisma.template.findUnique({
    where: { slug: templateSlug },
    select: { id: true },
  });

  if (!template) {
    throw new NotFoundError("Template not found");
  }

  // Find page by templateId and linkingId
  const page = await prisma.templatePage.findFirst({
    where: {
      templateId: template.id,
      linkingId: linkingId,
    },
  });

  if (!page) {
    throw new NotFoundError("Page not found");
  }

  return getTemplatePageResponse.parse({ page });
};
