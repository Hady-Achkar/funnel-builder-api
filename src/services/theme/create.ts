import {
  CreateThemeData,
  CreateThemeResponse,
  ThemeResponse,
  BorderRadius,
} from "../../types/theme.types";
import { getPrisma } from "./helpers";
import { CacheService } from "../cache/cache.service";
import { CachedFunnelWithPages } from "../../types/funnel.types";

export async function createTheme(
  data: CreateThemeData,
  userId: number
): Promise<CreateThemeResponse> {
  try {
    if (!data.funnelId) {
      throw new Error("Funnel ID is required");
    }

    let trimmedName: string | undefined;
    if (data.name !== undefined) {
      trimmedName = data.name.trim();
      if (trimmedName.length === 0) {
        throw new Error("Theme name cannot be empty");
      }
      if (trimmedName.length > 100) {
        throw new Error("Theme name cannot exceed 100 characters");
      }
    }

    // Verify the funnel exists and belongs to the user
    const funnel = await getPrisma().funnel.findFirst({
      where: {
        id: data.funnelId,
        userId: userId,
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found or you don't have access to it");
    }

    // Check if the funnel already has a theme
    if (funnel.themeId) {
      throw new Error("This funnel already has a theme assigned");
    }

    // Use a transaction to create theme and update funnel
    const result = await getPrisma().$transaction(async (tx) => {
      // Prepare theme data, letting Prisma handle defaults for undefined fields
      const themeData: any = {};

      if (trimmedName) themeData.name = trimmedName;
      if (data.backgroundColor)
        themeData.backgroundColor = data.backgroundColor;
      if (data.textColor) themeData.textColor = data.textColor;
      if (data.buttonColor) themeData.buttonColor = data.buttonColor;
      if (data.buttonTextColor)
        themeData.buttonTextColor = data.buttonTextColor;
      if (data.borderColor) themeData.borderColor = data.borderColor;
      if (data.optionColor) themeData.optionColor = data.optionColor;
      if (data.fontFamily) themeData.fontFamily = data.fontFamily;
      if (data.borderRadius) themeData.borderRadius = data.borderRadius;

      // Create the theme (Prisma will apply defaults for omitted fields)
      const createdTheme = await tx.theme.create({
        data: themeData,
      });

      // Update the funnel to link to this theme
      await tx.funnel.update({
        where: { id: data.funnelId },
        data: { themeId: createdTheme.id },
      });

      return createdTheme;
    });

    // Update funnel cache after linking the theme
    try {
      const cacheService = CacheService.getInstance();
      
      // Get the funnel with its pages to update cache
      const funnelWithPages = await getPrisma().funnel.findFirst({
        where: { id: data.funnelId },
        include: { pages: true, theme: true }
      });
      
      if (funnelWithPages && funnelWithPages.theme) {
        // Prepare the theme data for cache
        const themeData = {
          id: funnelWithPages.theme.id,
          name: funnelWithPages.theme.name,
          backgroundColor: funnelWithPages.theme.backgroundColor,
          textColor: funnelWithPages.theme.textColor,
          buttonColor: funnelWithPages.theme.buttonColor,
          buttonTextColor: funnelWithPages.theme.buttonTextColor,
          borderColor: funnelWithPages.theme.borderColor,
          optionColor: funnelWithPages.theme.optionColor,
          fontFamily: funnelWithPages.theme.fontFamily,
          borderRadius: funnelWithPages.theme.borderRadius,
        };
        
        // Update the full cache with new theme data
        const cachedFunnel = await cacheService.getUserFunnelCache<CachedFunnelWithPages>(
          userId,
          data.funnelId,
          "full"
        );
        
        if (cachedFunnel) {
          cachedFunnel.theme = themeData;
          cachedFunnel.themeId = funnelWithPages.theme.id;
          cachedFunnel.updatedAt = new Date();
          
          await cacheService.setUserFunnelCache(
            userId,
            data.funnelId,
            "full",
            cachedFunnel,
            { ttl: 0 }
          );
          console.log(`Updated full cache for funnel ${data.funnelId} with new theme`);
        }
      }
      
      console.log(`Successfully updated cache for funnel ${data.funnelId} after theme creation`);
    } catch (cacheError) {
      // Log the error but don't fail the creation operation
      console.warn(`Failed to update funnel cache after theme creation:`, cacheError);
    }

    return {
      id: result.id,
      name: result.name,
      funnelId: data.funnelId,
      message: `Theme "${result.name}" created successfully and linked to funnel`,
    };
  } catch (error: any) {
    console.error("ThemeService.createTheme error:", error);

    if (error.code === "P2002") {
      throw new Error("A theme with this configuration already exists");
    }

    if (error.code === "P2003") {
      throw new Error("Invalid reference provided");
    }

    if (
      error.message.includes("Theme name") ||
      error.message.includes("Funnel") ||
      error.message.includes("required") ||
      error.message.includes("exceed") ||
      error.message.includes("already has a theme")
    ) {
      throw error;
    }

    throw new Error("Failed to create theme. Please try again later.");
  }
}

export async function createDefaultTheme(): Promise<ThemeResponse> {
  try {
    const createdTheme = await getPrisma().theme.create({
      data: {}, // All fields will use schema defaults including name
    });

    return {
      id: createdTheme.id,
      name: createdTheme.name,
      backgroundColor: createdTheme.backgroundColor,
      textColor: createdTheme.textColor,
      buttonColor: createdTheme.buttonColor,
      buttonTextColor: createdTheme.buttonTextColor,
      borderColor: createdTheme.borderColor,
      optionColor: createdTheme.optionColor,
      fontFamily: createdTheme.fontFamily,
      borderRadius: createdTheme.borderRadius as BorderRadius,
      createdAt: createdTheme.createdAt,
      updatedAt: createdTheme.updatedAt,
    };
  } catch (error: any) {
    console.error("ThemeService.createDefaultTheme error:", error);

    if (error.code === "P2002") {
      throw new Error("Failed to create theme: theme name already exists");
    }

    throw new Error("Failed to create default theme");
  }
}