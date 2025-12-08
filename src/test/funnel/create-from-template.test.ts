import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CreateFunnelFromTemplateService } from "../../services/funnel/create-from-template";
import { CreateFunnelFromTemplateController } from "../../controllers/funnel/create-from-template";
import { getPrisma } from "../../lib/prisma";
import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  PageType,
  UserPlan,
  WorkspaceStatus,
} from "../../generated/prisma-client";
import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { WorkspaceFunnelAllocations } from "../../utils/allocations/workspace-funnel-allocations";
import { cacheService } from "../../services/cache/cache.service";
import * as generateSlugModule from "../../utils/funnel-utils/generate-slug";

vi.mock("../../lib/prisma");
vi.mock("../../utils/workspace-utils/workspace-permission-manager/permission-manager");
vi.mock("../../utils/allocations/workspace-funnel-allocations");
vi.mock("../../services/cache/cache.service");
vi.mock("../../utils/funnel-utils/generate-slug");

describe("Create Funnel From Template", () => {
  let mockPrisma: {
    user: { findUnique: ReturnType<typeof vi.fn> };
    workspace: { findUnique: ReturnType<typeof vi.fn> };
    template: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    funnel: { create: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    theme: { create: ReturnType<typeof vi.fn> };
    funnelSettings: { create: ReturnType<typeof vi.fn> };
    page: { createMany: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const userId = 1;

  const validRequestBody = {
    name: "My New Funnel",
    workspaceSlug: "test-workspace",
    templateSlug: "test-template",
  };

  const mockTemplatePages = [
    {
      id: 1,
      name: "Landing Page",
      content: '{"blocks":[]}',
      order: 0,
      type: PageType.PAGE,
      linkingId: "landing-123",
      seoTitle: "Landing Page Title",
      seoDescription: "Landing description",
      seoKeywords: "landing,page",
    },
    {
      id: 2,
      name: "Thank You",
      content: '{"blocks":[{"type":"text"}]}',
      order: 1,
      type: PageType.RESULT,
      linkingId: "thankyou-456",
      seoTitle: "Thank You Title",
      seoDescription: "Thank you description",
      seoKeywords: "thank,you",
    },
  ];

  const mockWorkspace = {
    id: 1,
    name: "Test Workspace",
    slug: "test-workspace",
    status: WorkspaceStatus.ACTIVE,
    ownerId: 1,
    owner: {
      plan: UserPlan.BUSINESS,
      addOns: [],
    },
  };

  const mockTemplate = {
    id: 1,
    slug: "test-template",
    isActive: true,
    isPublic: true,
    pages: mockTemplatePages,
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
      funnel: {
        create: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      theme: {
        create: vi.fn(),
      },
      funnelSettings: {
        create: vi.fn(),
      },
      page: {
        createMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as ReturnType<typeof vi.fn>).mockReturnValue(mockPrisma);
    (PermissionManager.can as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: true,
    });
    (WorkspaceFunnelAllocations.canCreateFunnel as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (cacheService.del as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (generateSlugModule.generateSlug as ReturnType<typeof vi.fn>).mockResolvedValue("my-new-funnel");

    mockReq = {
      userId: userId,
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

  describe("Authentication", () => {
    it("should reject unauthenticated requests", async () => {
      mockReq.userId = undefined;

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Please log in to create a funnel from template");
    });
  });

  describe("Validation", () => {
    it("should reject empty name", async () => {
      mockReq.body = { ...validRequestBody, name: "" };

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Funnel name cannot be empty");
    });

    it("should reject missing workspaceSlug", async () => {
      mockReq.body = { ...validRequestBody, workspaceSlug: undefined };

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Workspace slug is required");
    });

    it("should reject missing templateSlug", async () => {
      mockReq.body = { ...validRequestBody, templateSlug: undefined };

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Template slug is required");
    });

    it("should reject empty slug when provided", async () => {
      mockReq.body = { ...validRequestBody, slug: "" };

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Slug cannot be empty");
    });
  });

  describe("Business Logic", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
    });

    it("should reject non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("User not found");
    });

    it("should reject non-existent workspace", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Workspace not found");
    });

    it("should reject when user lacks CREATE_FUNNEL permission", async () => {
      (PermissionManager.can as ReturnType<typeof vi.fn>).mockResolvedValue({
        allowed: false,
        reason: "You don't have permission to create funnels",
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("You don't have permission to create funnels");
    });

    it("should reject when funnel allocation limit is reached", async () => {
      (WorkspaceFunnelAllocations.canCreateFunnel as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (WorkspaceFunnelAllocations.getAllocationSummary as ReturnType<typeof vi.fn>).mockReturnValue({
        totalAllocation: 2,
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toContain("You've reached the maximum of 2 funnels");
    });

    it("should reject non-existent template", async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Template not found");
    });

    it("should reject inactive template", async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        ...mockTemplate,
        isActive: false,
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Template is not active");
    });

    it("should reject non-public template", async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        ...mockTemplate,
        isPublic: false,
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Template is not public");
    });

    it("should reject template with no pages", async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        ...mockTemplate,
        pages: [],
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Cannot create funnel from a template with no pages");
    });
  });

  describe("Successful Creation", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
    });

    it("should create funnel successfully with correct response", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "My New Funnel", slug: "my-new-funnel" }),
            update: vi.fn().mockResolvedValue({ id: 1 }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          page: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          template: {
            update: vi.fn().mockResolvedValue({ id: 1, usageCount: 1 }),
          },
        };
        return callback(txMock);
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Funnel created successfully"),
          funnelId: 1,
          funnelSlug: "my-new-funnel",
        })
      );
    });

    it("should copy exact linkingId from template pages", async () => {
      let capturedPages: Array<{ linkingId: string | null }> = [];

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "My New Funnel", slug: "my-new-funnel" }),
            update: vi.fn().mockResolvedValue({ id: 1 }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          page: {
            createMany: vi.fn().mockImplementation((args: { data: typeof capturedPages }) => {
              capturedPages = args.data;
              return Promise.resolve({ count: args.data.length });
            }),
          },
          template: {
            update: vi.fn().mockResolvedValue({ id: 1, usageCount: 1 }),
          },
        };
        return callback(txMock);
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(capturedPages).toHaveLength(2);
      expect(capturedPages[0].linkingId).toBe("landing-123");
      expect(capturedPages[1].linkingId).toBe("thankyou-456");
    });

    it("should copy all page fields correctly", async () => {
      let capturedPages: Array<{
        funnelId: number;
        name: string;
        content: string | null;
        order: number;
        type: PageType;
        linkingId: string | null;
        seoTitle: string | null;
        seoDescription: string | null;
        seoKeywords: string | null;
      }> = [];

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 10, name: "My New Funnel", slug: "my-new-funnel" }),
            update: vi.fn().mockResolvedValue({ id: 10 }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          page: {
            createMany: vi.fn().mockImplementation((args: { data: typeof capturedPages }) => {
              capturedPages = args.data;
              return Promise.resolve({ count: args.data.length });
            }),
          },
          template: {
            update: vi.fn().mockResolvedValue({ id: 1, usageCount: 1 }),
          },
        };
        return callback(txMock);
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(capturedPages[0]).toEqual(
        expect.objectContaining({
          funnelId: 10,
          name: "Landing Page",
          content: '{"blocks":[]}',
          order: 0,
          type: PageType.PAGE,
          linkingId: "landing-123",
          seoTitle: "Landing Page Title",
          seoDescription: "Landing description",
          seoKeywords: "landing,page",
        })
      );

      expect(capturedPages[1]).toEqual(
        expect.objectContaining({
          funnelId: 10,
          name: "Thank You",
          content: '{"blocks":[{"type":"text"}]}',
          order: 1,
          type: PageType.RESULT,
          linkingId: "thankyou-456",
          seoTitle: "Thank You Title",
          seoDescription: "Thank you description",
          seoKeywords: "thank,you",
        })
      );
    });

    it("should increment template usage count", async () => {
      let templateUpdateCalled = false;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "My New Funnel", slug: "my-new-funnel" }),
            update: vi.fn().mockResolvedValue({ id: 1 }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          page: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          template: {
            update: vi.fn().mockImplementation((args: { where: { id: number }; data: { usageCount: { increment: number } } }) => {
              templateUpdateCalled = true;
              expect(args.where.id).toBe(mockTemplate.id);
              expect(args.data.usageCount).toEqual({ increment: 1 });
              return Promise.resolve({ id: 1, usageCount: 1 });
            }),
          },
        };
        return callback(txMock);
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(templateUpdateCalled).toBe(true);
    });
  });

  describe("Password Protection (Workspace Status)", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
    });

    it("should set password protection when workspace is DRAFT", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        status: WorkspaceStatus.DRAFT,
      });

      let capturedSettings: {
        isPasswordProtected: boolean;
        passwordHash: string | null;
      } | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "My New Funnel", slug: "my-new-funnel" }),
            update: vi.fn().mockResolvedValue({ id: 1 }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockImplementation((args: { data: typeof capturedSettings }) => {
              capturedSettings = args.data;
              return Promise.resolve({ id: 1 });
            }),
          },
          page: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          template: {
            update: vi.fn().mockResolvedValue({ id: 1, usageCount: 1 }),
          },
        };
        return callback(txMock);
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(capturedSettings?.isPasswordProtected).toBe(true);
      expect(capturedSettings?.passwordHash).not.toBeNull();
    });

    it("should NOT set password protection when workspace is ACTIVE", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        status: WorkspaceStatus.ACTIVE,
      });

      let capturedSettings: {
        isPasswordProtected: boolean;
        passwordHash: string | null;
      } | null = null;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "My New Funnel", slug: "my-new-funnel" }),
            update: vi.fn().mockResolvedValue({ id: 1 }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockImplementation((args: { data: typeof capturedSettings }) => {
              capturedSettings = args.data;
              return Promise.resolve({ id: 1 });
            }),
          },
          page: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          template: {
            update: vi.fn().mockResolvedValue({ id: 1, usageCount: 1 }),
          },
        };
        return callback(txMock);
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(capturedSettings?.isPasswordProtected).toBe(false);
      expect(capturedSettings?.passwordHash).toBeNull();
    });
  });

  describe("Cache Invalidation", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
    });

    it("should invalidate correct cache keys after creation", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "My New Funnel", slug: "my-new-funnel" }),
            update: vi.fn().mockResolvedValue({ id: 1 }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          page: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          template: {
            update: vi.fn().mockResolvedValue({ id: 1, usageCount: 1 }),
          },
        };
        return callback(txMock);
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${mockWorkspace.id}:funnels:all`);
      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${mockWorkspace.id}:funnels:list`);
      expect(cacheService.del).toHaveBeenCalledWith(`user:${userId}:workspace:${mockWorkspace.id}:funnels`);
    });
  });

  describe("Optional Slug", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
    });

    it("should use provided slug when given", async () => {
      mockReq.body = { ...validRequestBody, slug: "custom-slug" };
      (generateSlugModule.generateSlug as ReturnType<typeof vi.fn>).mockResolvedValue("custom-slug");

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "My New Funnel", slug: "custom-slug" }),
            update: vi.fn().mockResolvedValue({ id: 1 }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          page: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          template: {
            update: vi.fn().mockResolvedValue({ id: 1, usageCount: 1 }),
          },
        };
        return callback(txMock);
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(generateSlugModule.generateSlug).toHaveBeenCalledWith(
        expect.anything(),
        "custom-slug",
        mockWorkspace.id
      );
    });

    it("should generate slug from name when slug is not provided", async () => {
      mockReq.body = { ...validRequestBody };
      delete mockReq.body.slug;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "My New Funnel", slug: "my-new-funnel" }),
            update: vi.fn().mockResolvedValue({ id: 1 }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          page: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          template: {
            update: vi.fn().mockResolvedValue({ id: 1, usageCount: 1 }),
          },
        };
        return callback(txMock);
      });

      await CreateFunnelFromTemplateController.create(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(generateSlugModule.generateSlug).toHaveBeenCalledWith(
        expect.anything(),
        "My New Funnel",
        mockWorkspace.id
      );
    });
  });

  describe("Service Unit Tests", () => {
    it("should throw NotFoundError when user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        CreateFunnelFromTemplateService.create({
          userId: 999,
          data: validRequestBody,
        })
      ).rejects.toThrow("User not found");
    });

    it("should throw NotFoundError when workspace does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        CreateFunnelFromTemplateService.create({
          userId,
          data: validRequestBody,
        })
      ).rejects.toThrow("Workspace not found");
    });

    it("should throw NotFoundError when template does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(null);

      await expect(
        CreateFunnelFromTemplateService.create({
          userId,
          data: validRequestBody,
        })
      ).rejects.toThrow("Template not found");
    });
  });
});
