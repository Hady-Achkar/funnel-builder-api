import { describe, it, expect, beforeEach, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { updateTemplateController } from "../controller";
import { updateTemplate } from "../service";
import { updateTemplateRequestBody } from "../types";

vi.mock("../service");

describe("updateTemplateController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      files: {},
    };
    res = {
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
    
    // Mock the parse method properly
    vi.spyOn(updateTemplateRequestBody, 'parse').mockImplementation((data) => data);
  });

  it("should update template successfully with valid data", async () => {
    req.params = { id: "1" };
    req.body = {
      name: "Updated Template",
      description: "Updated description",
      categoryId: 2,
      tags: ["tag1", "tag2"],
      isPublic: true,
    };

    const mockResult = {
      message: "Template updated successfully",
      data: { id: 1, ...req.body },
    };

    vi.mocked(updateTemplate).mockResolvedValue(mockResult);

    await updateTemplateController(
      req as Request,
      res as Response,
      next
    );

    expect(updateTemplateRequestBody.parse).toHaveBeenCalledWith(req.body);
    expect(updateTemplate).toHaveBeenCalledWith({
      id: 1,
      ...req.body,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...mockResult,
    });
  });

  it("should update template with thumbnail file", async () => {
    const mockThumbnail = {
      fieldname: "thumbnail",
      originalname: "new-thumb.jpg",
      filename: "new-thumb-123.jpg",
      encoding: "7bit",
      mimetype: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
      size: 1024,
    } as Express.Multer.File;

    req.params = { id: "1" };
    req.body = {
      name: "Updated Template",
    };
    req.files = {
      thumbnail: [mockThumbnail],
    };

    const expectedBody = {
      name: "Updated Template",
      thumbnail: "/uploads/templates/1/thumbnail/new-thumb-123.jpg",
    };

    const mockResult = {
      message: "Template updated successfully",
    };

    vi.mocked(updateTemplate).mockResolvedValue(mockResult);

    await updateTemplateController(
      req as Request,
      res as Response,
      next
    );

    expect(updateTemplateRequestBody.parse).toHaveBeenCalledWith(expectedBody);
    expect(updateTemplate).toHaveBeenCalledWith({
      id: 1,
      ...expectedBody,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...mockResult,
    });
  });

  it("should update template with multiple image files", async () => {
    const mockImages = [
      {
        fieldname: "images",
        originalname: "image1.jpg",
        filename: "image1-123.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake-image-1"),
        size: 2048,
      },
      {
        fieldname: "images",
        originalname: "image2.jpg",
        filename: "image2-456.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake-image-2"),
        size: 2048,
      },
    ] as Express.Multer.File[];

    req.params = { id: "1" };
    req.body = {
      name: "Updated Template",
    };
    req.files = {
      images: mockImages,
    };

    const expectedBody = {
      name: "Updated Template",
      images: [
        "/uploads/templates/1/images/0_image1-123.jpg",
        "/uploads/templates/1/images/1_image2-456.jpg",
      ],
    };

    const mockResult = {
      message: "Template updated successfully",
    };

    vi.mocked(updateTemplate).mockResolvedValue(mockResult);

    await updateTemplateController(
      req as Request,
      res as Response,
      next
    );

    expect(updateTemplateRequestBody.parse).toHaveBeenCalledWith(expectedBody);
    expect(updateTemplate).toHaveBeenCalledWith({
      id: 1,
      ...expectedBody,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...mockResult,
    });
  });

  it("should throw BadRequestError when ID is missing", async () => {
    req.params = {};
    req.body = { name: "Updated Template" };

    await updateTemplateController(
      req as Request,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Valid template ID is required",
      })
    );
    expect(updateTemplate).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should throw BadRequestError when ID is not a number", async () => {
    req.params = { id: "abc" };
    req.body = { name: "Updated Template" };

    await updateTemplateController(
      req as Request,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Valid template ID is required",
      })
    );
    expect(updateTemplate).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should call next with error when service throws", async () => {
    req.params = { id: "1" };
    req.body = {
      name: "Updated Template",
    };

    const error = new Error("Database error");
    vi.mocked(updateTemplate).mockRejectedValue(error);

    await updateTemplateController(
      req as Request,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should handle validation errors", async () => {
    req.params = { id: "1" };
    req.body = { name: "Updated Template" };

    const validationError = new Error("Validation failed");
    vi.mocked(updateTemplateRequestBody.parse).mockImplementation(() => {
      throw validationError;
    });

    await updateTemplateController(
      req as Request,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(validationError);
    expect(updateTemplate).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should handle files with originalname when filename is not provided", async () => {
    const mockThumbnail = {
      fieldname: "thumbnail",
      originalname: "new-thumb.jpg",
      encoding: "7bit",
      mimetype: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
      size: 1024,
    } as Express.Multer.File;

    req.params = { id: "1" };
    req.body = {
      name: "Updated Template",
    };
    req.files = {
      thumbnail: [mockThumbnail],
    };

    const expectedBody = {
      name: "Updated Template",
      thumbnail: "/uploads/templates/1/thumbnail/new-thumb.jpg",
    };

    const mockResult = {
      message: "Template updated successfully",
    };

    vi.mocked(updateTemplate).mockResolvedValue(mockResult);

    await updateTemplateController(
      req as Request,
      res as Response,
      next
    );

    expect(updateTemplateRequestBody.parse).toHaveBeenCalledWith(expectedBody);
    expect(updateTemplate).toHaveBeenCalledWith({
      id: 1,
      ...expectedBody,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...mockResult,
    });
  });
});