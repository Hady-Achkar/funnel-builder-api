import {
  UpdateThemeData,
  UpdateThemeResponse,
} from "../../types/theme.types";
import { getPrisma } from "./helpers";
import { CacheService } from "../cache/cache.service";
import { CachedFunnelWithPages } from "../../types/funnel.types";

export async function updateTheme(
  themeId: number,
  data: UpdateThemeData,
  userId: number
): Promise<UpdateThemeResponse> {
  try {
    // Validate theme ID
    if (!themeId || themeId <= 0) {
      throw new Error("Valid theme ID is required");
    }

    // Check if there's any data to update
    const hasUpdates = Object.keys(data).some(
      (key) => data[key as keyof UpdateThemeData] !== undefined
    );
    if (!hasUpdates) {
      throw new Error("At least one field must be provided for update");
    }

    // Validate name if provided
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (trimmedName.length === 0) {
        throw new Error("Theme name cannot be empty");
      }
      if (trimmedName.length > 100) {
        throw new Error("Theme name cannot exceed 100 characters");
      }
      data.name = trimmedName;
    }

    // Check if theme exists and get associated funnel to verify ownership
    const existingTheme = await getPrisma().theme.findFirst({
      where: { id: themeId },
      include: { funnel: true },
    });

    if (!existingTheme) {
      throw new Error("Theme not found");
    }

    // Verify user owns the funnel that this theme is associated with
    if (existingTheme.funnel && existingTheme.funnel.userId !== userId) {
      throw new Error("You don't have permission to update this theme");
    }

    // Update the theme
    const updatedTheme = await getPrisma().theme.update({
      where: { id: themeId },
      data,
      include: {
        funnel: {
          include: {
            pages: true,
          }
        }
      }
    });

    // Update cache if theme has associated funnel
    if (updatedTheme.funnel) {
      try {
        const cacheService = CacheService.getInstance();
        const funnel = updatedTheme.funnel;
        
        // Prepare the theme data for cache
        const themeData = {
          id: updatedTheme.id,
          name: updatedTheme.name,
          backgroundColor: updatedTheme.backgroundColor,
          textColor: updatedTheme.textColor,
          buttonColor: updatedTheme.buttonColor,
          buttonTextColor: updatedTheme.buttonTextColor,
          borderColor: updatedTheme.borderColor,
          optionColor: updatedTheme.optionColor,
          fontFamily: updatedTheme.fontFamily,
          borderRadius: updatedTheme.borderRadius,
        };
        
        // Update the full cache with updated theme data
        const cachedFunnel = await cacheService.getUserFunnelCache<CachedFunnelWithPages>(
          funnel.userId,
          funnel.id,
          "full"
        );
        
        if (cachedFunnel) {
          cachedFunnel.theme = themeData;
          cachedFunnel.updatedAt = new Date();
          
          await cacheService.setUserFunnelCache(
            funnel.userId,
            funnel.id,
            "full",
            cachedFunnel,
            { ttl: 0 }
          );
        }
        
      } catch (cacheError) {
        console.warn(`Failed to update cache for theme ${updatedTheme.id}:`, cacheError);
      }
    }

    return {
      id: updatedTheme.id,
      name: updatedTheme.name,
      message: `Theme "${updatedTheme.name}" updated successfully${updatedTheme.funnel ? ' and cache refreshed' : ''}`,
    };
  } catch (error: any) {
    console.error("ThemeService.updateTheme error:", error);

    if (error.code === "P2002") {
      throw new Error("A theme with this configuration already exists");
    }

    if (error.code === "P2025") {
      throw new Error("Theme not found");
    }

    if (
      error.message.includes("required") ||
      error.message.includes("empty") ||
      error.message.includes("exceed") ||
      error.message.includes("not found") ||
      error.message.includes("permission") ||
      error.message.includes("must be provided")
    ) {
      throw error;
    }

    throw new Error("Failed to update theme. Please try again later.");
  }
}