import { Request, Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getImageFolderByIdController } from "../controller/get-folder-by-id.controller";
import { getFolderById } from "../service/get-folder-by-id.service";
import { UnauthorizedError } from "../../../errors";

vi.mock("../service/get-folder-by-id.service", () => ({
  getImageFolderById: vi.fn(),
}));

import { getImageFolderById as mockGetFolderByIdImport } from "../service/get-folder-by-id.service";
const mockGetFolderById = vi.mocked(mockGetFolderByIdImport);

describe("Get Folder By Id Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      params: { id: "1" },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should get folder by id successfully", async () => {
    const mockFolder = {
      id: 1,
      name: "Test Folder",
      userId: 1,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockGetFolderById.mockResolvedValue(mockFolder);

    await getImageFolderByIdController(mockReq as any, mockRes as Response, mockNext);

    expect(mockGetFolderById).toHaveBeenCalledWith(1, { id: "1" });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockFolder);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await getImageFolderByIdController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockGetFolderById.mockRejectedValue(error);

    await getImageFolderByIdController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});