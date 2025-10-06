import { z } from "zod";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../cache/cache.service";
import {
  setActiveThemeParams,
  setActiveThemeRequest,
  setActiveThemeResponse,
  SetActiveThemeRequest,
  SetActiveThemeResponse,
} from "../../../types/theme/set-active-theme";
import { $Enums } from "../../../generated/prisma-client";

export const setActiveTheme = async (
  funnelId: number,
  userId: number,
  data: SetActiveThemeRequest
): Promise<SetActiveThemeResponse> => {
  try {
    if (!userId) {
      throw new Error("Please log in to update the theme");
    }

    // Validate params and request
    const validatedParams = setActiveThemeParams.parse({ funnelId });
    const validatedData = setActiveThemeRequest.parse(data);

    const prisma = getPrisma();

    // Get funnel with workspace and current active theme info
    const funnel = await prisma.funnel.findUnique({
      where: { id: validatedParams.funnelId },
      select: {
        id: true,
        workspaceId: true,
        activeThemeId: true,
        workspace: {
          select: {
            id: true,
            ownerId: true,
          },
        },
        activeTheme: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        customTheme: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found");
    }

    // Check permissions
    const isOwner = funnel.workspace.ownerId === userId;

    if (!isOwner) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userId,
            workspaceId: funnel.workspaceId,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!member) {
        throw new Error("You don't have access to this funnel");
      }

      const canUpdateTheme =
        member.role === $Enums.WorkspaceRole.EDITOR &&
        member.permissions.includes($Enums.WorkspacePermission.EDIT_FUNNELS);

      if (!canUpdateTheme) {
        throw new Error("You don't have permission to update themes for this funnel");
      }
    }

    // Get the new theme
    const newTheme = await prisma.theme.findUnique({
      where: { id: validatedData.themeId },
      select: {
        id: true,
        name: true,
        type: true,
        funnelId: true,
      },
    });

    if (!newTheme) {
      throw new Error("Theme not found");
    }

    // If it's a custom theme, verify it belongs to this funnel
    if (newTheme.type === $Enums.ThemeType.CUSTOM) {
      if (newTheme.funnelId !== funnel.id) {
        throw new Error("This custom theme doesn't belong to this funnel");
      }
    }

    // Check if setting the same theme (idempotent)
    if (funnel.activeThemeId === newTheme.id) {
      return setActiveThemeResponse.parse({ message: "Theme is already active" });
    }

    // Perform the theme switch in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // If current theme is global, disconnect from it
      if (
        funnel.activeTheme?.type === $Enums.ThemeType.GLOBAL &&
        funnel.activeThemeId
      ) {
        await tx.funnel.update({
          where: { id: funnel.id },
          data: {
            activeTheme: {
              disconnect: true,
            },
          },
        });
      }

      // Update the funnel with new active theme
      if (newTheme.type === $Enums.ThemeType.GLOBAL) {
        // Connect to global theme
        await tx.funnel.update({
          where: { id: funnel.id },
          data: {
            activeTheme: {
              connect: { id: newTheme.id },
            },
          },
        });
      } else {
        // Set custom theme (just update the ID, no connection needed)
        await tx.funnel.update({
          where: { id: funnel.id },
          data: {
            activeThemeId: newTheme.id,
          },
        });
      }

      return { newTheme, oldTheme: funnel.activeTheme };
    });

    // Invalidate cache
    try {
      await cacheService.del(
        `workspace:${funnel.workspaceId}:funnel:${funnel.id}:full`
      );
    } catch (cacheError) {
      console.warn("Failed to invalidate funnel cache:", cacheError);
    }

    return setActiveThemeResponse.parse({ message: "Theme updated successfully" });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to set active theme. Please try again.");
  }
};
