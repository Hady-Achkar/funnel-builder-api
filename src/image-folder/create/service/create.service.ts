import {
  CreateImageFolderRequest,
  CreateImageFolderResponse,
  createImageFolderRequest,
  createImageFolderResponse,
} from "../types";
import { cacheService } from "../../../services/cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";

export const createImageFolder = async (
  userId: number,
  request: CreateImageFolderRequest
): Promise<CreateImageFolderResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = createImageFolderRequest.parse(request);

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const existingFolder = await prisma.imageFolder.findUnique({
      where: {
        userId_name: {
          userId,
          name: validatedRequest.name,
        },
      },
    });

    if (existingFolder) {
      throw new BadRequestError("A folder with this name already exists");
    }

    const folder = await prisma.imageFolder.create({
      data: {
        name: validatedRequest.name,
        userId,
      },
      include: {
        images: true,
      },
    });

    const response = {
      message: "Image folder created successfully",
    };

    const validatedResponse = createImageFolderResponse.parse(response);

    try {
      await cacheService.setUserFolderCache(userId, folder.id, "full", folder, {
        ttl: 0,
      });
    } catch (cacheError) {
      console.warn("Cache update failed but folder was created:", cacheError);
    }

    return validatedResponse;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
