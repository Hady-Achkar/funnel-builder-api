import { Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { bulkDeleteImagesController } from "../controller/bulk-delete.controller";
import { bulkDeleteImages } from "../service/bulk-delete.service";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { AuthRequest } from "../../../middleware/auth";

vi.mock("../service/bulk-delete.service", () => ({
  bulkDeleteImages: vi.fn(),
}));

import { bulkDeleteImages as mockBulkDeleteImagesImport } from "../service/bulk-delete.service";
const mockBulkDeleteImages = vi.mocked(mockBulkDeleteImagesImport);

describe("Bulk Delete Images Controller", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      body: { imageIds: [1, 2, 3] },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should bulk delete images successfully", async () => {
    const mockResponse = {
      message: "Successfully deleted 3 image(s)",
      deletedCount: 3,
    };
    mockBulkDeleteImages.mockResolvedValue(mockResponse);

    await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockBulkDeleteImages).toHaveBeenCalledWith(1, { imageIds: [1, 2, 3] });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should handle partial deletion with failures", async () => {
    const mockResponse = {
      message: "Successfully deleted 2 image(s)",
      deletedCount: 2,
      failedIds: [3],
      errors: ["Failed to delete image 3: Database error"],
    };
    mockBulkDeleteImages.mockResolvedValue(mockResponse);

    await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockBulkDeleteImages).toHaveBeenCalledWith(1, { imageIds: [1, 2, 3] });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockBulkDeleteImages).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError for invalid request body", async () => {
    mockReq.body = { imageIds: [] }; // Empty array is invalid

    await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockBulkDeleteImages).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError for too many image IDs", async () => {
    const tooManyIds = Array.from({ length: 51 }, (_, i) => i + 1);
    mockReq.body = { imageIds: tooManyIds };

    await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockBulkDeleteImages).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError for duplicate image IDs", async () => {
    mockReq.body = { imageIds: [1, 1, 2] }; // Duplicates not allowed

    await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockBulkDeleteImages).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError for invalid image ID types", async () => {
    mockReq.body = { imageIds: ["1", "2"] }; // Should be numbers, not strings

    await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockBulkDeleteImages).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError for missing imageIds field", async () => {
    mockReq.body = {}; // Missing imageIds

    await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockBulkDeleteImages).not.toHaveBeenCalled();
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockBulkDeleteImages.mockRejectedValue(error);

    await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should validate request body with valid data", async () => {
    const validRequests = [
      { imageIds: [1] }, // Single image
      { imageIds: [1, 2, 3, 4, 5] }, // Multiple images
      { imageIds: Array.from({ length: 50 }, (_, i) => i + 1) }, // Max allowed (50)
    ];

    for (const validBody of validRequests) {
      mockReq.body = validBody;
      const mockResponse = {
        message: `Successfully deleted ${validBody.imageIds.length} image(s)`,
        deletedCount: validBody.imageIds.length,
      };
      mockBulkDeleteImages.mockResolvedValue(mockResponse);

      await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

      expect(mockBulkDeleteImages).toHaveBeenCalledWith(1, validBody);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResponse);

      vi.clearAllMocks();
    }
  });

  it("should handle Zod validation errors specifically", async () => {
    // Test negative numbers
    mockReq.body = { imageIds: [-1, 2] };

    await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockBulkDeleteImages).not.toHaveBeenCalled();

    // Test zero
    vi.clearAllMocks();
    mockReq.body = { imageIds: [0, 2] };

    await bulkDeleteImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockBulkDeleteImages).not.toHaveBeenCalled();
  });
});