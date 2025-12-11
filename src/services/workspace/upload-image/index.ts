import { getPrisma } from "../../../lib/prisma";
import { azureBlobStorageService } from "../../azure-blob-storage.service";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../../../errors";
import { ZodError } from "zod";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import {
  uploadWorkspaceImageRequest,
  UploadWorkspaceImageRequest,
  uploadWorkspaceImageResponse,
  UploadWorkspaceImageResponse,
} from "../../../types/workspace/upload-image";
import { $Enums } from "../../../generated/prisma-client";

export const uploadWorkspaceImage = async (
  userId: number,
  params: UploadWorkspaceImageRequest,
  file: Express.Multer.File
): Promise<UploadWorkspaceImageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");
    if (!file) throw new BadRequestError("No file provided");

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];

    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestError(
        `Invalid file type: ${file.mimetype}. Only image files are allowed.`
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestError(`File exceeds 5MB limit.`);
    }

    const validatedParams = uploadWorkspaceImageRequest.parse(params);
    const prisma = getPrisma();

    const workspace = await prisma.workspace.findUnique({
      where: { slug: validatedParams.slug },
      include: {
        members: {
          where: { userId: userId },
          select: { role: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const isOwner = workspace.ownerId === userId;
    const isAdmin = workspace.members.some(
      (member) => member.role === $Enums.WorkspaceRole.ADMIN
    );

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError(
        "Only workspace owner or admin can upload workspace image"
      );
    }

    if (!azureBlobStorageService.isConfigured()) {
      throw new BadRequestError("Image storage service is not configured");
    }

    const fileExtension = path.extname(file.originalname) || ".jpg";
    const fileName = `${uuidv4()}${fileExtension}`;

    // Create folder path: users/{userId}/workspaces/{workspaceId}
    const folderPath = `users/${userId}/workspaces/${workspace.id}`;

    const uploadResult = await azureBlobStorageService.uploadBuffer(
      file.buffer,
      {
        fileName,
        contentType: file.mimetype,
        folder: folderPath,
      }
    );

    const imageUrl = uploadResult.url;

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: { image: imageUrl },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
    });

    return uploadWorkspaceImageResponse.parse(updatedWorkspace);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};