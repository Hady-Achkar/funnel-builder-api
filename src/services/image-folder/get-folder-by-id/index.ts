import {
  GetImageFolderByIdRequest,
  GetImageFolderByIdResponse,
  getImageFolderByIdRequest,
  getImageFolderByIdResponse,
} from "../../../types/image-folder/get-folder-by-id";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";

export const getImageFolderById = async (
  userId: number,
  request: GetImageFolderByIdRequest
): Promise<GetImageFolderByIdResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    let validatedRequest;
    try {
      validatedRequest = getImageFolderByIdRequest.parse(request);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        throw new BadRequestError(message);
      }
      throw error;
    }

    const cacheKey = `user:${userId}:folder:${validatedRequest.id}:full`;

    try {
      const cachedFolder = await cacheService.get(cacheKey);
      if (cachedFolder) {
        return getImageFolderByIdResponse.parse(cachedFolder);
      }
    } catch (cacheError) {
      console.warn("Cache retrieval failed:", cacheError);
    }

    const prisma = getPrisma();

    const folder = await prisma.imageFolder.findFirst({
      where: {
        id: validatedRequest.id,
        userId,
      },
      include: {
        images: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            url: true,
            createdAt: true,
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundError("Folder not found or you don't have access");
    }

    const response = {
      id: folder.id,
      name: folder.name,
      userId: folder.userId,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      images: folder.images,
    };

    const validatedResponse = getImageFolderByIdResponse.parse(response);

    try {
      await cacheService.set(cacheKey, validatedResponse, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Cache update failed but folder was retrieved:", cacheError);
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