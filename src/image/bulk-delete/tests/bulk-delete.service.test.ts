import { describe, it, expect, vi, beforeEach } from "vitest";
import { bulkDeleteImages } from "../service/bulk-delete.service";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import { azureBlobStorageService } from "../../../services/azure-blob-storage.service";
import { UnauthorizedError, NotFoundError, BadRequestError } from "../../../errors";

vi.mock("../../../lib/prisma");
vi.mock("../../../services/cache/cache.service");
vi.mock("../../../services/azure-blob-storage.service");

const mockGetPrisma = vi.mocked(getPrisma);
const mockCacheService = vi.mocked(cacheService);
const mockAzureBlobStorageService = vi.mocked(azureBlobStorageService);

describe("Bulk Delete Images Service", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      image: {
        findMany: vi.fn(),
        delete: vi.fn(),
      },
      imageFolder: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should bulk delete images successfully", async () => {
    const request = { imageIds: [1, 2, 3] };
    const userId = 1;

    const mockImages = [
      {
        id: 1,
        url: "https://example.com/image1.jpg",
        folderId: 10,
        folder: { userId: 1 },
      },
      {
        id: 2,
        url: "https://example.com/image2.jpg",
        folderId: 10,
        folder: { userId: 1 },
      },
      {
        id: 3,
        url: "https://example.com/image3.jpg",
        folderId: 11,
        folder: { userId: 1 },
      },
    ];

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findMany.mockResolvedValue(mockImages);
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const mockTx = {
        image: { delete: vi.fn() },
      };
      await callback(mockTx);
    });

    mockPrisma.imageFolder.findUnique.mockResolvedValue({
      id: 10,
      images: [],
    });
    mockCacheService.getUserFolderCache.mockResolvedValue(null);
    mockCacheService.setUserFolderCache.mockResolvedValue(undefined);
    mockAzureBlobStorageService.deleteFile.mockResolvedValue(undefined);

    const result = await bulkDeleteImages(userId, request);

    expect(result.message).toBe("Successfully deleted 3 image(s)");
    expect(result.deletedCount).toBe(3);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
    expect(mockPrisma.image.findMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2, 3] } },
      include: { folder: true },
    });
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockAzureBlobStorageService.deleteFile).toHaveBeenCalledTimes(3);
  });

  it("should handle partial deletion with some failures", async () => {
    const request = { imageIds: [1, 2] };
    const userId = 1;

    const mockImages = [
      {
        id: 1,
        url: "https://example.com/image1.jpg",
        folderId: 10,
        folder: { userId: 1 },
      },
      {
        id: 2,
        url: "https://example.com/image2.jpg",
        folderId: 10,
        folder: { userId: 1 },
      },
    ];

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findMany.mockResolvedValue(mockImages);
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const mockTx = {
        image: { 
          delete: vi.fn()
            .mockResolvedValueOnce({}) // First delete succeeds
            .mockRejectedValueOnce(new Error("Database error")) // Second delete fails
        },
      };
      await callback(mockTx);
    });

    mockPrisma.imageFolder.findUnique.mockResolvedValue({
      id: 10,
      images: [],
    });
    mockCacheService.getUserFolderCache.mockResolvedValue(null);
    mockCacheService.setUserFolderCache.mockResolvedValue(undefined);
    mockAzureBlobStorageService.deleteFile.mockResolvedValue(undefined);

    const result = await bulkDeleteImages(userId, request);

    expect(result.deletedCount).toBe(1);
    expect(result.failedIds).toEqual([2]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors![0]).toContain("Failed to delete image 2");
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    const request = { imageIds: [1, 2] };

    await expect(bulkDeleteImages(0, request)).rejects.toThrow(UnauthorizedError);
  });

  it("should throw BadRequestError for invalid request data", async () => {
    const userId = 1;

    // Test empty array
    await expect(bulkDeleteImages(userId, { imageIds: [] })).rejects.toThrow(BadRequestError);

    // Test too many images
    const tooManyIds = Array.from({ length: 51 }, (_, i) => i + 1);
    await expect(bulkDeleteImages(userId, { imageIds: tooManyIds })).rejects.toThrow(BadRequestError);

    // Test duplicate IDs
    await expect(bulkDeleteImages(userId, { imageIds: [1, 1, 2] })).rejects.toThrow(BadRequestError);
  });

  it("should throw NotFoundError when user not found", async () => {
    const request = { imageIds: [1, 2] };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(bulkDeleteImages(userId, request)).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when no images found", async () => {
    const request = { imageIds: [999, 998] };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findMany.mockResolvedValue([]);

    await expect(bulkDeleteImages(userId, request)).rejects.toThrow(NotFoundError);
  });

  it("should throw UnauthorizedError when user doesn't own some images", async () => {
    const request = { imageIds: [1, 2] };
    const userId = 1;

    const mockImages = [
      {
        id: 1,
        url: "https://example.com/image1.jpg",
        folderId: 10,
        folder: { userId: 1 }, // User owns this
      },
      {
        id: 2,
        url: "https://example.com/image2.jpg",
        folderId: 11,
        folder: { userId: 2 }, // Different user owns this
      },
    ];

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findMany.mockResolvedValue(mockImages);

    await expect(bulkDeleteImages(userId, request)).rejects.toThrow(UnauthorizedError);
  });

  it("should update cache for affected folders", async () => {
    const request = { imageIds: [1, 2] };
    const userId = 1;

    const mockImages = [
      {
        id: 1,
        url: "https://example.com/image1.jpg",
        folderId: 10,
        folder: { userId: 1 },
      },
      {
        id: 2,
        url: "https://example.com/image2.jpg",
        folderId: 11,
        folder: { userId: 1 },
      },
    ];

    const mockCachedFolder = {
      id: 10,
      images: [
        { id: 1, name: "image1.jpg" },
        { id: 3, name: "image3.jpg" },
      ],
    };

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findMany.mockResolvedValue(mockImages);
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const mockTx = {
        image: { delete: vi.fn() },
      };
      await callback(mockTx);
    });

    mockCacheService.getUserFolderCache
      .mockResolvedValueOnce(mockCachedFolder) // For folder 10
      .mockResolvedValueOnce(null); // For folder 11

    mockPrisma.imageFolder.findUnique.mockResolvedValue({
      id: 11,
      images: [],
    });
    mockCacheService.setUserFolderCache.mockResolvedValue(undefined);
    mockAzureBlobStorageService.deleteFile.mockResolvedValue(undefined);

    const result = await bulkDeleteImages(userId, request);

    expect(result.deletedCount).toBe(2);
    expect(mockCacheService.getUserFolderCache).toHaveBeenCalledTimes(2);
    expect(mockCacheService.setUserFolderCache).toHaveBeenCalledTimes(2);

    // Check that cached folder was updated to remove deleted image
    const updatedCacheCall = mockCacheService.setUserFolderCache.mock.calls[0];
    expect(updatedCacheCall[3].images).toHaveLength(1); // Should have 1 image left (image3.jpg)
    expect(updatedCacheCall[3].images[0].id).toBe(3);
  });

  it("should handle Azure blob deletion failures gracefully", async () => {
    const request = { imageIds: [1] };
    const userId = 1;

    const mockImages = [
      {
        id: 1,
        url: "https://example.com/image1.jpg",
        folderId: 10,
        folder: { userId: 1 },
      },
    ];

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findMany.mockResolvedValue(mockImages);
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const mockTx = {
        image: { delete: vi.fn() },
      };
      await callback(mockTx);
    });

    mockPrisma.imageFolder.findUnique.mockResolvedValue({
      id: 10,
      images: [],
    });
    mockCacheService.getUserFolderCache.mockResolvedValue(null);
    mockCacheService.setUserFolderCache.mockResolvedValue(undefined);
    mockAzureBlobStorageService.deleteFile.mockRejectedValue(new Error("Azure error"));

    // Should not throw error - Azure failures are handled gracefully
    const result = await bulkDeleteImages(userId, request);

    expect(result.deletedCount).toBe(1);
    expect(result.message).toBe("Successfully deleted 1 image(s)");
  });

  it("should handle cache update failures gracefully", async () => {
    const request = { imageIds: [1] };
    const userId = 1;

    const mockImages = [
      {
        id: 1,
        url: "https://example.com/image1.jpg",
        folderId: 10,
        folder: { userId: 1 },
      },
    ];

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findMany.mockResolvedValue(mockImages);
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const mockTx = {
        image: { delete: vi.fn() },
      };
      await callback(mockTx);
    });

    mockCacheService.getUserFolderCache.mockRejectedValue(new Error("Cache error"));
    mockAzureBlobStorageService.deleteFile.mockResolvedValue(undefined);

    // Should not throw error - cache failures are handled gracefully
    const result = await bulkDeleteImages(userId, request);

    expect(result.deletedCount).toBe(1);
    expect(result.message).toBe("Successfully deleted 1 image(s)");
  });
});