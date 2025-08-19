import { Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadImagesController } from "../controller/upload.controller";
import { uploadImages } from "../service/upload.service";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { AuthRequest } from "../../../middleware/auth";

vi.mock("../service/upload.service");

const mockUploadImages = vi.mocked(uploadImages);

describe("Upload Images Controller", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      params: { folderId: "1" },
      files: [
        {
          fieldname: "images",
          originalname: "test.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          buffer: Buffer.from("test"),
          size: 1000,
        } as Express.Multer.File,
      ],
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should upload images successfully", async () => {
    const mockResponse = { message: "Images uploaded successfully" };
    mockUploadImages.mockResolvedValue(mockResponse);

    await uploadImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockUploadImages).toHaveBeenCalledWith(1, mockReq.params, mockReq.files);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await uploadImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("should throw BadRequestError when no files provided", async () => {
    mockReq.files = undefined;

    await uploadImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it("should throw BadRequestError when empty files array", async () => {
    mockReq.files = [];

    await uploadImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockUploadImages.mockRejectedValue(error);

    await uploadImagesController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});