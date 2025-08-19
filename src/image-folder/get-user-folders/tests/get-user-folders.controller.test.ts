import { Request, Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserImageFoldersController } from "../controller/get-user-folders.controller";
import { getUserImageFolders } from "../service/get-user-folders.service";
import { UnauthorizedError } from "../../../errors";

vi.mock("../service/get-user-folders.service");

const mockGetUserFolders = vi.mocked(getUserImageFolders);

describe("Get User Folders Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      query: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should get user folders successfully", async () => {
    const mockResponse = {
      folders: [
        {
          id: 1,
          name: "Test Folder 1",
          userId: 1,
          imageCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Test Folder 2",
          userId: 1,
          imageCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
    mockGetUserFolders.mockResolvedValue(mockResponse);

    await getUserImageFoldersController(mockReq as any, mockRes as Response, mockNext);

    expect(mockGetUserFolders).toHaveBeenCalledWith(1);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });


  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await getUserImageFoldersController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockGetUserFolders.mockRejectedValue(error);

    await getUserImageFoldersController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

});