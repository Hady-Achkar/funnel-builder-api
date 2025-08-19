import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteImageFolder } from "../service/delete.service";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import { UnauthorizedError, NotFoundError, BadRequestError } from "../../../errors";

vi.mock("../../../lib/prisma");
vi.mock("../../../services/cache/cache.service");
const mockGetPrisma = vi.mocked(getPrisma);
const mockCacheService = vi.mocked(cacheService);

describe("Delete Image Folder Service", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      imageFolder: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
      },
      image: {
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should delete empty image folder successfully", async () => {
    const params = { id: 1 };
    const userId = 1;

    mockPrisma.imageFolder.findFirst.mockResolvedValue({
      id: 1,
      name: "Test Folder",
      userId: 1,
    });
    
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      await callback({
        image: { deleteMany: vi.fn() },
        imageFolder: { delete: vi.fn() },
      });
    });

    mockPrisma.imageFolder.findMany.mockResolvedValue([]);
    mockCacheService.del.mockResolvedValue(undefined);
    mockCacheService.set.mockResolvedValue(undefined);

    const result = await deleteImageFolder(userId, params);

    expect(result.message).toBe("Deleted successfully");
    expect(mockPrisma.imageFolder.findFirst).toHaveBeenCalledWith({
      where: { id: 1, userId: 1 },
    });
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("should delete folder with transaction successfully", async () => {
    const params = { id: 1 };
    const userId = 1;

    mockPrisma.imageFolder.findFirst.mockResolvedValue({
      id: 1,
      name: "Test Folder",
      userId: 1,
    });
    
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const mockTx = {
        image: { deleteMany: vi.fn() },
        imageFolder: { delete: vi.fn() },
      };
      await callback(mockTx);
    });

    mockPrisma.imageFolder.findMany.mockResolvedValue([]);
    mockCacheService.del.mockResolvedValue(undefined);
    mockCacheService.set.mockResolvedValue(undefined);

    const result = await deleteImageFolder(userId, params);

    expect(result.message).toBe("Deleted successfully");
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(deleteImageFolder(0, { id: 1 })).rejects.toThrow(UnauthorizedError);
  });

  it("should throw NotFoundError when folder not found", async () => {
    mockPrisma.imageFolder.findFirst.mockResolvedValue(null);

    await expect(deleteImageFolder(1, { id: 1 })).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when folder doesn't belong to user", async () => {
    mockPrisma.imageFolder.findFirst.mockResolvedValue(null); // No folder found for this user

    await expect(deleteImageFolder(1, { id: 1 })).rejects.toThrow(NotFoundError);
  });

  it("should handle cache errors gracefully", async () => {
    const params = { id: 1 };
    const userId = 1;

    mockPrisma.imageFolder.findFirst.mockResolvedValue({
      id: 1,
      userId: 1,
    });
    
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      await callback({
        image: { deleteMany: vi.fn() },
        imageFolder: { delete: vi.fn() },
      });
    });

    mockPrisma.imageFolder.findMany.mockResolvedValue([]);
    mockCacheService.del.mockRejectedValue(new Error("Cache error"));
    mockCacheService.set.mockRejectedValue(new Error("Cache error"));

    const result = await deleteImageFolder(userId, params);

    expect(result.message).toBe("Deleted successfully");
  });


});