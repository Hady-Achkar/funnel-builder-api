import { Request, Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteImageFolderController } from "../controller/delete.controller";
import { deleteImageFolder } from "../service/delete.service";
import { UnauthorizedError } from "../../../errors";

vi.mock("../service/delete.service", () => ({
  deleteImageFolder: vi.fn(),
}));

import { deleteImageFolder as mockDeleteImageFolderImport } from "../service/delete.service";
const mockDeleteImageFolder = vi.mocked(mockDeleteImageFolderImport);

describe("Delete Image Folder Controller", () => {
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

  it("should delete image folder successfully", async () => {
    const mockResponse = { message: "Deleted successfully" };
    mockDeleteImageFolder.mockResolvedValue(mockResponse);

    await deleteImageFolderController(mockReq as any, mockRes as Response, mockNext);

    expect(mockDeleteImageFolder).toHaveBeenCalledWith(1, { id: 1 });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await deleteImageFolderController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockDeleteImageFolder.mockRejectedValue(error);

    await deleteImageFolderController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});