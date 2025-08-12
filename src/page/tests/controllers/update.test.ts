import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { updatePage } from "../../controllers/update";
import { PageService } from "../../services";

vi.mock("../../services", () => ({
  PageService: {
    updatePage: vi.fn(),
  },
}));

describe("updatePage Controller", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      userId: 1,
      params: { id: "1" },
      body: {
        name: "Updated Page",
        content: "<h1>Updated Content</h1>",
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it("should update page successfully", async () => {
    const mockResponse = {
      data: {
        id: 1,
        name: "Updated Page",
        content: "<h1>Updated Content</h1>",
        order: 1,
        linkingId: "test-page",
        seoTitle: "Updated Page",
        seoDescription: "Updated description",
        seoKeywords: "updated",
        funnelId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message: "Page updated successfully",
    };

    vi.mocked(PageService.updatePage).mockResolvedValue(mockResponse);

    await updatePage(req as AuthRequest, res as Response);

    expect(PageService.updatePage).toHaveBeenCalledWith(
      { pageId: 1 },
      1,
      {
        name: "Updated Page",
        content: "<h1>Updated Content</h1>",
      }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockResponse.data,
      message: "Page updated successfully",
    });
  });

  it("should return 401 for missing authentication", async () => {
    req.userId = undefined;

    await updatePage(req as AuthRequest, res as Response);

    expect(PageService.updatePage).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Authentication required",
    });
  });

  it("should handle service errors", async () => {
    vi.mocked(PageService.updatePage).mockRejectedValue(
      new Error("Page not found or you don't have access")
    );

    await updatePage(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Page not found or you don't have access",
    });
  });

  it("should handle validation errors from Zod", async () => {
    vi.mocked(PageService.updatePage).mockRejectedValue(
      new Error("Invalid input: Name cannot be empty")
    );

    await updatePage(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid input: Name cannot be empty",
    });
  });

  it("should handle generic errors", async () => {
    vi.mocked(PageService.updatePage).mockRejectedValue("Unknown error");

    await updatePage(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "An unexpected error occurred",
    });
  });
});