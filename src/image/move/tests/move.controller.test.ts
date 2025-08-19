import { Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { moveImageController } from "../controller/move.controller";
import { moveImage } from "../service/move.service";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { AuthRequest } from "../../../middleware/auth";

vi.mock("../service/move.service");

const mockMoveImage = vi.mocked(moveImage);

describe("Move Image Controller", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      params: { imageId: "1" },
      body: { targetFolderId: 2 },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should move image successfully", async () => {
    const mockResponse = { message: "Image moved successfully" };
    mockMoveImage.mockResolvedValue(mockResponse);

    await moveImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockMoveImage).toHaveBeenCalledWith(1, mockReq.params, mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await moveImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("should throw BadRequestError when no body provided", async () => {
    mockReq.body = null;

    await moveImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockMoveImage.mockRejectedValue(error);

    await moveImageController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});