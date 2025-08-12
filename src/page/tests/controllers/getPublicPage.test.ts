import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { getPublicPage } from "../../controllers/getPublicPage";
import { PageService } from "../../services";

vi.mock("../../services", () => ({
  PageService: {
    getPublicPage: vi.fn(),
  },
}));

describe("getPublicPage Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      params: { 
        funnelId: "1", 
        linkingId: "test-page" 
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it("should get public page successfully", async () => {
    const mockResponse = {
      data: {
        id: 1,
        name: "Test Page",
        content: "<h1>Test</h1>",
        linkingId: "test-page",
        seoTitle: "Test Page",
        seoDescription: "A test page",
        seoKeywords: "test",
        funnelName: "Test Funnel",
        funnelId: 1,
      },
    };

    vi.mocked(PageService.getPublicPage).mockResolvedValue(mockResponse);

    await getPublicPage(req as Request, res as Response);

    expect(PageService.getPublicPage).toHaveBeenCalledWith({
      funnelId: 1,
      linkingId: "test-page",
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockResponse.data,
    });
  });

  it("should handle page not found", async () => {
    vi.mocked(PageService.getPublicPage).mockRejectedValue(
      new Error("Page not found")
    );

    await getPublicPage(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Page not found",
    });
  });

  it("should handle page not publicly accessible", async () => {
    vi.mocked(PageService.getPublicPage).mockRejectedValue(
      new Error("This page is not publicly accessible")
    );

    await getPublicPage(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "This page is not publicly accessible",
    });
  });

  it("should handle validation errors from Zod", async () => {
    vi.mocked(PageService.getPublicPage).mockRejectedValue(
      new Error("Invalid input: Funnel ID must be positive")
    );

    await getPublicPage(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid input: Funnel ID must be positive",
    });
  });

  it("should handle generic errors", async () => {
    vi.mocked(PageService.getPublicPage).mockRejectedValue("Unknown error");

    await getPublicPage(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "An unexpected error occurred",
    });
  });
});