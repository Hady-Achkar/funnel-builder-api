import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CreateTemplateFromFunnelService } from "../../services/template/create-from-funnel";
import { CreateTemplateFromFunnelController } from "../../controllers/template/create-from-funnel";
import { getPrisma } from "../../lib/prisma";
import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageType, TemplateImageType } from "../../generated/prisma-client";

vi.mock("../../lib/prisma");

describe("Create Template From Funnel", () => {
  let mockPrisma: {
    user: { findUnique: ReturnType<typeof vi.fn> };
    workspace: { findUnique: ReturnType<typeof vi.fn> };
    templateCategory: { findUnique: ReturnType<typeof vi.fn> };
    funnel: { findFirst: ReturnType<typeof vi.fn> };
    template: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
    templatePage: { createMany: ReturnType<typeof vi.fn> };
    templateImage: { createMany: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const adminUserId = 1;
  const nonAdminUserId = 2;

  const validRequestBody = {
    name: "Test Template",
    slug: "test template",
    description: "A test template description",
    categoryId: 1,
    workspaceSlug: "test-workspace",
    funnelSlug: "test-funnel",
    tags: ["landing", "sales"],
    images: [
      {
        imageUrl: "https://example.com/thumbnail.jpg",
        imageType: TemplateImageType.THUMBNAIL,
        order: 0,
        caption: "Thumbnail",
      },
      {
        imageUrl: "https://example.com/preview1.jpg",
        imageType: TemplateImageType.PREVIEW,
        order: 1,
        caption: "Preview 1",
      },
    ],
  };

  const mockFunnelPages = [
    {
      id: 1,
      name: "Landing Page",
      content: "<div>Content</div>",
      order: 0,
      type: PageType.PAGE,
      linkingId: "abc123",
      seoTitle: "Landing",
      seoDescription: "Landing description",
      seoKeywords: "landing,page",
    },
    {
      id: 2,
      name: "Thank You Page",
      content: "<div>Thank you</div>",
      order: 1,
      type: PageType.PAGE,
      linkingId: "def456",
      seoTitle: "Thank You",
      seoDescription: "Thank you description",
      seoKeywords: "thank,you",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      workspace: {
        findUnique: vi.fn(),
      },
      templateCategory: {
        findUnique: vi.fn(),
      },
      funnel: {
        findFirst: vi.fn(),
      },
      template: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      templatePage: {
        createMany: vi.fn(),
      },
      templateImage: {
        createMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as ReturnType<typeof vi.fn>).mockReturnValue(mockPrisma);

    mockReq = {
      userId: adminUserId,
      body: { ...validRequestBody },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as Partial<Response>;

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("should reject unauthenticated requests", async () => {
      mockReq.userId = undefined;

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Authentication required");
    });

    it("should reject non-admin users", async () => {
      mockReq.userId = nonAdminUserId;

      mockPrisma.user.findUnique.mockResolvedValue({
        id: nonAdminUserId,
        isAdmin: false,
      });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Only administrators can create templates");
    });

    it("should allow admin users to create templates", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: adminUserId,
        isAdmin: true,
      });

      mockPrisma.templateCategory.findUnique.mockResolvedValue({ id: 1 });

      mockPrisma.workspace.findUnique.mockResolvedValue({ id: 1 });

      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: 1,
        pages: mockFunnelPages,
      });

      mockPrisma.template.findUnique.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<{ id: number; slug: string }>) => {
        const txMock = {
          ...mockPrisma,
          template: {
            ...mockPrisma.template,
            create: vi.fn().mockResolvedValue({
              id: 1,
              slug: "test-template",
            }),
          },
          templatePage: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          templateImage: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(txMock);
      });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Template created successfully",
          templateId: 1,
          slug: "test-template",
        })
      );
    });
  });

  describe("Validation", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: adminUserId,
        isAdmin: true,
      });
    });

    it("should reject empty name", async () => {
      mockReq.body = { ...validRequestBody, name: "" };

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Template name cannot be empty");
    });

    it("should reject empty slug", async () => {
      mockReq.body = { ...validRequestBody, slug: "" };

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Slug cannot be empty");
    });

    it("should reject slug with special characters", async () => {
      mockReq.body = { ...validRequestBody, slug: "test@template!" };

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe(
        "Slug can only contain letters, numbers, spaces, and hyphens"
      );
    });

    it("should reject empty description", async () => {
      mockReq.body = { ...validRequestBody, description: "" };

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Description cannot be empty");
    });

    it("should reject missing images array", async () => {
      mockReq.body = { ...validRequestBody, images: undefined };

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it("should reject images without thumbnail", async () => {
      mockReq.body = {
        ...validRequestBody,
        images: [
          {
            imageUrl: "https://example.com/preview.jpg",
            imageType: TemplateImageType.PREVIEW,
            order: 0,
          },
        ],
      };

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Exactly one thumbnail image is required");
    });

    it("should reject multiple thumbnails", async () => {
      mockReq.body = {
        ...validRequestBody,
        images: [
          {
            imageUrl: "https://example.com/thumbnail1.jpg",
            imageType: TemplateImageType.THUMBNAIL,
            order: 0,
          },
          {
            imageUrl: "https://example.com/thumbnail2.jpg",
            imageType: TemplateImageType.THUMBNAIL,
            order: 1,
          },
        ],
      };

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Exactly one thumbnail image is required");
    });

    it("should reject invalid image URL", async () => {
      mockReq.body = {
        ...validRequestBody,
        images: [
          {
            imageUrl: "not-a-valid-url",
            imageType: TemplateImageType.THUMBNAIL,
            order: 0,
          },
        ],
      };

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Image URL must be a valid URL");
    });
  });

  describe("Business Logic", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: adminUserId,
        isAdmin: true,
      });
    });

    it("should reject non-existent category", async () => {
      mockPrisma.templateCategory.findUnique.mockResolvedValue(null);

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Template category not found");
    });

    it("should reject non-existent workspace", async () => {
      mockPrisma.templateCategory.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Workspace not found");
    });

    it("should reject non-existent funnel", async () => {
      mockPrisma.templateCategory.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Funnel not found");
    });

    it("should reject funnel with no pages", async () => {
      mockPrisma.templateCategory.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: 1,
        pages: [],
      });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe(
        "Cannot create template from a funnel with no pages"
      );
    });

    it("should reject duplicate slug", async () => {
      mockPrisma.templateCategory.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: 1,
        pages: mockFunnelPages,
      });
      mockPrisma.template.findUnique.mockResolvedValue({ id: 99 });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("A template with this slug already exists");
    });
  });

  describe("Slug Transformation", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: adminUserId,
        isAdmin: true,
      });
      mockPrisma.templateCategory.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: 1,
        pages: mockFunnelPages,
      });
      mockPrisma.template.findUnique.mockResolvedValue(null);
    });

    it("should transform spaces to hyphens", async () => {
      mockReq.body = { ...validRequestBody, slug: "my test template" };

      let capturedSlug = "";
      mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<{ id: number; slug: string }>) => {
        const txMock = {
          ...mockPrisma,
          template: {
            ...mockPrisma.template,
            create: vi.fn().mockImplementation((args: { data: { slug: string } }) => {
              capturedSlug = args.data.slug;
              return Promise.resolve({ id: 1, slug: args.data.slug });
            }),
          },
          templatePage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
          templateImage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        };
        return callback(txMock);
      });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(capturedSlug).toBe("my-test-template");
    });

    it("should transform uppercase to lowercase", async () => {
      mockReq.body = { ...validRequestBody, slug: "My Test TEMPLATE" };

      let capturedSlug = "";
      mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<{ id: number; slug: string }>) => {
        const txMock = {
          ...mockPrisma,
          template: {
            ...mockPrisma.template,
            create: vi.fn().mockImplementation((args: { data: { slug: string } }) => {
              capturedSlug = args.data.slug;
              return Promise.resolve({ id: 1, slug: args.data.slug });
            }),
          },
          templatePage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
          templateImage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        };
        return callback(txMock);
      });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(capturedSlug).toBe("my-test-template");
    });

    it("should trim leading and trailing spaces/hyphens", async () => {
      mockReq.body = { ...validRequestBody, slug: "  test template  " };

      let capturedSlug = "";
      mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<{ id: number; slug: string }>) => {
        const txMock = {
          ...mockPrisma,
          template: {
            ...mockPrisma.template,
            create: vi.fn().mockImplementation((args: { data: { slug: string } }) => {
              capturedSlug = args.data.slug;
              return Promise.resolve({ id: 1, slug: args.data.slug });
            }),
          },
          templatePage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
          templateImage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        };
        return callback(txMock);
      });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(capturedSlug).toBe("test-template");
    });
  });

  describe("Page Copying", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: adminUserId,
        isAdmin: true,
      });
      mockPrisma.templateCategory.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: 1,
        pages: mockFunnelPages,
      });
      mockPrisma.template.findUnique.mockResolvedValue(null);
    });

    it("should copy all page fields correctly", async () => {
      let capturedPages: Array<{
        templateId: number;
        name: string;
        content: string;
        order: number;
        type: PageType;
        settings: null;
        linkingId: string;
        seoTitle: string;
        seoDescription: string;
        seoKeywords: string;
      }> = [];

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<{ id: number; slug: string }>) => {
        const txMock = {
          ...mockPrisma,
          template: {
            ...mockPrisma.template,
            create: vi.fn().mockResolvedValue({ id: 1, slug: "test-template" }),
          },
          templatePage: {
            createMany: vi.fn().mockImplementation((args: { data: typeof capturedPages }) => {
              capturedPages = args.data;
              return Promise.resolve({ count: args.data.length });
            }),
          },
          templateImage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        };
        return callback(txMock);
      });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(capturedPages).toHaveLength(2);

      // First page
      expect(capturedPages[0]).toEqual(
        expect.objectContaining({
          name: "Landing Page",
          content: "<div>Content</div>",
          order: 0,
          type: PageType.PAGE,
          settings: null,
          linkingId: "abc123",
          seoTitle: "Landing",
          seoDescription: "Landing description",
          seoKeywords: "landing,page",
        })
      );

      // Second page
      expect(capturedPages[1]).toEqual(
        expect.objectContaining({
          name: "Thank You Page",
          content: "<div>Thank you</div>",
          order: 1,
          type: PageType.PAGE,
          settings: null,
          linkingId: "def456",
          seoTitle: "Thank You",
          seoDescription: "Thank you description",
          seoKeywords: "thank,you",
        })
      );
    });

    it("should preserve exact linkingId from original pages", async () => {
      let capturedPages: Array<{ linkingId: string }> = [];

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<{ id: number; slug: string }>) => {
        const txMock = {
          ...mockPrisma,
          template: {
            ...mockPrisma.template,
            create: vi.fn().mockResolvedValue({ id: 1, slug: "test-template" }),
          },
          templatePage: {
            createMany: vi.fn().mockImplementation((args: { data: typeof capturedPages }) => {
              capturedPages = args.data;
              return Promise.resolve({ count: args.data.length });
            }),
          },
          templateImage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        };
        return callback(txMock);
      });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(capturedPages[0].linkingId).toBe("abc123");
      expect(capturedPages[1].linkingId).toBe("def456");
    });
  });

  describe("Optional Fields", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: adminUserId,
        isAdmin: true,
      });
      mockPrisma.templateCategory.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: 1,
        pages: mockFunnelPages,
      });
      mockPrisma.template.findUnique.mockResolvedValue(null);
    });

    it("should create template without tags", async () => {
      mockReq.body = { ...validRequestBody, tags: undefined };

      let capturedTemplateData: { tags: string[] | null } | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<{ id: number; slug: string }>) => {
        const txMock = {
          ...mockPrisma,
          template: {
            ...mockPrisma.template,
            create: vi.fn().mockImplementation((args: { data: { tags: string[] | null } }) => {
              capturedTemplateData = args.data;
              return Promise.resolve({ id: 1, slug: "test-template" });
            }),
          },
          templatePage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
          templateImage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        };
        return callback(txMock);
      });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(capturedTemplateData?.tags).toEqual([]);
    });

    it("should create template with null tags", async () => {
      mockReq.body = { ...validRequestBody, tags: null };

      let capturedTemplateData: { tags: string[] | null } | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<{ id: number; slug: string }>) => {
        const txMock = {
          ...mockPrisma,
          template: {
            ...mockPrisma.template,
            create: vi.fn().mockImplementation((args: { data: { tags: string[] | null } }) => {
              capturedTemplateData = args.data;
              return Promise.resolve({ id: 1, slug: "test-template" });
            }),
          },
          templatePage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
          templateImage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        };
        return callback(txMock);
      });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(capturedTemplateData?.tags).toEqual([]);
    });

    it("should create template with only thumbnail (no preview images)", async () => {
      mockReq.body = {
        ...validRequestBody,
        images: [
          {
            imageUrl: "https://example.com/thumbnail.jpg",
            imageType: TemplateImageType.THUMBNAIL,
            order: 0,
          },
        ],
      };

      mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<{ id: number; slug: string }>) => {
        const txMock = {
          ...mockPrisma,
          template: {
            ...mockPrisma.template,
            create: vi.fn().mockResolvedValue({ id: 1, slug: "test-template" }),
          },
          templatePage: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
          templateImage: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
        };
        return callback(txMock);
      });

      await CreateTemplateFromFunnelController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Service Unit Tests", () => {
    it("should throw NotFoundError when user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        CreateTemplateFromFunnelService.create({
          userId: 999,
          data: validRequestBody,
        })
      ).rejects.toThrow("User not found");
    });

    it("should throw ForbiddenError when user is not admin", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: nonAdminUserId,
        isAdmin: false,
      });

      await expect(
        CreateTemplateFromFunnelService.create({
          userId: nonAdminUserId,
          data: validRequestBody,
        })
      ).rejects.toThrow("Only administrators can create templates");
    });
  });
});
