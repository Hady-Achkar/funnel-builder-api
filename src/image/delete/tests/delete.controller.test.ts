import { Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteImageController } from "../controller/delete.controller";
import { deleteImage } from "../service/delete.service";
import { UnauthorizedError } from "../../../errors";
import { AuthRequest } from "../../../middleware/auth";

vi.mock("../service/delete.service");

const mockDeleteImage = vi.mocked(deleteImage);

describe("Delete Image Controller", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      params: { imageId: "1" },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should delete image successfully", async () => {
    const mockResponse = { message: "Image deleted successfully" };
    mockDeleteImage.mockResolvedValue(mockResponse);

    await deleteImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockDeleteImage).toHaveBeenCalledWith(1, mockReq.params);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await deleteImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockDeleteImage.mockRejectedValue(error);

    await deleteImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});