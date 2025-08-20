import { Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFormController } from "../controller/create.controller";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError } from "../../../errors";

vi.mock("../service/create.service", () => ({
  createForm: vi.fn(),
}));

import { createForm } from "../service/create.service";
const mockCreateForm = vi.mocked(createForm);

describe("Create Form Controller", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      body: {
        name: "Test Form",
        description: "Test Description",
        formContent: { field1: "value1" },
        isActive: true,
      },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should create form successfully", async () => {
    const mockResponse = { 
      message: "Form created successfully",
      formId: 1
    };
    mockCreateForm.mockResolvedValue(mockResponse);

    await createFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockCreateForm).toHaveBeenCalledWith(1, mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await createFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockCreateForm).not.toHaveBeenCalled();
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockCreateForm.mockRejectedValue(error);

    await createFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should handle form with minimal data", async () => {
    mockReq.body = {
      name: "Minimal Form",
      formContent: { field1: "value1" },
    };

    const mockResponse = { 
      message: "Form created successfully",
      formId: 2
    };
    mockCreateForm.mockResolvedValue(mockResponse);

    await createFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockCreateForm).toHaveBeenCalledWith(1, mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });
});