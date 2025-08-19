import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadImages } from "../service/upload.service";
import { getPrisma } from "../../../lib/prisma";
import { azureBlobStorageService } from "../../../services/azure-blob-storage.service";
import { cacheService } from "../../../services/cache/cache.service";
import { UnauthorizedError, BadRequestError, NotFoundError } from "../../../errors";

vi.mock("../../../lib/prisma");
vi.mock("../../../services/azure-blob-storage.service");
vi.mock("../../../services/cache/cache.service");

const mockGetPrisma = vi.mocked(getPrisma);
const mockAzureBlobStorageService = vi.mocked(azureBlobStorageService);
const mockCacheService = vi.mocked(cacheService);

describe("Upload Images Service", () => {
  let mockPrisma: any;
  let mockFiles: Express.Multer.File[];

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      imageFolder: {
        findUnique: vi.fn(),
      },
      image: {
        create: vi.fn(),
      },
    };

    mockFiles = [
      {
        fieldname: "images",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
        size: 1000,
      } as Express.Multer.File,
    ];

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should upload images successfully", async () => {
    const params = { folderId: "1" };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.imageFolder.findUnique.mockResolvedValue({ id: 1, userId: 1 });
    mockAzureBlobStorageService.uploadBuffer.mockResolvedValue({
      url: "https://test.com/image.jpg",
      fileName: "test.jpg",
      size: 1000,
      contentType: "image/jpeg",
    });
    mockPrisma.image.create.mockResolvedValue({
      id: 1,
      name: "test.jpg",
      url: "https://test.com/image.jpg",
      altText: null,
      size: 1000,
      folderId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockCacheService.getUserFolderCache.mockResolvedValue(null);
    mockPrisma.imageFolder.findUnique.mockResolvedValue({
      id: 1,
      name: "Test Folder",
      userId: 1,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await uploadImages(userId, params, mockFiles);

    expect(result.message).toBe("Image uploaded successfully");
    expect(mockPrisma.image.create).toHaveBeenCalled();
    expect(mockAzureBlobStorageService.uploadBuffer).toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(uploadImages(0, { folderId: "1" }, mockFiles)).rejects.toThrow(UnauthorizedError);
  });

  it("should throw BadRequestError when no files provided", async () => {
    await expect(uploadImages(1, { folderId: "1" }, [])).rejects.toThrow(BadRequestError);
  });

  it("should throw BadRequestError when too many files", async () => {
    const manyFiles = Array(11).fill(mockFiles[0]);
    await expect(uploadImages(1, { folderId: "1" }, manyFiles)).rejects.toThrow(BadRequestError);
  });

  it("should throw BadRequestError for invalid file type", async () => {
    const invalidFile = { ...mockFiles[0], mimetype: "text/plain" };
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.imageFolder.findUnique.mockResolvedValue({ id: 1, userId: 1 });

    await expect(uploadImages(1, { folderId: "1" }, [invalidFile])).rejects.toThrow(BadRequestError);
  });

  it("should throw BadRequestError for oversized file", async () => {
    const largeFile = { ...mockFiles[0], size: 6 * 1024 * 1024 }; // 6MB
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.imageFolder.findUnique.mockResolvedValue({ id: 1, userId: 1 });

    await expect(uploadImages(1, { folderId: "1" }, [largeFile])).rejects.toThrow(BadRequestError);
  });

  it("should throw NotFoundError when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(uploadImages(1, { folderId: "1" }, mockFiles)).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when folder not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.imageFolder.findUnique.mockResolvedValue(null);

    await expect(uploadImages(1, { folderId: "1" }, mockFiles)).rejects.toThrow(NotFoundError);
  });
});