import { describe, it, expect, beforeEach, vi } from "vitest";
import { getPrisma } from "../../lib/prisma";
import { azureBlobStorageService } from "../../services/azure-blob-storage.service";
import {
  BadRequestError,
  UnauthorizedError,
  InternalServerError
} from "../../errors/http-errors";

// Mock dependencies
vi.mock("../../lib/prisma");
vi.mock("../../services/azure-blob-storage.service");
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mock-uuid-1234"),
}));

describe("Single Image Upload Tests", () => {
  let mockPrisma: any;
  let mockAzureService: any;

  // Test utilities
  const createMockFile = (
    mimetype: string = "image/jpeg",
    size: number = 1024 * 1024, // 1MB
    originalname: string = "test.jpg"
  ): Express.Multer.File => ({
    fieldname: "image",
    originalname,
    encoding: "7bit",
    mimetype,
    buffer: Buffer.from("mock-image-data"),
    size,
    destination: "",
    filename: "",
    path: "",
    stream: null as any,
  });

  const mockUser = {
    id: 1,
    email: "test@example.com",
    username: "testuser",
    plan: "FREE",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      image: {
        create: vi.fn().mockResolvedValue({
          id: 1,
          name: "test.jpg",
          url: "https://testcontainer.blob.core.windows.net/digitalsite/users/test@example.com/mock-uuid-1234.jpg",
          size: 1024 * 1024,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    };
    (getPrisma as any).mockReturnValue(mockPrisma);

    // Mock Azure Blob Service
    mockAzureService = {
      isConfigured: vi.fn().mockReturnValue(true),
      uploadBuffer: vi.fn().mockResolvedValue({
        url: "https://testcontainer.blob.core.windows.net/digitalsite/users/test@example.com/mock-uuid-1234.jpg",
        fileName: "digitalsite/users/test@example.com/mock-uuid-1234.jpg",
        size: 1024 * 1024,
        contentType: "image/jpeg",
      }),
    };

    // Apply mocks to the actual service
    Object.assign(azureBlobStorageService, mockAzureService);
  });

  describe("Authentication Tests", () => {
    it("should reject requests without user ID", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const file = createMockFile();

      await expect(
        uploadSingleImage(undefined as any, file)
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should reject requests when user not found in database", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const file = createMockFile();

      await expect(
        uploadSingleImage(1, file)
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should successfully authenticate valid user", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const file = createMockFile();

      const result = await uploadSingleImage(1, file);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, email: true },
      });
      expect(result).toEqual({
        message: "Image uploaded successfully",
        url: expect.stringContaining("digitalsite/users/test@example.com/mock-uuid-1234.jpg"),
      });
    });
  });

  describe("File Validation Tests", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it("should reject requests without file", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");

      await expect(
        uploadSingleImage(1, undefined as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should accept valid image types", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      for (const mimetype of validTypes) {
        const file = createMockFile(mimetype);
        const result = await uploadSingleImage(1, file);
        expect(result.url).toBeDefined();
        expect(result.message).toBe("Image uploaded successfully");
      }
    });

    it("should reject invalid file types", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const invalidTypes = [
        "text/plain",
        "application/pdf",
        "video/mp4",
        "audio/mp3",
      ];

      for (const mimetype of invalidTypes) {
        const file = createMockFile(mimetype);
        await expect(
          uploadSingleImage(1, file)
        ).rejects.toThrow(BadRequestError);
      }
    });

    it("should enforce 5MB file size limit", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const oversizedFile = createMockFile("image/jpeg", 6 * 1024 * 1024); // 6MB

      await expect(
        uploadSingleImage(1, oversizedFile)
      ).rejects.toThrow(BadRequestError);
    });

    it("should accept files within size limit", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const validFile = createMockFile("image/jpeg", 4 * 1024 * 1024); // 4MB

      const result = await uploadSingleImage(1, validFile);
      expect(result.url).toBeDefined();
      expect(result.message).toBe("Image uploaded successfully");
    });
  });

  describe("Azure Blob Upload Tests", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it("should upload to correct path format", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const file = createMockFile("image/png", 1024, "test.png");

      await uploadSingleImage(1, file);

      expect(mockAzureService.uploadBuffer).toHaveBeenCalledWith(
        file.buffer,
        {
          fileName: "mock-uuid-1234.png",
          contentType: "image/png",
          folder: "digitalsite/users/test@example.com",
        }
      );
    });

    it("should handle Azure service not configured", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      mockAzureService.isConfigured.mockReturnValue(false);
      const file = createMockFile();

      await expect(
        uploadSingleImage(1, file)
      ).rejects.toThrow(BadRequestError);
    });

    it("should handle Azure upload failures", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      mockAzureService.uploadBuffer.mockRejectedValue(new Error("Azure upload failed"));
      const file = createMockFile();

      await expect(
        uploadSingleImage(1, file)
      ).rejects.toThrow(InternalServerError);
    });

    it("should preserve file extensions correctly", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const testCases = [
        { originalname: "test.jpg", expected: ".jpg" },
        { originalname: "test.png", expected: ".png" },
        { originalname: "test.gif", expected: ".gif" },
        { originalname: "test.webp", expected: ".webp" },
        { originalname: "test.svg", expected: ".svg" },
        { originalname: "test", expected: ".jpg" }, // fallback
      ];

      for (const testCase of testCases) {
        const file = createMockFile("image/jpeg", 1024, testCase.originalname);
        await uploadSingleImage(1, file);

        expect(mockAzureService.uploadBuffer).toHaveBeenCalledWith(
          expect.any(Buffer),
          expect.objectContaining({
            fileName: `mock-uuid-1234${testCase.expected}`,
          })
        );
      }
    });
  });

  describe("Success Scenarios", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it("should return only URL on successful upload", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const file = createMockFile();

      const result = await uploadSingleImage(1, file);

      expect(result).toEqual({
        message: "Image uploaded successfully",
        url: "https://testcontainer.blob.core.windows.net/digitalsite/users/test@example.com/mock-uuid-1234.jpg",
      });
      expect(Object.keys(result)).toHaveLength(2);
    });

    it("should generate unique UUID for each upload", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const uuid = await import("uuid");

      // Mock different UUIDs for each call
      let callCount = 0;
      (uuid.v4 as any).mockImplementation(() => `mock-uuid-${++callCount}`);

      const file1 = createMockFile();
      const file2 = createMockFile();

      await uploadSingleImage(1, file1);
      await uploadSingleImage(1, file2);

      expect(mockAzureService.uploadBuffer).toHaveBeenNthCalledWith(
        1,
        expect.any(Buffer),
        expect.objectContaining({
          fileName: "mock-uuid-1.jpg",
        })
      );

      expect(mockAzureService.uploadBuffer).toHaveBeenNthCalledWith(
        2,
        expect.any(Buffer),
        expect.objectContaining({
          fileName: "mock-uuid-2.jpg",
        })
      );
    });

    it("should handle different user emails in path", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const userWithDifferentEmail = { ...mockUser, email: "another@example.com" };
      mockPrisma.user.findUnique.mockResolvedValue(userWithDifferentEmail);

      const file = createMockFile();
      await uploadSingleImage(1, file);

      expect(mockAzureService.uploadBuffer).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          folder: "digitalsite/users/another@example.com",
        })
      );
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it("should provide meaningful error messages for invalid file types", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const file = createMockFile("application/pdf");

      await expect(
        uploadSingleImage(1, file)
      ).rejects.toThrow("Invalid file type: application/pdf. Only image files are allowed.");
    });

    it("should provide meaningful error messages for oversized files", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const file = createMockFile("image/jpeg", 6 * 1024 * 1024);

      await expect(
        uploadSingleImage(1, file)
      ).rejects.toThrow("File exceeds 5MB limit.");
    });

    it("should handle database connection errors", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database connection failed"));
      const file = createMockFile();

      await expect(
        uploadSingleImage(1, file)
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle Azure configuration errors gracefully", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      mockAzureService.isConfigured.mockReturnValue(false);
      const file = createMockFile();

      await expect(
        uploadSingleImage(1, file)
      ).rejects.toThrow("Image storage service is not configured");
    });
  });

  describe("URL Format Validation", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it("should return properly formatted Azure blob URL", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const file = createMockFile();

      const result = await uploadSingleImage(1, file);

      expect(result.url).toMatch(/^https:\/\/.*\.blob\.core\.windows\.net\/digitalsite\/users\/.*\/.*\.(jpg|png|gif|webp|svg)$/);
      expect(result.url).toContain("digitalsite/users/test@example.com");
      expect(result.url).toContain("mock-uuid-1234");
    });

    it("should handle special characters in user email", async () => {
      const { uploadSingleImage } = await import("../../services/image/upload-single");
      const userWithSpecialEmail = { ...mockUser, email: "test+special@example.co.uk" };
      mockPrisma.user.findUnique.mockResolvedValue(userWithSpecialEmail);

      mockAzureService.uploadBuffer.mockResolvedValue({
        url: "https://testcontainer.blob.core.windows.net/digitalsite/users/test+special@example.co.uk/mock-uuid-1234.jpg",
        fileName: "digitalsite/users/test+special@example.co.uk/mock-uuid-1234.jpg",
        size: 1024,
        contentType: "image/jpeg",
      });

      const file = createMockFile();
      const result = await uploadSingleImage(1, file);

      expect(result.url).toContain("test+special@example.co.uk");
      expect(mockAzureService.uploadBuffer).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          folder: "digitalsite/users/test+special@example.co.uk",
        })
      );
    });
  });
});