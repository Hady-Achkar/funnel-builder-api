import { PrismaClient } from "../generated/prisma-client";
import {
  CreateThemeData,
  CreateThemeResponse,
  UpdateThemeData,
  UpdateThemeResponse,
  ThemeResponse,
  BorderRadius,
} from "../types/theme.types";

// Allow prisma client to be injected for testing
let prisma: PrismaClient | null = null;

// Function to get Prisma client (lazy initialization)
const getPrisma = (): PrismaClient => {
  if (!prisma) {
    // Only create default client if we're not in test environment
    if (process.env.NODE_ENV !== "test") {
      prisma = new PrismaClient();
    } else {
      throw new Error(
        "PrismaClient not set for test environment. Call setPrismaClient() first."
      );
    }
  }
  return prisma;
};

export const setPrismaClient = (client: PrismaClient) => {
  prisma = client;
};

export class ThemeService {
  static async createTheme(
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

  static async createDefaultTheme(): Promise<ThemeResponse> {
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


  static async updateTheme(
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
      });

      return {
        id: updatedTheme.id,
        name: updatedTheme.name,
        message: `Theme "${updatedTheme.name}" updated successfully`,
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
}
