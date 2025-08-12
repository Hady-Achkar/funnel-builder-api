import {
  GetUserImageFoldersResponse,
  getUserImageFoldersResponse,
} from "../types";
import { cacheService } from "../../../services/cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { UnauthorizedError, NotFoundError } from "../../../errors";

export const getUserImageFolders = async (
  userId: number
): Promise<GetUserImageFoldersResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const cacheKey = `user:${userId}:folders:summary`;

    try {
      const cachedFolders = await cacheService.get(cacheKey);
      if (cachedFolders) {
        return getUserImageFoldersResponse.parse(cachedFolders);
      }
    } catch (cacheError) {
      console.warn("Cache retrieval failed:", cacheError);
    }

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const folders = await prisma.imageFolder.findMany({
      where: { userId },
      include: {
        _count: {
          select: { images: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedFolders = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      userId: folder.userId,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      imageCount: folder._count.images,
    }));

    const response = {
      folders: formattedFolders,
    };

    const validatedResponse = getUserImageFoldersResponse.parse(response);

    try {
      await cacheService.set(cacheKey, validatedResponse, { ttl: 300 });
    } catch (cacheError) {
      console.warn(
        "Cache update failed but folders were retrieved:",
        cacheError
      );
    }

    return validatedResponse;
  } catch (error) {
    throw error;
  }
};
