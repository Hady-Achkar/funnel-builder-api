import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserImageFolders } from "../service/get-user-folders.service";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import { UnauthorizedError, NotFoundError } from "../../../errors";

vi.mock("../../../lib/prisma");
vi.mock("../../../services/cache/cache.service");

const mockGetPrisma = vi.mocked(getPrisma);
const mockCacheService = vi.mocked(cacheService);

describe("Get User Folders Service", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      imageFolder: {
        findMany: vi.fn(),
      },
    };

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should get user folders from cache when available", async () => {
    const userId = 1;
    const cachedResponse = {
      folders: [
        {
          id: 1,
          name: "Test Folder 1",
          userId: 1,
          imageCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    mockCacheService.get.mockResolvedValue(cachedResponse);

    const result = await getUserImageFolders(userId);

    expect(result).toEqual(cachedResponse);
    expect(mockCacheService.get).toHaveBeenCalledWith("user:1:folders:summary");
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.imageFolder.findMany).not.toHaveBeenCalled();
  });

  it("should get user folders from database when not in cache", async () => {
    const userId = 1;
    const mockFolders = [
      {
        id: 1,
        name: "Test Folder 1",
        userId: 1,
        _count: { images: 5 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "Test Folder 2",
        userId: 1,
        _count: { images: 3 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockCacheService.get.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.imageFolder.findMany.mockResolvedValue(mockFolders);
    mockCacheService.set.mockResolvedValue(undefined);

    const result = await getUserImageFolders(userId);

    expect(result.folders).toHaveLength(2);
    expect(result.folders[0].imageCount).toBe(5);
    expect(result.folders[1].imageCount).toBe(3);

    expect(mockPrisma.imageFolder.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      include: { _count: { select: { images: true } } },
      orderBy: { createdAt: "desc" },
    });
    expect(mockCacheService.set).toHaveBeenCalledWith("user:1:folders:summary", expect.any(Object), { ttl: 0 });
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(getUserImageFolders(0)).rejects.toThrow(UnauthorizedError);
  });

  it("should throw NotFoundError when user not found", async () => {
    mockCacheService.get.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(getUserImageFolders(1)).rejects.toThrow(NotFoundError);
  });

  it("should return empty result when user has no folders", async () => {
    mockCacheService.get.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.imageFolder.findMany.mockResolvedValue([]);
    mockCacheService.set.mockResolvedValue(undefined);

    const result = await getUserImageFolders(1);

    expect(result.folders).toEqual([]);
  });

  it("should handle cache errors gracefully", async () => {
    const userId = 1;
    const mockFolders = [
      {
        id: 1,
        name: "Test Folder",
        userId: 1,
        _count: { images: 2 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockCacheService.get.mockRejectedValue(new Error("Cache error"));
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.imageFolder.findMany.mockResolvedValue(mockFolders);
    mockCacheService.set.mockRejectedValue(new Error("Cache error"));

    const result = await getUserImageFolders(userId);

    expect(result.folders).toHaveLength(1);
    expect(result.folders[0].imageCount).toBe(2);
  });

});