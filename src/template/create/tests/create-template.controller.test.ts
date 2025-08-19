import { describe, it, expect, beforeEach, vi } from "vitest";
import { Response, NextFunction } from "express";
import { createTemplateController } from "../controller";
import { createTemplate } from "../service";
import { AuthRequest } from "../../../middleware/auth";

vi.mock("../service");

describe("createTemplateController", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      userId: 1,
      body: {},
      files: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it("should create template successfully with all required data", async () => {
    const mockThumbnail = {
      fieldname: "thumbnail",
      originalname: "thumb.jpg",
      encoding: "7bit",
      mimetype: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
      size: 1024,
    } as Express.Multer.File;

    const mockPreviews = [
      {
        fieldname: "previews",
        originalname: "preview1.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake-preview-1"),
        size: 2048,
      },
      {
        fieldname: "previews",
        originalname: "preview2.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake-preview-2"),
        size: 2048,
      },
    ] as Express.Multer.File[];

    req.files = {
      thumbnail: [mockThumbnail],
      previews: mockPreviews,
    };

    req.body = {
      name: "New Template",
      description: "Template description",
      categoryId: "1",
      funnelId: "2",
      tags: JSON.stringify(["tag1", "tag2"]),
      isPublic: "true",
    };

    const mockResult = {
      message: "Template created successfully",
    };

    vi.mocked(createTemplate).mockResolvedValue(mockResult);

    await createTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(createTemplate).toHaveBeenCalledWith(
      1,
      {
        name: "New Template",
        description: "Template description",
        categoryId: 1,
        funnelId: 2,
        tags: ["tag1", "tag2"],
        isPublic: true,
      },
      mockThumbnail,
      mockPreviews
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    req.userId = undefined;

    await createTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Authentication required",
      })
    );
    expect(createTemplate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when thumbnail is missing", async () => {
    req.files = {
      previews: [],
    };

    req.body = {
      name: "New Template",
      description: "Template description",
      categoryId: "1",
      funnelId: "2",
    };

    await createTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Thumbnail image is required",
      })
    );
    expect(createTemplate).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should handle template creation without preview images", async () => {
    const mockThumbnail = {
      fieldname: "thumbnail",
      originalname: "thumb.jpg",
      encoding: "7bit",
      mimetype: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
      size: 1024,
    } as Express.Multer.File;

    req.files = {
      thumbnail: [mockThumbnail],
    };

    req.body = {
      name: "New Template",
      description: "Template description",
      categoryId: "1",
      funnelId: "2",
      tags: JSON.stringify(["tag1"]),
      isPublic: "false",
    };

    const mockResult = {
      message: "Template created successfully",
    };

    vi.mocked(createTemplate).mockResolvedValue(mockResult);

    await createTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(createTemplate).toHaveBeenCalledWith(
      1,
      {
        name: "New Template",
        description: "Template description",
        categoryId: 1,
        funnelId: 2,
        tags: ["tag1"],
        isPublic: false,
      },
      mockThumbnail,
      []
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it("should handle template creation without tags", async () => {
    const mockThumbnail = {
      fieldname: "thumbnail",
      originalname: "thumb.jpg",
      encoding: "7bit",
      mimetype: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
      size: 1024,
    } as Express.Multer.File;

    req.files = {
      thumbnail: [mockThumbnail],
    };

    req.body = {
      name: "New Template",
      description: "Template description",
      categoryId: "1",
      funnelId: "2",
      isPublic: "true",
    };

    const mockResult = {
      message: "Template created successfully",
    };

    vi.mocked(createTemplate).mockResolvedValue(mockResult);

    await createTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(createTemplate).toHaveBeenCalledWith(
      1,
      {
        name: "New Template",
        description: "Template description",
        categoryId: 1,
        funnelId: 2,
        tags: [],
        isPublic: true,
      },
      mockThumbnail,
      []
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it("should call next with error when service throws", async () => {
    const mockThumbnail = {
      fieldname: "thumbnail",
      originalname: "thumb.jpg",
      encoding: "7bit",
      mimetype: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
      size: 1024,
    } as Express.Multer.File;

    req.files = {
      thumbnail: [mockThumbnail],
    };

    req.body = {
      name: "New Template",
      description: "Template description",
      categoryId: "1",
      funnelId: "2",
      isPublic: "true",
    };

    const error = new Error("Database error");
    vi.mocked(createTemplate).mockRejectedValue(error);

    await createTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should parse boolean string values correctly", async () => {
    const mockThumbnail = {
      fieldname: "thumbnail",
      originalname: "thumb.jpg",
      encoding: "7bit",
      mimetype: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
      size: 1024,
    } as Express.Multer.File;

    req.files = {
      thumbnail: [mockThumbnail],
    };

    req.body = {
      name: "New Template",
      description: "Template description",
      categoryId: "1",
      funnelId: "2",
      tags: JSON.stringify([]),
      isPublic: "false",
    };

    const mockResult = {
      message: "Template created successfully",
    };

    vi.mocked(createTemplate).mockResolvedValue(mockResult);

    await createTemplateController(
      req as AuthRequest,
      res as Response,
      next
    );

    expect(createTemplate).toHaveBeenCalledWith(
      1,
      {
        name: "New Template",
        description: "Template description",
        categoryId: 1,
        funnelId: 2,
        tags: [],
        isPublic: false,
      },
      mockThumbnail,
      []
    );
  });
});