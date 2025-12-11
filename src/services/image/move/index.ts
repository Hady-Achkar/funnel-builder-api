import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";
import {
  moveImageParams,
  moveImageBody,
  moveImageResponse,
  MoveImageResponse,
} from "../../../types/image/move";

export const moveImage = async (
  userId: number,
  params: any,
  body: any
): Promise<MoveImageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedParams = moveImageParams.parse(params);
    const validatedBody = moveImageBody.parse(body);
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundError("User not found");

    const image = await prisma.image.findUnique({
      where: { id: validatedParams.imageId },
      include: { folder: true },
    });

    if (!image) throw new NotFoundError("Image not found");
    if (image.folder?.userId !== userId)
      throw new UnauthorizedError("Unauthorized to move this image");

    const targetFolder = await prisma.imageFolder.findUnique({
      where: { id: validatedBody.targetFolderId, userId },
    });
    if (!targetFolder) throw new NotFoundError("Target folder not found");

    if (image.folderId === validatedBody.targetFolderId) {
      throw new BadRequestError("Image is already in the target folder");
    }

    const sourceFolderId = image.folderId!;

    const movedImage = await prisma.image.update({
      where: { id: validatedParams.imageId },
      data: {
        folderId: validatedBody.targetFolderId,
        updatedAt: new Date(),
      },
    });

    await updateBothFoldersCache(
      userId,
      sourceFolderId,
      validatedBody.targetFolderId,
      movedImage,
      prisma
    );

    const response = { message: "Image moved successfully" };
    return moveImageResponse.parse(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};

const updateBothFoldersCache = async (
  userId: number,
  sourceFolderId: number,
  targetFolderId: number,
  movedImage: any,
  prisma: any
) => {
  try {
    await updateSourceFolderCache(
      userId,
      sourceFolderId,
      movedImage.id,
      prisma
    );
    await updateTargetFolderCache(userId, targetFolderId, movedImage, prisma);
  } catch (cacheError) {
    console.warn("Cache update failed but image was moved:", cacheError);
  }
};

const updateSourceFolderCache = async (
  userId: number,
  folderId: number,
  movedImageId: number,
  prisma: any
) => {
  const cachedData = await cacheService.getUserFolderCache(
    userId,
    folderId,
    "full"
  );

  if (cachedData && typeof cachedData === "object") {
    const folderData = cachedData as any;
    const updatedFolderData = {
      ...folderData,
      images: (folderData.images || []).filter(
        (img: any) => img.id !== movedImageId
      ),
    };

    await cacheService.setUserFolderCache(
      userId,
      folderId,
      "full",
      updatedFolderData
    );
  } else {
    const folderData = await prisma.imageFolder.findUnique({
      where: { id: folderId, userId },
      include: { images: { orderBy: { createdAt: "desc" } } },
    });

    if (folderData) {
      await cacheService.setUserFolderCache(
        userId,
        folderId,
        "full",
        folderData
      );
    }
  }
};

const updateTargetFolderCache = async (
  userId: number,
  folderId: number,
  movedImage: any,
  prisma: any
) => {
  const cachedData = await cacheService.getUserFolderCache(
    userId,
    folderId,
    "full"
  );

  if (cachedData && typeof cachedData === "object") {
    const folderData = cachedData as any;
    const updatedFolderData = {
      ...folderData,
      images: [movedImage, ...(folderData.images || [])],
    };

    await cacheService.setUserFolderCache(
      userId,
      folderId,
      "full",
      updatedFolderData
    );
  } else {
    const folderData = await prisma.imageFolder.findUnique({
      where: { id: folderId, userId },
      include: { images: { orderBy: { createdAt: "desc" } } },
    });

    if (folderData) {
      await cacheService.setUserFolderCache(
        userId,
        folderId,
        "full",
        folderData
      );
    }
  }
};