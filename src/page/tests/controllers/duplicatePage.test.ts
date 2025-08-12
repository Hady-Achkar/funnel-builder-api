import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { duplicatePage } from "../../controllers/duplicatePage";
import { PageService } from "../../services";

vi.mock("../../services", () => ({
  PageService: {
    duplicatePage: vi.fn(),
  },
}));

describe("duplicatePage Controller", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      userId: 1,
      params: { pageId: "1" },
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it("should duplicate page successfully", async () => {
    const mockResponse = {
      message: "Page Test Page (Copy) duplicated successfully",
    };

    vi.mocked(PageService.duplicatePage).mockResolvedValue(mockResponse);

    await duplicatePage(req as AuthRequest, res as Response);

    expect(PageService.duplicatePage).toHaveBeenCalledWith(
      { pageId: 1 },
      1,
      {}
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Page Test Page (Copy) duplicated successfully",
    });
  });

  it("should duplicate page with custom data", async () => {
    req.body = {
      targetFunnelId: 2,
      newName: "Custom Name",
      newLinkingId: "custom-linking-id",
    };

    const mockResponse = {
      message: "Page Custom Name duplicated successfully",
    };

    vi.mocked(PageService.duplicatePage).mockResolvedValue(mockResponse);

    await duplicatePage(req as AuthRequest, res as Response);

    expect(PageService.duplicatePage).toHaveBeenCalledWith(
      { pageId: 1 },
      1,
      {
        targetFunnelId: 2,
        newName: "Custom Name",
        newLinkingId: "custom-linking-id",
      }
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Page Custom Name duplicated successfully",
    });
  });

  it("should return 401 for missing authentication", async () => {
    req.userId = undefined;

    await duplicatePage(req as AuthRequest, res as Response);

    expect(PageService.duplicatePage).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Authentication required",
    });
  });

  it("should handle service errors", async () => {
    vi.mocked(PageService.duplicatePage).mockRejectedValue(
      new Error("Page not found or you don't have access")
    );

    await duplicatePage(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Page not found or you don't have access",
    });
  });

  it("should handle validation errors from Zod", async () => {
    vi.mocked(PageService.duplicatePage).mockRejectedValue(
      new Error("Invalid input: Page ID must be positive")
    );

    await duplicatePage(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid input: Page ID must be positive",
    });
  });

  it("should handle generic errors", async () => {
    vi.mocked(PageService.duplicatePage).mockRejectedValue("Unknown error");

    await duplicatePage(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "An unexpected error occurred",
    });
  });
});