import { describe, it, expect, beforeEach, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { getAllTemplatesController } from "../controller";
import { getAllTemplates } from "../service/get-all-templates.service";

vi.mock("../service/get-all-templates.service");

describe("getAllTemplatesController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it("should return all templates with 200 status", async () => {
    const mockTemplates = {
      templates: [
        {
          id: 1,
          name: "Template 1",
          slug: "template-1",
          description: "Description 1",
          categoryId: 1,
          categoryName: "Category 1",
          tags: ["tag1", "tag2"],
          createdByUserId: 1,
          usageCount: 5,
          pagesCount: 3,
          thumbnailUrl: "https://example.com/thumb1.jpg",
          previewUrls: ["https://example.com/preview1.jpg"],
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
        },
        {
          id: 2,
          name: "Template 2",
          slug: "template-2",
          description: "Description 2",
          categoryId: 2,
          categoryName: "Category 2",
          tags: ["tag3"],
          createdByUserId: 2,
          usageCount: 10,
          pagesCount: 5,
          thumbnailUrl: "https://example.com/thumb2.jpg",
          previewUrls: ["https://example.com/preview2.jpg"],
          createdAt: new Date("2024-01-03"),
          updatedAt: new Date("2024-01-04"),
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      filters: {
        orderBy: "createdAt",
        order: "desc",
      },
    };

    vi.mocked(getAllTemplates).mockResolvedValue(mockTemplates);

    await getAllTemplatesController(
      req as Request,
      res as Response,
      next
    );

    expect(getAllTemplates).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTemplates);
  });

  it("should pass query parameters to service", async () => {
    req.query = {
      page: "2",
      limit: "20",
      category: "landing-pages",
      orderBy: "usageCount",
      order: "asc",
    };

    const mockTemplates = {
      templates: [],
      pagination: {
        page: 2,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      filters: {
        orderBy: "usageCount",
        order: "asc",
        category: "landing-pages",
      },
    };

    vi.mocked(getAllTemplates).mockResolvedValue(mockTemplates);

    await getAllTemplatesController(
      req as Request,
      res as Response,
      next
    );

    expect(getAllTemplates).toHaveBeenCalledWith({
      page: "2",
      limit: "20",
      category: "landing-pages",
      orderBy: "usageCount",
      order: "asc",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTemplates);
  });

  it("should call next with error when service throws", async () => {
    const error = new Error("Database error");
    vi.mocked(getAllTemplates).mockRejectedValue(error);

    await getAllTemplatesController(
      req as Request,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should handle empty result", async () => {
    const mockTemplates = {
      templates: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      filters: {
        orderBy: "createdAt",
        order: "desc",
      },
    };

    vi.mocked(getAllTemplates).mockResolvedValue(mockTemplates);

    await getAllTemplatesController(
      req as Request,
      res as Response,
      next
    );

    expect(getAllTemplates).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTemplates);
  });
});