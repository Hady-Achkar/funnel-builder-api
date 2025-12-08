import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ReplaceTemplateFromFunnelService } from "../../services/template/replace-from-funnel";
import { ReplaceTemplateFromFunnelController } from "../../controllers/template/replace-from-funnel";
import { getPrisma } from "../../lib/prisma";
import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageType } from "../../generated/prisma-client";
import { cacheService } from "../../services/cache/cache.service";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

describe("Replace Template From Funnel", () => {
  let mockPrisma: {
    user: { findUnique: ReturnType<typeof vi.fn> };
    workspace: { findUnique: ReturnType<typeof vi.fn> };
    template: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    templatePage: { deleteMany: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> };
    funnel: { findFirst: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const adminUserId = 1;
  const nonAdminUserId = 2;

  const validRequestBody = {
    workspaceSlug: "test-workspace",
    funnelSlug: "test-funnel",
  };

  const mockFunnelPages = [
    {
      id: 1,
      name: "New Landing Page",
      content: '{"blocks":[{"type":"hero"}]}',
      order: 0,
      type: PageType.PAGE,
      linkingId: "new-landing-123",
      seoTitle: "New Landing Title",
      seoDescription: "New landing description",
      seoKeywords: "new,landing",
    },
    {
      id: 2,
      name: "New Thank You",
      content: '{"blocks":[{"type":"thankyou"}]}',
      order: 1,
      type: PageType.RESULT,
      linkingId: "new-thankyou-456",
      seoTitle: "New Thank You Title",
      seoDescription: "New thank you description",
      seoKeywords: "new,thankyou",
    },
  ];

  const mockTemplate = {
    id: 1,
    slug: "test-template",
    name: "Test Template",
    description: "Test description",
    categoryId: 1,
    tags: ["tag1", "tag2"],
    isActive: true,
    isPublic: true,
    usageCount: 5,
    createdByUserId: adminUserId,
  };

  const mockWorkspace = {
    id: 1,
  };

  const mockFunnel = {
    id: 1,
    slug: "test-funnel",
    pages: mockFunnelPages,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      workspace: {
        findUnique: vi.fn(),
      },
      template: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      templatePage: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      funnel: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as ReturnType<typeof vi.fn>).mockReturnValue(mockPrisma);
    (cacheService.setTemplateCache as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    mockReq = {
      userId: adminUserId,
      params: { templateSlug: "test-template" },
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

      await ReplaceTemplateFromFunnelController.replace(
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

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Only administrators can replace templates");
    });

    it("should allow admin users to replace templates", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: adminUserId,
        isAdmin: true,
      });

      mockPrisma.template.findUnique
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce({
          ...mockTemplate,
          category: { id: 1, name: "Category", slug: "category" },
          pages: mockFunnelPages,
          previewImages: [],
          _count: { pages: 2 },
        });

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          templatePage: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          template: {
            update: vi.fn().mockResolvedValue(mockTemplate),
          },
        };
        return callback(txMock);
      });

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Template pages replaced successfully",
          templateId: mockTemplate.id,
          templateSlug: mockTemplate.slug,
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

    it("should reject missing templateSlug in params", async () => {
      mockReq.params = {};

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Template slug is required");
    });

    it("should reject missing workspaceSlug", async () => {
      mockReq.body = { funnelSlug: "test-funnel" };

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Workspace slug is required");
    });

    it("should reject missing funnelSlug", async () => {
      mockReq.body = { workspaceSlug: "test-workspace" };

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Funnel slug is required");
    });
  });

  describe("Business Logic", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: adminUserId,
        isAdmin: true,
      });
    });

    it("should reject non-existent template", async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Template not found");
    });

    it("should reject non-existent workspace", async () => {
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Workspace not found");
    });

    it("should reject non-existent funnel", async () => {
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Funnel not found");
    });

    it("should reject funnel with no pages", async () => {
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: 1,
        slug: "test-funnel",
        pages: [],
      });

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Cannot replace template from a funnel with no pages");
    });
  });

  describe("Page Replacement", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: adminUserId,
        isAdmin: true,
      });
      mockPrisma.template.findUnique
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce({
          ...mockTemplate,
          category: { id: 1, name: "Category", slug: "category" },
          pages: mockFunnelPages,
          previewImages: [],
          _count: { pages: 2 },
        });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);
    });

    it("should delete all existing pages and create new ones", async () => {
      let deletedPages = false;
      let createdPages: Array<{
        templateId: number;
        name: string;
        linkingId: string | null;
      }> = [];

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          templatePage: {
            deleteMany: vi.fn().mockImplementation((args: { where: { templateId: number } }) => {
              deletedPages = true;
              expect(args.where.templateId).toBe(mockTemplate.id);
              return Promise.resolve({ count: 1 });
            }),
            createMany: vi.fn().mockImplementation((args: { data: typeof createdPages }) => {
              createdPages = args.data;
              return Promise.resolve({ count: args.data.length });
            }),
          },
          template: {
            update: vi.fn().mockResolvedValue(mockTemplate),
          },
        };
        return callback(txMock);
      });

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(deletedPages).toBe(true);
      expect(createdPages).toHaveLength(2);
    });

    it("should copy exact linkingId from funnel pages", async () => {
      let createdPages: Array<{ linkingId: string | null }> = [];

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          templatePage: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            createMany: vi.fn().mockImplementation((args: { data: typeof createdPages }) => {
              createdPages = args.data;
              return Promise.resolve({ count: args.data.length });
            }),
          },
          template: {
            update: vi.fn().mockResolvedValue(mockTemplate),
          },
        };
        return callback(txMock);
      });

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(createdPages[0].linkingId).toBe("new-landing-123");
      expect(createdPages[1].linkingId).toBe("new-thankyou-456");
    });

    it("should copy all page fields correctly", async () => {
      let createdPages: Array<{
        templateId: number;
        name: string;
        content: string | null;
        order: number;
        type: PageType;
        settings: null;
        linkingId: string | null;
        seoTitle: string | null;
        seoDescription: string | null;
        seoKeywords: string | null;
      }> = [];

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          templatePage: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            createMany: vi.fn().mockImplementation((args: { data: typeof createdPages }) => {
              createdPages = args.data;
              return Promise.resolve({ count: args.data.length });
            }),
          },
          template: {
            update: vi.fn().mockResolvedValue(mockTemplate),
          },
        };
        return callback(txMock);
      });

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(createdPages[0]).toEqual(
        expect.objectContaining({
          templateId: mockTemplate.id,
          name: "New Landing Page",
          content: '{"blocks":[{"type":"hero"}]}',
          order: 0,
          type: PageType.PAGE,
          settings: null,
          linkingId: "new-landing-123",
          seoTitle: "New Landing Title",
          seoDescription: "New landing description",
          seoKeywords: "new,landing",
        })
      );

      expect(createdPages[1]).toEqual(
        expect.objectContaining({
          templateId: mockTemplate.id,
          name: "New Thank You",
          content: '{"blocks":[{"type":"thankyou"}]}',
          order: 1,
          type: PageType.RESULT,
          settings: null,
          linkingId: "new-thankyou-456",
          seoTitle: "New Thank You Title",
          seoDescription: "New thank you description",
          seoKeywords: "new,thankyou",
        })
      );
    });
  });

  describe("Cache Update", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: adminUserId,
        isAdmin: true,
      });
      mockPrisma.template.findUnique
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce({
          ...mockTemplate,
          category: { id: 1, name: "Category", slug: "category" },
          pages: mockFunnelPages,
          previewImages: [],
          _count: { pages: 2 },
        });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);
    });

    it("should update both full and summary cache after replacement", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          templatePage: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          template: {
            update: vi.fn().mockResolvedValue(mockTemplate),
          },
        };
        return callback(txMock);
      });

      await ReplaceTemplateFromFunnelController.replace(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(cacheService.setTemplateCache).toHaveBeenCalledWith(
        mockTemplate.id,
        "full",
        expect.any(Object),
        { ttl: 0 }
      );

      expect(cacheService.setTemplateCache).toHaveBeenCalledWith(
        mockTemplate.id,
        "summary",
        expect.any(Object),
        { ttl: 0 }
      );
    });
  });

  describe("Service Unit Tests", () => {
    it("should throw NotFoundError when user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        ReplaceTemplateFromFunnelService.replace({
          userId: 999,
          templateSlug: "test-template",
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
        ReplaceTemplateFromFunnelService.replace({
          userId: nonAdminUserId,
          templateSlug: "test-template",
          data: validRequestBody,
        })
      ).rejects.toThrow("Only administrators can replace templates");
    });

    it("should throw NotFoundError when template does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: adminUserId,
        isAdmin: true,
      });
      mockPrisma.template.findUnique.mockResolvedValue(null);

      await expect(
        ReplaceTemplateFromFunnelService.replace({
          userId: adminUserId,
          templateSlug: "non-existent-template",
          data: validRequestBody,
        })
      ).rejects.toThrow("Template not found");
    });
  });
});
