import { z } from "zod";
import {
  CreateGlobalThemeRequest,
  CreateGlobalThemeResponse,
  createGlobalThemeRequest,
  createGlobalThemeResponse,
} from "../../../types/theme/create-global";
import { getPrisma } from "../../../lib/prisma";
import { $Enums } from "../../../generated/prisma-client";

export const createGlobalTheme = async (
  userId: number,
  data: CreateGlobalThemeRequest
): Promise<CreateGlobalThemeResponse> => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Validate request data
    const validatedData = createGlobalThemeRequest.parse(data);

    const prisma = getPrisma();

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isAdmin) {
      throw new Error(
        "Unauthorized: Only administrators can create global themes"
      );
    }

    // Create global theme with type = GLOBAL and funnelId = null
    const theme = await prisma.theme.create({
      data: {
        type: $Enums.ThemeType.GLOBAL,
        funnelId: null,
        name: validatedData.name,
        backgroundColor: validatedData.backgroundColor,
        textColor: validatedData.textColor,
        buttonColor: validatedData.buttonColor,
        buttonTextColor: validatedData.buttonTextColor,
        borderColor: validatedData.borderColor,
        optionColor: validatedData.optionColor,
        fontFamily: validatedData.fontFamily,
        borderRadius: validatedData.borderRadius,
      },
    });

    console.log(
      `[Theme] Global theme created successfully with ID: ${theme.id}`
    );

    const response = {
      ...theme,
      message: "Global theme created successfully",
    };

    return createGlobalThemeResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to create global theme: ${error.message}`);
    }
    throw new Error("Couldn't create the global theme. Please try again.");
  }
};
