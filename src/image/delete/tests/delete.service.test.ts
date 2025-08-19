import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteImage } from "../service/delete.service";
import { getPrisma } from "../../../lib/prisma";
import { azureBlobStorageService } from "../../../services/azure-blob-storage.service";
import { cacheService } from "../../../services/cache/cache.service";
import { UnauthorizedError, NotFoundError } from "../../../errors";

vi.mock("../../../lib/prisma");
vi.mock("../../../services/azure-blob-storage.service");
vi.mock("../../../services/cache/cache.service");

const mockGetPrisma = vi.mocked(getPrisma);
const mockAzureBlobStorageService = vi.mocked(azureBlobStorageService);
const mockCacheService = vi.mocked(cacheService);

describe("Delete Image Service", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      image: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      imageFolder: {
        findUnique: vi.fn(),
      },
    };

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should delete image successfully", async () => {
    const params = { imageId: "1" };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue({
      id: 1,
      url: "https://test.com/images/user-1/folder-1/test.jpg",
      folderId: 1,
      folder: { userId: 1 },
    });
    mockAzureBlobStorageService.deleteFile.mockResolvedValue(undefined);
    mockPrisma.image.delete.mockResolvedValue({ id: 1 });

    mockCacheService.getUserFolderCache.mockResolvedValue({
      id: 1,
      images: [{ id: 1 }, { id: 2 }],
    });
    mockCacheService.setUserFolderCache.mockResolvedValue(undefined);

    const result = await deleteImage(userId, params);

    expect(result.message).toBe("Image deleted successfully");
    expect(mockPrisma.image.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockAzureBlobStorageService.deleteFile).toHaveBeenCalled();
    expect(mockCacheService.setUserFolderCache).toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(deleteImage(0, { imageId: "1" })).rejects.toThrow(UnauthorizedError);
  });

  it("should throw NotFoundError when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(deleteImage(1, { imageId: "1" })).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when image not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue(null);

    await expect(deleteImage(1, { imageId: "1" })).rejects.toThrow(NotFoundError);
  });

  it("should throw UnauthorizedError when user doesn't own image", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue({
      id: 1,
      folder: { userId: 2 }, // Different user
    });

    await expect(deleteImage(1, { imageId: "1" })).rejects.toThrow(UnauthorizedError);
  });

  it("should handle Azure deletion failure gracefully", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue({
      id: 1,
      url: "https://test.com/images/user-1/folder-1/test.jpg",
      folderId: 1,
      folder: { userId: 1 },
    });
    mockAzureBlobStorageService.deleteFile.mockRejectedValue(new Error("Azure error"));
    mockPrisma.image.delete.mockResolvedValue({ id: 1 });

    mockCacheService.getUserFolderCache.mockResolvedValue(null);
    mockPrisma.imageFolder.findUnique.mockResolvedValue({
      id: 1,
      images: [],
    });

    const result = await deleteImage(1, { imageId: "1" });

    expect(result.message).toBe("Image deleted successfully");
    expect(mockPrisma.image.delete).toHaveBeenCalled();
  });
});