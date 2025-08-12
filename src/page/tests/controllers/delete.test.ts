import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { deletePage } from "../../controllers/delete";
import { PageService } from "../../services";

vi.mock("../../services", () => ({
  PageService: {
    deletePage: vi.fn(),
  },
}));

describe("deletePage Controller", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      userId: 1,
      params: { id: "1" },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it("should delete page successfully", async () => {
    const mockResponse = {
      message: "Page deleted successfully",
    };

    vi.mocked(PageService.deletePage).mockResolvedValue(mockResponse);

    await deletePage(req as AuthRequest, res as Response);

    expect(PageService.deletePage).toHaveBeenCalledWith({ pageId: 1 }, 1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Page deleted successfully",
    });
  });

  it("should return 401 for missing authentication", async () => {
    req.userId = undefined;

    await deletePage(req as AuthRequest, res as Response);

    expect(PageService.deletePage).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Authentication required",
    });
  });

  it("should handle service errors", async () => {
    vi.mocked(PageService.deletePage).mockRejectedValue(
      new Error("Page not found or you don't have access")
    );

    await deletePage(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Page not found or you don't have access",
    });
  });

  it("should handle validation errors from Zod", async () => {
    vi.mocked(PageService.deletePage).mockRejectedValue(
      new Error("Invalid input: Page ID must be positive")
    );

    await deletePage(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid input: Page ID must be positive",
    });
  });

  it("should handle generic errors", async () => {
    vi.mocked(PageService.deletePage).mockRejectedValue("Unknown error");

    await deletePage(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "An unexpected error occurred",
    });
  });
});
