import { Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createImageFolderController } from "../controller/create.controller";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError } from "../../../errors";

vi.mock("../service/create.service", () => ({
  createImageFolder: vi.fn(),
}));

import { createImageFolder } from "../service/create.service";
const mockCreateImageFolder = vi.mocked(createImageFolder);

describe("Create Image Folder Controller", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      body: { name: "Test Folder" },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should create image folder successfully", async () => {
    const mockResponse = { message: "Image folder created successfully" };
    mockCreateImageFolder.mockResolvedValue(mockResponse);

    await createImageFolderController(mockReq as any, mockRes as Response, mockNext);

    expect(mockCreateImageFolder).toHaveBeenCalledWith(1, mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await createImageFolderController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockCreateImageFolder.mockRejectedValue(error);

    await createImageFolderController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});