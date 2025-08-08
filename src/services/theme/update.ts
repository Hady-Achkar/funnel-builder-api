import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../cache/cache.service";
import { UpdateThemeData, UpdateThemeResponse } from "../../types/theme.types";

export const updateTheme = async (
  themeId: number,
  userId: number,
  data: UpdateThemeData
): Promise<UpdateThemeResponse> => {
  try {
    if (!themeId || !userId)
      throw new Error("Please provide themeId and userId.");

    if (!data || Object.keys(data).length === 0) {
      throw new Error("No updates provided.");
    }

    const prisma = getPrisma();

    // Get theme with funnel to verify ownership
    const existingTheme = await prisma.theme.findFirst({
      where: { id: themeId },
      include: { funnel: true }
    });

    if (!existingTheme) throw new Error("Theme not found.");

    if (!existingTheme.funnel) throw new Error("Theme is not associated with any funnel.");

    if (existingTheme.funnel.userId !== userId) {
      throw new Error("You don't have permission to update this theme.");
    }

    // Check for actual changes
    const updates: UpdateThemeData = {};
    const changed: string[] = [];

    if (data.name !== undefined && data.name !== existingTheme.name) {
      updates.name = data.name.trim();
      if (!updates.name) throw new Error("Theme name cannot be empty.");
      changed.push("name");
    }

    if (data.backgroundColor !== undefined && data.backgroundColor !== existingTheme.backgroundColor) {
      updates.backgroundColor = data.backgroundColor;
      changed.push("background color");
    }

    if (data.textColor !== undefined && data.textColor !== existingTheme.textColor) {
      updates.textColor = data.textColor;
      changed.push("text color");
    }

    if (data.buttonColor !== undefined && data.buttonColor !== existingTheme.buttonColor) {
      updates.buttonColor = data.buttonColor;
      changed.push("button color");
    }

    if (data.buttonTextColor !== undefined && data.buttonTextColor !== existingTheme.buttonTextColor) {
      updates.buttonTextColor = data.buttonTextColor;
      changed.push("button text color");
    }

    if (data.borderColor !== undefined && data.borderColor !== existingTheme.borderColor) {
      updates.borderColor = data.borderColor;
      changed.push("border color");
    }

    if (data.optionColor !== undefined && data.optionColor !== existingTheme.optionColor) {
      updates.optionColor = data.optionColor;
      changed.push("option color");
    }

    if (data.fontFamily !== undefined && data.fontFamily !== existingTheme.fontFamily) {
      updates.fontFamily = data.fontFamily;
      changed.push("font family");
    }

    if (data.borderRadius !== undefined && data.borderRadius !== existingTheme.borderRadius) {
      updates.borderRadius = data.borderRadius;
      changed.push("border radius");
    }

    if (changed.length === 0) {
      return {
        success: true,
        message: "No changes detected. Theme is already up to date."
      };
    }

    // Update the theme
    const updatedTheme = await prisma.theme.update({
      where: { id: themeId },
      data: updates
    });

    const funnelId = existingTheme.funnel.id;

    try {
      const themeData = { ...updatedTheme };

      // Update funnel:summary cache using copy->delete->update->save pattern
      const summaryKey = `user:${userId}:funnel:${funnelId}:summary`;
      const cachedSummary = await cacheService.get<any>(summaryKey);
      
      if (cachedSummary) {
        const summaryDataCopy = { ...cachedSummary };
        await cacheService.del(summaryKey);
        
        summaryDataCopy.theme = themeData;
        summaryDataCopy.updatedAt = new Date();
        
        await cacheService.set(summaryKey, summaryDataCopy, { ttl: 0 });
      }

      // Update funnel:full cache using copy->delete->update->save pattern
      const fullKey = `user:${userId}:funnel:${funnelId}:full`;
      const cachedFull = await cacheService.get<any>(fullKey);
      
      if (cachedFull) {
        const fullDataCopy = { ...cachedFull };
        await cacheService.del(fullKey);
        
        fullDataCopy.theme = themeData;
        fullDataCopy.updatedAt = new Date();
        
        await cacheService.set(fullKey, fullDataCopy, { ttl: 0 });
      }
    } catch (cacheError) {
      console.warn("Theme updated, but cache couldn't be updated:", cacheError);
    }

    let message: string;
    if (changed.length === 1) {
      message = `Theme ${changed[0]} updated successfully`;
    } else if (changed.length === 2) {
      message = `Theme ${changed.join(" and ")} updated successfully`;
    } else {
      const last = changed.pop();
      message = `Theme ${changed.join(", ")}, and ${last} updated successfully`;
    }

    return {
      success: true,
      message
    };
  } catch (e) {
    console.error("Failed to update theme:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't update the theme. Please try again.");
  }
};