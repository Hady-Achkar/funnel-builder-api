import { describe, it, expect, vi, beforeEach } from "vitest";
import { moveImage } from "../service/move.service";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import { UnauthorizedError, NotFoundError, BadRequestError } from "../../../errors";

vi.mock("../../../lib/prisma");
vi.mock("../../../services/cache/cache.service");

const mockGetPrisma = vi.mocked(getPrisma);
const mockCacheService = vi.mocked(cacheService);

describe("Move Image Service", () => {
  let mockPrisma: any;

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

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should move image successfully", async () => {
    const params = { imageId: "1" };
    const body = { targetFolderId: "2" };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue({
      id: 1,
      folderId: 1,
      folder: { userId: 1 },
    });
    mockPrisma.imageFolder.findUnique.mockResolvedValue({ id: 2, userId: 1 });
    mockPrisma.image.update.mockResolvedValue({
      id: 1,
      folderId: 2,
      updatedAt: new Date(),
    });

    // Mock cache operations
    mockCacheService.getUserFolderCache
      .mockResolvedValueOnce({ id: 1, images: [{ id: 1 }, { id: 2 }] }) // Source folder
      .mockResolvedValueOnce({ id: 2, images: [{ id: 3 }] }); // Target folder
    mockCacheService.setUserFolderCache.mockResolvedValue(undefined);

    const result = await moveImage(userId, params, body);

    expect(result.message).toBe("Image moved successfully");
    expect(mockPrisma.image.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        folderId: 2,
        updatedAt: expect.any(Date),
      },
    });
    expect(mockCacheService.setUserFolderCache).toHaveBeenCalledTimes(2); // Source and target folder updates
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(moveImage(0, { imageId: "1" }, { targetFolderId: "2" })).rejects.toThrow(UnauthorizedError);
  });

  it("should throw NotFoundError when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(moveImage(1, { imageId: "1" }, { targetFolderId: "2" })).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when image not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue(null);

    await expect(moveImage(1, { imageId: "1" }, { targetFolderId: "2" })).rejects.toThrow(NotFoundError);
  });

  it("should throw UnauthorizedError when user doesn't own image", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue({
      id: 1,
      folder: { userId: 2 }, // Different user
    });

    await expect(moveImage(1, { imageId: "1" }, { targetFolderId: "2" })).rejects.toThrow(UnauthorizedError);
  });

  it("should throw NotFoundError when target folder not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue({
      id: 1,
      folderId: 1,
      folder: { userId: 1 },
    });
    mockPrisma.imageFolder.findUnique.mockResolvedValue(null);

    await expect(moveImage(1, { imageId: "1" }, { targetFolderId: "2" })).rejects.toThrow(NotFoundError);
  });

  it("should throw BadRequestError when image is already in target folder", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue({
      id: 1,
      folderId: 2, // Already in target folder
      folder: { userId: 1 },
    });
    mockPrisma.imageFolder.findUnique.mockResolvedValue({ id: 2, userId: 1 });

    await expect(moveImage(1, { imageId: "1" }, { targetFolderId: "2" })).rejects.toThrow(BadRequestError);
  });

  it("should update cache when source cache exists but target doesn't", async () => {
    const params = { imageId: "1" };
    const body = { targetFolderId: "2" };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.image.findUnique.mockResolvedValue({
      id: 1,
      folderId: 1,
      folder: { userId: 1 },
    });
    mockPrisma.imageFolder.findUnique
      .mockResolvedValueOnce({ id: 2, userId: 1 }) // Target folder lookup
      .mockResolvedValueOnce({ id: 1, images: [] }) // Source folder refresh
      .mockResolvedValueOnce({ id: 2, images: [] }); // Target folder refresh
    
    mockPrisma.image.update.mockResolvedValue({
      id: 1,
      folderId: 2,
      updatedAt: new Date(),
    });

    mockCacheService.getUserFolderCache
      .mockResolvedValueOnce({ id: 1, images: [{ id: 1 }] }) // Source exists
      .mockResolvedValueOnce(null); // Target doesn't exist

    const result = await moveImage(userId, params, body);

    expect(result.message).toBe("Image moved successfully");
    expect(mockCacheService.setUserFolderCache).toHaveBeenCalledTimes(2);
  });
});