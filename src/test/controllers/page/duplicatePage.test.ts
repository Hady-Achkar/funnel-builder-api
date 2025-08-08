import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { duplicatePage } from "../../../controllers/page/duplicatePage";
import { PageService } from "../../../services/page";

vi.mock("../../../services/page", () => ({
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

  it("should duplicate page successfully within same funnel", async () => {
    const mockDuplicatedPage = {
      id: 2,
      name: "Test Page (Copy)",
      linkingId: "test-page-copy",
      order: 2,
      funnelId: 1,
      message: "Page duplicated successfully",
    };

    vi.mocked(PageService.duplicatePage).mockResolvedValue(mockDuplicatedPage);

    await duplicatePage(req as AuthRequest, res as Response);

    expect(PageService.duplicatePage).toHaveBeenCalledWith(1, 1, {
      targetFunnelId: undefined,
      newName: undefined,
      newLinkingId: undefined,
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      id: 2,
      name: "Test Page (Copy)",
      linkingId: "test-page-copy",
      order: 2,
      funnelId: 1,
      message: "Page duplicated successfully",
    });
  });

  it("should duplicate page to different funnel", async () => {
    req.body = {
      targetFunnelId: "2",
      newName: "Custom Name",
      newLinkingId: "custom-linking-id",
    };

    const mockDuplicatedPage = {
      id: 3,
      name: "Custom Name",
      linkingId: "custom-linking-id",
      order: 1,
      funnelId: 2,
      message: "Page duplicated successfully",
    };

    vi.mocked(PageService.duplicatePage).mockResolvedValue(mockDuplicatedPage);

    await duplicatePage(req as AuthRequest, res as Response);

    expect(PageService.duplicatePage).toHaveBeenCalledWith(1, 1, {
      targetFunnelId: 2,
      newName: "Custom Name",
      newLinkingId: "custom-linking-id",
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      id: 3,
      name: "Custom Name",
      linkingId: "custom-linking-id",
      order: 1,
      funnelId: 2,
      message: "Page duplicated successfully",
    });
  });

  it("should return 400 for invalid page ID", async () => {
    req.params = { pageId: "invalid" };

    await duplicatePage(req as AuthRequest, res as Response);

    expect(PageService.duplicatePage).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid page ID",
    });
  });

  it("should return 400 for missing page ID", async () => {
    req.params = {};

    await duplicatePage(req as AuthRequest, res as Response);

    expect(PageService.duplicatePage).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid page ID",
    });
  });

  it("should return 400 for invalid target funnel ID", async () => {
    req.body = { targetFunnelId: "invalid" };

    await duplicatePage(req as AuthRequest, res as Response);

    expect(PageService.duplicatePage).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid target funnel ID",
    });
  });

  it("should handle service errors", async () => {
    vi.mocked(PageService.duplicatePage).mockRejectedValue(
      new Error("Page not found")
    );

    await duplicatePage(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Page not found",
    });
  });

  it("should handle generic errors", async () => {
    vi.mocked(PageService.duplicatePage).mockRejectedValue("Unknown error");

    await duplicatePage(req as AuthRequest, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Failed to duplicate page",
    });
  });

  it("should parse numeric string IDs correctly", async () => {
    req.params = { pageId: "123" };
    req.body = { targetFunnelId: "456" };

    const mockDuplicatedPage = {
      id: 789,
      name: "Duplicated Page",
      linkingId: "duplicated-page",
      order: 3,
      funnelId: 456,
      message: "Page duplicated successfully",
    };

    vi.mocked(PageService.duplicatePage).mockResolvedValue(mockDuplicatedPage);

    await duplicatePage(req as AuthRequest, res as Response);

    expect(PageService.duplicatePage).toHaveBeenCalledWith(123, 1, {
      targetFunnelId: 456,
      newName: undefined,
      newLinkingId: undefined,
    });

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should handle undefined targetFunnelId correctly", async () => {
    req.body = { targetFunnelId: undefined };

    const mockDuplicatedPage = {
      id: 2,
      name: "Test Page (Copy)",
      linkingId: "test-page-copy",
      order: 2,
      funnelId: 1,
      message: "Page duplicated successfully",
    };

    vi.mocked(PageService.duplicatePage).mockResolvedValue(mockDuplicatedPage);

    await duplicatePage(req as AuthRequest, res as Response);

    expect(PageService.duplicatePage).toHaveBeenCalledWith(1, 1, {
      targetFunnelId: undefined,
      newName: undefined,
      newLinkingId: undefined,
    });

    expect(res.status).toHaveBeenCalledWith(201);
  });
});