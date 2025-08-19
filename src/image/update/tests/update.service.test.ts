import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateImage } from "../service/update.service";
import { getPrisma } from "../../../lib/prisma";
import { azureBlobStorageService } from "../../../services/azure-blob-storage.service";
import { cacheService } from "../../../services/cache/cache.service";
import { UnauthorizedError, NotFoundError, BadRequestError } from "../../../errors";

vi.mock("../../../lib/prisma");
vi.mock("../../../services/azure-blob-storage.service");
vi.mock("../../../services/cache/cache.service");

const mockGetPrisma = vi.mocked(getPrisma);
const mockAzureBlobStorageService = vi.mocked(azureBlobStorageService);
const mockCacheService = vi.mocked(cacheService);

describe("Update Image Service", () => {
  let mockPrisma: any;
  let mockFile: Express.Multer.File;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      image: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      imageFolder: {
        findUnique: vi.fn(),
      },
    };

    mockFile = {
      fieldname: "image",
      originalname: "updated.jpg",
      encoding: "7bit",
      mimetype: "image/jpeg",
      buffer: Buffer.from("updated"),
      size: 1500,
    } as Express.Multer.File;

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should update image with file and metadata successfully", async () => {
    const params = { imageId: "1" } as any;
    const formData = { name: "Updated Image", altText: "Updated alt text" };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue({
      id: 1,
      url: "https://test.com/images/user-1/folder-1/test.jpg",
      folderId: 1,
      folder: { userId: 1 },
    });

    mockAzureBlobStorageService.overwriteFileAtExactPath.mockResolvedValue(undefined);
    mockPrisma.image.update.mockResolvedValue({
      id: 1,
      name: "Updated Image",
      altText: "Updated alt text",
      size: 1500,
      updatedAt: new Date(),
    });

    mockCacheService.getUserFolderCache.mockResolvedValue({
      id: 1,
      images: [{ id: 1, name: "Old Image" }],
    });

    const result = await updateImage(userId, params, formData, mockFile);

    expect(result.message).toBe("Image updated successfully");
    expect(mockAzureBlobStorageService.overwriteFileAtExactPath).toHaveBeenCalled();
    expect(mockPrisma.image.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        name: "Updated Image",
        altText: "Updated alt text",
        size: 1500,
      }),
    });
  });

  it("should update image metadata only (no file)", async () => {
    const params = { imageId: "1" } as any;
    const formData = { name: "Updated Image", altText: "Updated alt text" };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue({
      id: 1,
      folderId: 1,
      folder: { userId: 1 },
    });

    mockPrisma.image.update.mockResolvedValue({
      id: 1,
      name: "Updated Image",
      altText: "Updated alt text",
    });

    mockCacheService.getUserFolderCache.mockResolvedValue({
      id: 1,
      images: [{ id: 1, name: "Old Image" }],
    });

    const result = await updateImage(userId, params, formData);

    expect(result.message).toBe("Image updated successfully");
    expect(mockAzureBlobStorageService.overwriteFileAtExactPath).not.toHaveBeenCalled();
    expect(mockPrisma.image.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        name: "Updated Image",
        altText: "Updated alt text",
      }),
    });
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(updateImage(0, { imageId: "1" } as any, {})).rejects.toThrow(UnauthorizedError);
  });

  it("should throw BadRequestError for invalid file type", async () => {
    const invalidFile = { ...mockFile, mimetype: "text/plain" };
    
    await expect(updateImage(1, { imageId: "1" } as any, {}, invalidFile)).rejects.toThrow(BadRequestError);
  });

  it("should throw BadRequestError for oversized file", async () => {
    const largeFile = { ...mockFile, size: 6 * 1024 * 1024 }; // 6MB

    await expect(updateImage(1, { imageId: "1" } as any, {}, largeFile)).rejects.toThrow(BadRequestError);
  });

  it("should throw NotFoundError when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(updateImage(1, { imageId: "1" } as any, {})).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when image not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue(null);

    await expect(updateImage(1, { imageId: "1" } as any, {})).rejects.toThrow(NotFoundError);
  });

  it("should throw UnauthorizedError when user doesn't own image", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue({
      id: 1,
      folder: { userId: 2 }, // Different user
    });

    await expect(updateImage(1, { imageId: "1" } as any, {})).rejects.toThrow(UnauthorizedError);
  });
});