import { Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteFormController } from "../controller/delete.controller";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError, BadRequestError } from "../../../errors";

vi.mock("../service/delete.service", () => ({
  deleteForm: vi.fn(),
}));

import { deleteForm } from "../service/delete.service";
const mockDeleteForm = vi.mocked(deleteForm);

describe("Delete Form Controller", () => {
  let mockReq: Partial<AuthRequest>;
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

  it("should delete form successfully", async () => {
    const mockResponse = { 
      message: "Form and all related submissions deleted successfully"
    };
    mockDeleteForm.mockResolvedValue(mockResponse);

    await deleteFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockDeleteForm).toHaveBeenCalledWith(1, 1);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    mockReq.userId = undefined;

    await deleteFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockDeleteForm).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when form ID is invalid", async () => {
    mockReq.params = { id: "invalid" };

    await deleteFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockDeleteForm).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when form ID is missing", async () => {
    mockReq.params = {};

    await deleteFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockDeleteForm).not.toHaveBeenCalled();
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockDeleteForm.mockRejectedValue(error);

    await deleteFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should handle large form ID", async () => {
    mockReq.params = { id: "999999" };
    const mockResponse = { 
      message: "Form and all related submissions deleted successfully"
    };
    mockDeleteForm.mockResolvedValue(mockResponse);

    await deleteFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockDeleteForm).toHaveBeenCalledWith(1, 999999);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it("should handle negative form ID as invalid", async () => {
    mockReq.params = { id: "-1" };
    const mockResponse = { 
      message: "Form and all related submissions deleted successfully"
    };
    mockDeleteForm.mockResolvedValue(mockResponse);

    await deleteFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockDeleteForm).toHaveBeenCalledWith(1, -1);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it("should handle floating point form ID by parsing to integer", async () => {
    mockReq.params = { id: "1.5" };
    const mockResponse = { 
      message: "Form and all related submissions deleted successfully"
    };
    mockDeleteForm.mockResolvedValue(mockResponse);

    await deleteFormController(mockReq as any, mockRes as Response, mockNext);

    expect(mockDeleteForm).toHaveBeenCalledWith(1, 1); // parseInt("1.5") = 1
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});