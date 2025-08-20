import { Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateFormController } from "../controller/update.controller";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError, BadRequestError } from "../../../errors";

vi.mock("../service/update.service", () => ({
  updateForm: vi.fn(),
}));

import { updateForm } from "../service/update.service";
const mockUpdateForm = vi.mocked(updateForm);

describe("Update Form Controller", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
      params: { id: "1" },
      body: {
        name: "Updated Form",
        description: "Updated Description",
      },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should update form successfully", async () => {
    const mockResponse = { 
      message: "Form updated successfully"
    };
    mockUpdateForm.mockResolvedValue(mockResponse);

    await updateFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockUpdateForm).toHaveBeenCalledWith(1, 1, mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await updateFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockUpdateForm).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when form ID is invalid", async () => {
    mockReq.params = { id: "invalid" };

    await updateFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockUpdateForm).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when form ID is missing", async () => {
    mockReq.params = {};

    await updateFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockUpdateForm).not.toHaveBeenCalled();
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockUpdateForm.mockRejectedValue(error);

    await updateFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should handle partial updates", async () => {
    mockReq.body = { name: "Only Name Updated" };
    const mockResponse = { 
      message: "Form updated successfully"
    };
    mockUpdateForm.mockResolvedValue(mockResponse);

    await updateFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockUpdateForm).toHaveBeenCalledWith(1, 1, { name: "Only Name Updated" });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should handle large form ID", async () => {
    mockReq.params = { id: "999999" };
    const mockResponse = { 
      message: "Form updated successfully"
    };
    mockUpdateForm.mockResolvedValue(mockResponse);

    await updateFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockUpdateForm).toHaveBeenCalledWith(1, 999999, mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});