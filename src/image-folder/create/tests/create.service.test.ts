import { describe, it, expect, vi, beforeEach } from "vitest";
import { createImageFolder } from "../service/create.service";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import { UnauthorizedError, BadRequestError, NotFoundError } from "../../../errors";

vi.mock("../../../lib/prisma");
vi.mock("../../../services/cache/cache.service");

const mockGetPrisma = vi.mocked(getPrisma);
const mockCacheService = vi.mocked(cacheService);

describe("Create Image Folder Service", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      imageFolder: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should create image folder successfully", async () => {
    const request = { name: "Test Folder" };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.imageFolder.findUnique.mockResolvedValue(null); // No existing folder
    mockPrisma.imageFolder.create.mockResolvedValue({
      id: 1,
      name: "Test Folder",
      userId: 1,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockCacheService.setUserFolderCache.mockResolvedValue(undefined);

    const result = await createImageFolder(userId, request);

    expect(result.message).toBe("Image folder created successfully");
    expect(mockPrisma.imageFolder.create).toHaveBeenCalledWith({
      data: {
        name: "Test Folder",
        userId: 1,
      },
      include: {
        images: true,
      },
    });
    expect(mockCacheService.setUserFolderCache).toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(createImageFolder(0, { name: "Test Folder" })).rejects.toThrow(UnauthorizedError);
  });

  it("should throw NotFoundError when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(createImageFolder(1, { name: "Test Folder" })).rejects.toThrow(NotFoundError);
  });

  it("should throw BadRequestError when folder name already exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.imageFolder.findUnique.mockResolvedValue({
      id: 1,
      name: "Test Folder",
      userId: 1,
    }); // Existing folder

    await expect(createImageFolder(1, { name: "Test Folder" })).rejects.toThrow(BadRequestError);
  });

  it("should handle cache errors gracefully", async () => {
    const request = { name: "Test Folder" };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.imageFolder.findUnique.mockResolvedValue(null);
    mockPrisma.imageFolder.create.mockResolvedValue({
      id: 1,
      name: "Test Folder",
      userId: 1,
      images: [],
    });

    mockCacheService.setUserFolderCache.mockRejectedValue(new Error("Cache error"));

    const result = await createImageFolder(userId, request);

    expect(result.message).toBe("Image folder created successfully");
    expect(mockPrisma.imageFolder.create).toHaveBeenCalled();
  });

  it("should validate folder name", async () => {
    await expect(createImageFolder(1, { name: "" })).rejects.toThrow(BadRequestError);
  });
});