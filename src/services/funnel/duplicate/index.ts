import { z } from "zod";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import {
  hasPermissionToViewFunnel,
  hasPermissionToCreateFunnel,
  generateLinkingIdMap,
  replaceLinkingIdsInContent,
  getNewLinkingIdForPage,
} from "../../../helpers/funnel/duplicate";
import { generateSlug, generateUniqueSlug } from "../../../helpers/funnel/shared";
import {
  duplicateFunnelParams,
  DuplicateFunnelParams,
  duplicateFunnelRequest,
  DuplicateFunnelRequest,
  duplicateFunnelResponse,
  DuplicateFunnelResponse,
} from "../../../types/funnel/duplicate";

export const duplicateFunnel = async (
  funnelId: number,
  userId: number,
  data: Partial<DuplicateFunnelRequest>
): Promise<DuplicateFunnelResponse> => {
  let validatedParams: DuplicateFunnelParams;
  let validatedData: DuplicateFunnelRequest;
  let finalFunnelName: string;

  try {
    if (!userId) throw new Error("User ID is required");

    validatedParams = duplicateFunnelParams.parse({ funnelId });
    validatedData = duplicateFunnelRequest.parse(data);

    const prisma = getPrisma();

    // Get the original funnel with all its data
    const originalFunnel = await prisma.funnel.findUnique({
      where: { id: validatedParams.funnelId },
      include: {
        theme: true,
        pages: {
          orderBy: { order: "asc" },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!originalFunnel) {
      throw new Error("Funnel not found");
    }

    // Determine target workspace (same workspace if not provided)
    let targetWorkspaceId = originalFunnel.workspaceId;
    
    if (validatedData.workspaceSlug) {
      const targetWorkspaceBySlug = await prisma.workspace.findUnique({
        where: { slug: validatedData.workspaceSlug },
        select: { id: true },
      });
      
      if (!targetWorkspaceBySlug) {
        throw new Error("Target workspace not found");
      }
      
      targetWorkspaceId = targetWorkspaceBySlug.id;
    }

    // Check permission to view original funnel
    const isOriginalOwner = originalFunnel.workspace.ownerId === userId;

    if (!isOriginalOwner) {
      const originalMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userId,
            workspaceId: originalFunnel.workspaceId,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!originalMember) {
        throw new Error(
          `You don't have access to the original funnel. Please ask the workspace owner to invite you.`
        );
      }

      const canViewOriginal = hasPermissionToViewFunnel(
        originalMember.role,
        originalMember.permissions
      );

      if (!canViewOriginal) {
        throw new Error(
          `You don't have permission to view the original funnel.`
        );
      }
    }

    // If duplicating to a different workspace, check target workspace permissions
    let targetWorkspace: { id: number; name: string; ownerId: number } | null =
      null;
    if (targetWorkspaceId !== originalFunnel.workspaceId) {
      targetWorkspace = await prisma.workspace.findUnique({
        where: { id: targetWorkspaceId },
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      });

      if (!targetWorkspace) {
        throw new Error("Target workspace does not exist");
      }

      const isTargetOwner = targetWorkspace.ownerId === userId;

      if (!isTargetOwner) {
        const targetMember = await prisma.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: userId,
              workspaceId: targetWorkspaceId,
            },
          },
          select: {
            role: true,
            permissions: true,
          },
        });

        if (!targetMember) {
          throw new Error(
            `You don't have access to the target workspace ${targetWorkspace.name}. Please ask the workspace owner to invite you.`
          );
        }

        const canCreateInTarget = hasPermissionToCreateFunnel(
          targetMember.role,
          targetMember.permissions
        );

        if (!canCreateInTarget) {
          throw new Error(
            `You don't have permission to create funnels in the target workspace ${targetWorkspace.name}.`
          );
        }
      }
    } else {
      targetWorkspace = {
        id: originalFunnel.workspace.id,
        name: originalFunnel.workspace.name,
        ownerId: originalFunnel.workspace.ownerId,
      };
    }

    // Check if target workspace has reached its funnel allocation limit
    const targetWorkspaceWithAllocations = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
      select: {
        allocatedFunnels: true,
      },
    });

    if (!targetWorkspaceWithAllocations) {
      throw new Error("Target workspace not found");
    }

    const currentFunnelCount = await prisma.funnel.count({
      where: { workspaceId: targetWorkspaceId },
    });

    if (currentFunnelCount >= targetWorkspaceWithAllocations.allocatedFunnels) {
      throw new Error(
        "This workspace has reached its maximum number of funnels."
      );
    }

    // Generate unique funnel name
    finalFunnelName = validatedData.name || `Copy of ${originalFunnel.name}`;

    // Check if name already exists in target workspace and generate unique name
    const existingFunnels = await prisma.funnel.findMany({
      where: {
        workspaceId: targetWorkspaceId,
        name: {
          startsWith: finalFunnelName,
        },
      },
      select: {
        name: true,
      },
    });

    if (existingFunnels.length > 0) {
      const existingNames = existingFunnels.map((f) => f.name);

      // If exact name exists, start looking for numbered versions
      if (existingNames.includes(finalFunnelName)) {
        let counter = 2;
        let newName = `${finalFunnelName} (${counter})`;

        while (existingNames.includes(newName)) {
          counter++;
          newName = `${finalFunnelName} (${counter})`;
        }

        finalFunnelName = newName;
      }
    }

    // Generate new linking ID mapping for all pages
    const linkingMap = generateLinkingIdMap(originalFunnel.pages);

    // Duplicate funnel and pages in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate unique slug for duplicated funnel
      const baseSlug = generateSlug(finalFunnelName);
      const uniqueSlug = await generateUniqueSlug(baseSlug, targetWorkspaceId);

      // Create the new funnel first
      const newFunnel = await tx.funnel.create({
        data: {
          name: finalFunnelName,
          slug: uniqueSlug,
          status: originalFunnel.status,
          workspaceId: targetWorkspaceId,
          createdBy: userId,
        },
      });

      // Create new theme (copy of original) with funnel reference
      const newTheme = await tx.theme.create({
        data: {
          name: originalFunnel.theme?.name || "Default Theme",
          backgroundColor: originalFunnel.theme?.backgroundColor || "#0e1e12",
          textColor: originalFunnel.theme?.textColor || "#d4ecd0",
          buttonColor: originalFunnel.theme?.buttonColor || "#387e3d",
          buttonTextColor: originalFunnel.theme?.buttonTextColor || "#e8f5e9",
          borderColor: originalFunnel.theme?.borderColor || "#214228",
          optionColor: originalFunnel.theme?.optionColor || "#16331b",
          fontFamily: originalFunnel.theme?.fontFamily || "Inter, sans-serif",
          borderRadius: originalFunnel.theme?.borderRadius || "SOFT",
          funnelId: newFunnel.id,
        },
      });

      // Update funnel with theme reference
      const updatedFunnel = await tx.funnel.update({
        where: { id: newFunnel.id },
        data: { themeId: newTheme.id },
        include: {
          theme: true,
        },
      });

      // Duplicate pages with updated linking IDs and content
      const createdPages = [];
      for (const originalPage of originalFunnel.pages) {
        const newLinkingId = getNewLinkingIdForPage(
          originalPage.linkingId,
          linkingMap
        );
        const updatedContent = replaceLinkingIdsInContent(
          originalPage.content,
          linkingMap
        );

        const newPage = await tx.page.create({
          data: {
            name: originalPage.name,
            content: updatedContent,
            order: originalPage.order,
            type: originalPage.type, // Preserve the original type
            funnelId: updatedFunnel.id,
            linkingId: newLinkingId,
            seoTitle: originalPage.seoTitle,
            seoDescription: originalPage.seoDescription,
            seoKeywords: originalPage.seoKeywords,
          },
        });

        createdPages.push(newPage);
      }

      return { funnel: updatedFunnel, pages: createdPages };
    });

    // Cache management
    try {
      // Cache the individual funnel with full data including pages (without content)
      const fullFunnelCacheKey = `workspace:${targetWorkspaceId}:funnel:${result.funnel.id}:full`;
      const pagesWithoutContent = result.pages.map((page) => ({
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
      const allFunnelsCacheKey = `workspace:${targetWorkspaceId}:funnels:all`;
      const existingFunnels =
        (await cacheService.get<any[]>(allFunnelsCacheKey)) || [];

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
      await cacheService.del(`workspace:${targetWorkspaceId}:funnels:list`);

      await cacheService.del(
        `user:${userId}:workspace:${targetWorkspaceId}:funnels`
      );
    } catch (cacheError) {
      console.warn(
        "Cache update failed but funnel was duplicated:",
        cacheError
      );
    }

    const response = {
      message: "Funnel duplicated successfully",
      funnelId: result.funnel.id,
    };

    return duplicateFunnelResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }

    if (error instanceof Error) {
      if (
        error.message.includes("Unique constraint failed") ||
        error.message.includes("duplicate key value") ||
        error.message.includes("P2002")
      ) {
        throw new Error(
          `A funnel with the name ${finalFunnelName} already exists in this workspace. Please choose a different name.`
        );
      }

      throw new Error(`Failed to duplicate funnel: ${error.message}`);
    }

    throw new Error("Couldn't duplicate the funnel. Please try again.");
  }
};