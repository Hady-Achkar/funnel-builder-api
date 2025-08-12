import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { reorderPages } from "../../controllers/reorderPages";
import { PageService } from "../../services";

vi.mock("../../services", () => ({
  PageService: {
    reorderPages: vi.fn(),
  },
}));

describe("reorderPages Controller", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      userId: 1,
      params: { funnelId: "1" },
      body: {
        pageOrders: [
          { id: 1, order: 1 },
          { id: 2, order: 2 },
        ],
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it("should reorder pages successfully", async () => {
    const mockResponse = {
      message: "Pages reordered successfully",
    };

    vi.mocked(PageService.reorderPages).mockResolvedValue(mockResponse);

    await reorderPages(req as AuthRequest, res as Response);

    expect(PageService.reorderPages).toHaveBeenCalledWith(
      { funnelId: 1 },
      1,
      {
        pageOrders: [
          { id: 1, order: 1 },
          { id: 2, order: 2 },
        ],
      }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Pages reordered successfully",
    });
  });

  it("should return 401 for missing authentication", async () => {
    req.userId = undefined;

    await reorderPages(req as AuthRequest, res as Response);

    expect(PageService.reorderPages).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Authentication required",
    });
  });

  it("should handle service errors", async () => {
    vi.mocked(PageService.reorderPages).mockRejectedValue(
      new Error("Funnel not found or you don't have access")
    );

    await reorderPages(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Funnel not found or you don't have access",
    });
  });

  it("should handle validation errors from Zod", async () => {
    vi.mocked(PageService.reorderPages).mockRejectedValue(
      new Error("Invalid input: Funnel ID must be positive")
    );

    await reorderPages(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid input: Funnel ID must be positive",
    });
  });

  it("should handle generic errors", async () => {
    vi.mocked(PageService.reorderPages).mockRejectedValue("Unknown error");

    await reorderPages(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "An unexpected error occurred",
    });
  });
});