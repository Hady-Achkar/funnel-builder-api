import { describe, it, expect, vi, beforeEach } from "vitest";
import { getImageFolderById } from "../service/get-folder-by-id.service";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import { UnauthorizedError, NotFoundError } from "../../../errors";

vi.mock("../../../lib/prisma");
vi.mock("../../../services/cache/cache.service");

const mockGetPrisma = vi.mocked(getPrisma);
const mockCacheService = vi.mocked(cacheService);

describe("Get Folder By Id Service", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      imageFolder: {
        findFirst: vi.fn(),
      },
    };

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should get folder from cache when available", async () => {
    const params = { id: "1" };
    const userId = 1;
    const cachedFolder = {
      id: 1,
      name: "Test Folder",
      userId: 1,
      images: [{ id: 1, name: "test.jpg", url: "https://example.com/test.jpg", createdAt: new Date() }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCacheService.get.mockResolvedValue(cachedFolder);

    const result = await getImageFolderById(userId, params as any);

    expect(result).toEqual(cachedFolder);
    expect(mockCacheService.get).toHaveBeenCalledWith("user:1:folder:1:full");
    expect(mockPrisma.imageFolder.findFirst).not.toHaveBeenCalled();
  });

  it("should get folder from database when not in cache", async () => {
    const params = { id: "1" };
    const userId = 1;
    const folderFromDb = {
      id: 1,
      name: "Test Folder",
      userId: 1,
      images: [{ id: 1, name: "test.jpg", url: "https://example.com/test.jpg", createdAt: new Date() }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCacheService.get.mockResolvedValue(null);
    mockPrisma.imageFolder.findFirst.mockResolvedValue(folderFromDb);
    mockCacheService.set.mockResolvedValue(undefined);

    const result = await getImageFolderById(userId, params as any);

    expect(result).toEqual(folderFromDb);
    expect(mockPrisma.imageFolder.findFirst).toHaveBeenCalledWith({
      where: { id: 1, userId: 1 },
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
    expect(mockCacheService.set).toHaveBeenCalledWith("user:1:folder:1:full", expect.any(Object), { ttl: 0 });
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(getImageFolderById(0, { id: "1" } as any)).rejects.toThrow(UnauthorizedError);
  });

  it("should throw NotFoundError when folder not found in database", async () => {
    mockCacheService.get.mockResolvedValue(null);
    mockPrisma.imageFolder.findFirst.mockResolvedValue(null);

    await expect(getImageFolderById(1, { id: "1" } as any)).rejects.toThrow(NotFoundError);
  });

  it("should handle cache errors gracefully", async () => {
    const params = { id: "1" };
    const userId = 1;
    const folderFromDb = {
      id: 1,
      name: "Test Folder",
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [],
    };

    mockCacheService.get.mockRejectedValue(new Error("Cache error"));
    mockPrisma.imageFolder.findFirst.mockResolvedValue(folderFromDb);
    mockCacheService.set.mockRejectedValue(new Error("Cache error"));

    const result = await getImageFolderById(userId, params as any);

    expect(result).toEqual(folderFromDb);
    expect(mockPrisma.imageFolder.findFirst).toHaveBeenCalled();
  });
});