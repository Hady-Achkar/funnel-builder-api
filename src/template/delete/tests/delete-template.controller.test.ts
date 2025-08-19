import { describe, it, expect, beforeEach, vi } from "vitest";
import { Response, NextFunction } from "express";
import { deleteTemplateController } from "../controller";
import { deleteTemplate } from "../service";
import { AuthRequest } from "../../../middleware/auth";

vi.mock("../service");

describe("deleteTemplateController", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      userId: 1,
      params: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it("should delete template successfully with valid ID and user", async () => {
    req.params = { id: "1" };

    const mockResult = {
      message: "Template deleted successfully",
      deletedTemplateId: 1,
    };

    vi.mocked(deleteTemplate).mockResolvedValue(mockResult);

    await deleteTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(deleteTemplate).toHaveBeenCalledWith(1, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Template deleted successfully",
      data: { deletedTemplateId: 1 },
    });
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    req.userId = undefined;
    req.params = { id: "1" };

    await deleteTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Authentication required",
      })
    );
    expect(deleteTemplate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when ID is missing", async () => {
    req.params = {};

    await deleteTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Valid template ID is required",
      })
    );
    expect(deleteTemplate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when ID is not a number", async () => {
    req.params = { id: "abc" };

    await deleteTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Valid template ID is required",
      })
    );
    expect(deleteTemplate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when ID is empty string", async () => {
    req.params = { id: "" };

    await deleteTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Valid template ID is required",
      })
    );
    expect(deleteTemplate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should handle negative ID values", async () => {
    req.params = { id: "-1" };

    const mockResult = {
      message: "Template deleted successfully",
      deletedTemplateId: -1,
    };

    vi.mocked(deleteTemplate).mockResolvedValue(mockResult);

    await deleteTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(deleteTemplate).toHaveBeenCalledWith(1, -1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should handle zero as ID", async () => {
    req.params = { id: "0" };

    const mockResult = {
      message: "Template deleted successfully",
      deletedTemplateId: 0,
    };

    vi.mocked(deleteTemplate).mockResolvedValue(mockResult);

    await deleteTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(deleteTemplate).toHaveBeenCalledWith(1, 0);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should call next with error when service throws", async () => {
    req.params = { id: "1" };

    const error = new Error("Template not found");
    vi.mocked(deleteTemplate).mockRejectedValue(error);

    await deleteTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should parse string ID to number correctly", async () => {
    req.params = { id: "123" };
    req.userId = 5;

    const mockResult = {
      message: "Template deleted successfully",
      deletedTemplateId: 123,
    };

    vi.mocked(deleteTemplate).mockResolvedValue(mockResult);

    await deleteTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(deleteTemplate).toHaveBeenCalledWith(5, 123);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Template deleted successfully",
      data: { deletedTemplateId: 123 },
    });
  });

  it("should handle permission errors from service", async () => {
    req.params = { id: "1" };

    const permissionError = new Error("You don't have permission to delete this template");
    vi.mocked(deleteTemplate).mockRejectedValue(permissionError);

    await deleteTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(permissionError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});