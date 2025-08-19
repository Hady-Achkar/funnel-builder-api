import { Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateImageController } from "../controller/update.controller";
import { updateImage } from "../service/update.service";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { AuthRequest } from "../../../middleware/auth";

vi.mock("../service/update.service");

const mockUpdateImage = vi.mocked(updateImage);

describe("Update Image Controller", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      params: { imageId: "1" },
      body: { name: "Updated Image", altText: "Updated alt text" },
      files: {
        image: [{
          fieldname: "image",
          originalname: "updated.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          buffer: Buffer.from("updated"),
          size: 1500,
        } as Express.Multer.File]
      },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should update image successfully with file and form data", async () => {
    const mockResponse = { message: "Image updated successfully" };
    mockUpdateImage.mockResolvedValue(mockResponse);

    await updateImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockUpdateImage).toHaveBeenCalledWith(
      1,
      mockReq.params,
      { name: "Updated Image", altText: "Updated alt text" },
      (mockReq.files as any).image[0]
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should update image with only form data (no file)", async () => {
    mockReq.files = undefined;
    const mockResponse = { message: "Image updated successfully" };
    mockUpdateImage.mockResolvedValue(mockResponse);

    await updateImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockUpdateImage).toHaveBeenCalledWith(
      1,
      mockReq.params,
      { name: "Updated Image", altText: "Updated alt text" },
      undefined
    );
  });

  it("should update image with only file (no form data)", async () => {
    mockReq.body = {};
    const mockResponse = { message: "Image updated successfully" };
    mockUpdateImage.mockResolvedValue(mockResponse);

    await updateImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockUpdateImage).toHaveBeenCalledWith(
      1,
      mockReq.params,
      { name: undefined, altText: undefined },
      (mockReq.files as any).image[0]
    );
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await updateImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("should throw BadRequestError when no updates provided", async () => {
    mockReq.body = {};
    mockReq.files = undefined;

    await updateImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockUpdateImage.mockRejectedValue(error);

    await updateImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});