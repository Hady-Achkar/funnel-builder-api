import { describe, it, expect, beforeEach, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { getTemplateByIdController } from "../controller";
import { getTemplateById } from "../service";
import { BadRequestError } from "../../../errors";

vi.mock("../service");

describe("getTemplateByIdController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it("should return template with 200 status when valid ID provided", async () => {
    req.params = { id: "1" };

    const mockTemplate = {
      id: 1,
      name: "Template 1",
      slug: "template-1",
      description: "Description 1",
      categoryId: 1,
      category: {
        id: 1,
        name: "Category 1",
        slug: "category-1",
      },
      tags: ["tag1", "tag2"],
      isActive: true,
      isPublic: true,
      createdByUserId: 1,
      usageCount: 5,
      pages: [
        {
          id: 1,
          name: "Page 1",
          content: "Page content",
          order: 1,
          linkingId: "page-1",
          seoTitle: "Page 1 Title",
          seoDescription: "Page 1 Description",
          seoKeywords: "page1, template",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
        },
      ],
      previewImages: [
        {
          id: 1,
          imageUrl: "https://example.com/preview1.jpg",
          imageType: "PREVIEW" as const,
          caption: "Preview 1",
          order: 1,
        },
      ],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    };

    vi.mocked(getTemplateById).mockResolvedValue(mockTemplate);

    await getTemplateByIdController(
      req as Request,
      res as Response,
      next
    );

    expect(getTemplateById).toHaveBeenCalledWith({ id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Template retrieved successfully",
      data: mockTemplate,
    });
  });

  it("should throw BadRequestError when ID is missing", async () => {
    req.params = {};

    await getTemplateByIdController(
      req as Request,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalled();
    const error = (next as any).mock.calls[0][0];
    expect(error).toBeInstanceOf(BadRequestError);
    expect(error.message).toBe("Valid template ID is required");
    expect(getTemplateById).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when ID is not a number", async () => {
    req.params = { id: "abc" };

    await getTemplateByIdController(
      req as Request,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalled();
    const error = (next as any).mock.calls[0][0];
    expect(error).toBeInstanceOf(BadRequestError);
    expect(error.message).toBe("Valid template ID is required");
    expect(getTemplateById).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when ID is empty string", async () => {
    req.params = { id: "" };

    await getTemplateByIdController(
      req as Request,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalled();
    const error = (next as any).mock.calls[0][0];
    expect(error).toBeInstanceOf(BadRequestError);
    expect(error.message).toBe("Valid template ID is required");
    expect(getTemplateById).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should call next with error when service throws", async () => {
    req.params = { id: "1" };

    const error = new Error("Template not found");
    vi.mocked(getTemplateById).mockRejectedValue(error);

    await getTemplateByIdController(
      req as Request,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should handle negative ID values", async () => {
    req.params = { id: "-1" };

    const mockTemplate = {
      id: -1,
      name: "Template",
      slug: "template",
      description: "Description",
      categoryId: 1,
      category: {
        id: 1,
        name: "Category 1",
        slug: "category-1",
      },
      tags: [],
      isActive: true,
      isPublic: false,
      createdByUserId: 1,
      usageCount: 0,
      pages: [],
      previewImages: [],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    };

    vi.mocked(getTemplateById).mockResolvedValue(mockTemplate);

    await getTemplateByIdController(
      req as Request,
      res as Response,
      next
    );

    expect(getTemplateById).toHaveBeenCalledWith({ id: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should handle zero as ID", async () => {
    req.params = { id: "0" };

    const mockTemplate = {
      id: 0,
      name: "Template",
      slug: "template",
      description: "Description",
      categoryId: 1,
      category: {
        id: 1,
        name: "Category 1",
        slug: "category-1",
      },
      tags: [],
      isActive: true,
      isPublic: false,
      createdByUserId: 1,
      usageCount: 0,
      pages: [],
      previewImages: [],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    };

    vi.mocked(getTemplateById).mockResolvedValue(mockTemplate);

    await getTemplateByIdController(
      req as Request,
      res as Response,
      next
    );

    expect(getTemplateById).toHaveBeenCalledWith({ id: 0 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should parse string ID to number correctly", async () => {
    req.params = { id: "123" };

    const mockTemplate = {
      id: 123,
      name: "Template 123",
      slug: "template-123",
      description: "Description 123",
      categoryId: 1,
      category: {
        id: 1,
        name: "Category 1",
        slug: "category-1",
      },
      tags: [],
      isActive: true,
      isPublic: false,
      createdByUserId: 1,
      usageCount: 0,
      pages: [],
      previewImages: [],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    };

    vi.mocked(getTemplateById).mockResolvedValue(mockTemplate);

    await getTemplateByIdController(
      req as Request,
      res as Response,
      next
    );

    expect(getTemplateById).toHaveBeenCalledWith({ id: 123 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Template retrieved successfully",
      data: mockTemplate,
    });
  });
});