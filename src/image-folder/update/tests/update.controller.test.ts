import { Request, Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateImageFolderController } from "../controller/update.controller";
import { updateImageFolder } from "../service/update.service";
import { UnauthorizedError, BadRequestError } from "../../../errors";

vi.mock("../service/update.service");

const mockUpdateImageFolder = vi.mocked(updateImageFolder);

describe("Update Image Folder Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      params: { id: "1" },
      body: { name: "Updated Folder" },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should update image folder successfully", async () => {
    const mockResponse = { message: "Updated successfully" };
    mockUpdateImageFolder.mockResolvedValue(mockResponse);

    await updateImageFolderController(mockReq as any, mockRes as Response, mockNext);

    expect(mockUpdateImageFolder).toHaveBeenCalledWith(
      1,
      { id: 1 },
      { name: "Updated Folder" }
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await updateImageFolderController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("should throw BadRequestError for invalid folderId", async () => {
    mockReq.params = { id: "invalid" };

    await updateImageFolderController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it("should throw BadRequestError for invalid body data", async () => {
    mockReq.body = { name: "" }; // Invalid empty name

    await updateImageFolderController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockUpdateImageFolder.mockRejectedValue(error);

    await updateImageFolderController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});