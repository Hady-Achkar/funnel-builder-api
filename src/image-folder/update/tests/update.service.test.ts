import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateImageFolder } from "../service/update.service";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import { UnauthorizedError, BadRequestError, NotFoundError } from "../../../errors";

vi.mock("../../../lib/prisma");
vi.mock("../../../services/cache/cache.service");

const mockGetPrisma = vi.mocked(getPrisma);
const mockCacheService = vi.mocked(cacheService);

describe("Update Image Folder Service", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      imageFolder: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should update image folder successfully", async () => {
    const params = { id: 1 };
    const request = { name: "Updated Folder" };
    const userId = 1;

    mockPrisma.imageFolder.findFirst
      .mockResolvedValueOnce({ id: 1, name: "Old Folder", userId: 1 }) // Existing folder
      .mockResolvedValueOnce(null); // No duplicate name
    mockPrisma.imageFolder.update.mockResolvedValue({
      id: 1,
      name: "Updated Folder",
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [],
    });

    mockPrisma.imageFolder.findMany.mockResolvedValue([]);
    mockCacheService.set.mockResolvedValue(undefined);

    const result = await updateImageFolder(userId, params, request);

    expect(result.message).toBe("Updated successfully");
    expect(mockPrisma.imageFolder.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: "Updated Folder",
        updatedAt: expect.any(Date),
      },
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
    expect(mockCacheService.set).toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(updateImageFolder(0, { id: 1 }, { name: "Test" })).rejects.toThrow(UnauthorizedError);
  });

  it("should throw NotFoundError when folder not found", async () => {
    mockPrisma.imageFolder.findFirst.mockResolvedValue(null);

    await expect(updateImageFolder(1, { id: 1 }, { name: "Test" })).rejects.toThrow(NotFoundError);
  });

  it("should throw BadRequestError when folder name already exists", async () => {
    mockPrisma.imageFolder.findFirst
      .mockResolvedValueOnce({ id: 1, name: "Old Folder", userId: 1 }) // Existing folder
      .mockResolvedValueOnce({ id: 2, name: "New Folder", userId: 1 }); // Duplicate name

    await expect(updateImageFolder(1, { id: 1 }, { name: "New Folder" })).rejects.toThrow(BadRequestError);
  });

  it("should handle cache errors gracefully", async () => {
    mockPrisma.imageFolder.findFirst
      .mockResolvedValueOnce({ id: 1, name: "Old Folder", userId: 1 })
      .mockResolvedValueOnce(null);
    mockPrisma.imageFolder.update.mockResolvedValue({
      id: 1,
      name: "Updated Folder",
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [],
    });

    mockPrisma.imageFolder.findMany.mockResolvedValue([]);
    mockCacheService.set.mockRejectedValue(new Error("Cache error"));

    const result = await updateImageFolder(1, { id: 1 }, { name: "Updated Folder" });

    expect(result.message).toBe("Updated successfully");
    expect(mockPrisma.imageFolder.update).toHaveBeenCalled();
  });

});