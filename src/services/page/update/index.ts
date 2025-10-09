import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../cache/cache.service";
import {
  UpdatePageParamsInput,
  updatePageParams,
  updatePageRequest,
  UpdatePageRequest,
  UpdatePageResponse,
} from "../../../types/page/update";
import { BadRequestError } from "../../../errors";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import { generateUniqueLinkingId } from "../../../utils/page-utils/linking-id";

export const updatePage = async (
  params: UpdatePageParamsInput,
  requestData: UpdatePageRequest,
  userId: number
): Promise<UpdatePageResponse> => {
  const validatedParams = updatePageParams.parse(params);
  const validatedData = updatePageRequest.parse(requestData);

  const prisma = getPrisma();

  // Get existing page with workspace info for permission check
  const existingPage = await prisma.page.findUnique({
    where: { id: validatedParams.id },
    include: {
      funnel: {
        select: {
          id: true,
          workspaceId: true,
        },
      },
    },
  });

  if (!existingPage) {
    throw new BadRequestError("Page not found");
  }

  // Check permission using PermissionManager
  await PermissionManager.requirePermission({
    userId,
    workspaceId: existingPage.funnel.workspaceId,
    action: PermissionAction.EDIT_PAGE,
  });

  const updateData: any = {};
  let newLinkingId: string | undefined;

  // Handle linkingId logic
  if (validatedData.linkingId !== undefined) {
    // Use provided linkingId directly (already validated by Zod)
    const conflictingPage = await prisma.page.findFirst({
      where: {
        linkingId: validatedData.linkingId,
        funnelId: existingPage.funnelId,
        id: { not: existingPage.id },
      },
    });

    if (conflictingPage) {
      throw new BadRequestError(
        `A page with the linking ID "${validatedData.linkingId}" already exists in this funnel. Please choose a different name.`
      );
    }

    newLinkingId = validatedData.linkingId;
    updateData.linkingId = newLinkingId;
  } else if (validatedData.name !== undefined) {
    // Generate linkingId from name when name is updated but linkingId not provided
    newLinkingId = await generateUniqueLinkingId(validatedData.name, existingPage.funnelId, existingPage.id);
    updateData.linkingId = newLinkingId;
  }

  if (validatedData.name !== undefined) {
    updateData.name = validatedData.name;
  }

  if (validatedData.content !== undefined) {
    updateData.content = validatedData.content;
  }

  if (validatedData.seoTitle !== undefined) {
    updateData.seoTitle = validatedData.seoTitle;
  }

  if (validatedData.seoDescription !== undefined) {
    updateData.seoDescription = validatedData.seoDescription;
  }

  if (validatedData.seoKeywords !== undefined) {
    updateData.seoKeywords = validatedData.seoKeywords;
  }

  if (validatedData.type !== undefined) {
    updateData.type = validatedData.type;
  }

  if (Object.keys(updateData).length === 0) {
    return {
      message: "No changes provided",
      page: {
        id: existingPage.id,
        name: existingPage.name,
        content: existingPage.content,
        order: existingPage.order,
        type: existingPage.type,
        linkingId: existingPage.linkingId,
        seoTitle: existingPage.seoTitle,
        seoDescription: existingPage.seoDescription,
        seoKeywords: existingPage.seoKeywords,
        funnelId: existingPage.funnelId,
        createdAt: existingPage.createdAt,
        updatedAt: existingPage.updatedAt,
      },
    };
  }

  const updatedPage = await prisma.page.update({
    where: { id: existingPage.id },
    data: updateData,
  });

  // Simplified cache invalidation - just delete the funnel cache
  await cacheService.del(
    `workspace:${existingPage.funnel.workspaceId}:funnel:${existingPage.funnelId}:full`
  );

  return {
    message: "Page updated successfully",
    page: {
      id: updatedPage.id,
      name: updatedPage.name,
      content: updatedPage.content,
      order: updatedPage.order,
      type: updatedPage.type,
      linkingId: updatedPage.linkingId,
      seoTitle: updatedPage.seoTitle,
      seoDescription: updatedPage.seoDescription,
      seoKeywords: updatedPage.seoKeywords,
      funnelId: updatedPage.funnelId,
      createdAt: updatedPage.createdAt,
      updatedAt: updatedPage.updatedAt,
    },
  };
};