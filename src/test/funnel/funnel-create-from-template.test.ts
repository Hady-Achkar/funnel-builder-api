import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createFromTemplate } from "../../services/funnel/createFromTemplate";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { $Enums } from "../../generated/prisma-client";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

describe("Create Funnel From Template Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const templateId = 1;
  const workspaceId = 1;
  const workspaceSlug = "test-workspace";

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Prisma client
    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
      template: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      funnel: {
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      theme: {
        create: vi.fn(),
      },
      funnelSettings: {
        create: vi.fn(),
      },
      page: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);

    // Mock cache service
    (cacheService.del as any).mockResolvedValue(undefined);
    (cacheService.set as any).mockResolvedValue(undefined);
    (cacheService.get as any).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("should require user to be logged in", async () => {
      await expect(
        createFromTemplate(templateId, null as any, {
          name: "Test Funnel",
          workspaceSlug,
        })
      ).rejects.toThrow("User ID is required");
    });

    it("should throw error when workspace not found", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        createFromTemplate(templateId, userId, {
          name: "Test Funnel",
          workspaceSlug: "non-existent",
        })
      ).rejects.toThrow("workspace does not exist");
    });

    it("should throw error when template not found", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(null);

      await expect(
        createFromTemplate(templateId, userId, {
          name: "Test Funnel",
          workspaceSlug,
        })
      ).rejects.toThrow("Template not found");
    });

    it("should throw error when template is not active", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      const template = {
        id: templateId,
        name: "Template",
        isActive: false,
        isPublic: true,
        pages: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(template);

      await expect(
        createFromTemplate(templateId, userId, {
          name: "Test Funnel",
          workspaceSlug,
        })
      ).rejects.toThrow("Template is not available");
    });

    it("should throw error when template is not public", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      const template = {
        id: templateId,
        name: "Template",
        isActive: true,
        isPublic: false,
        pages: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(template);

      await expect(
        createFromTemplate(templateId, userId, {
          name: "Test Funnel",
          workspaceSlug,
        })
      ).rejects.toThrow("Template is not available");
    });

    it("should allow workspace owner to create funnel from template", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: userId,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      const template = {
        id: templateId,
        name: "Template",
        isActive: true,
        isPublic: true,
        pages: [
          {
            id: 1,
            name: "Home",
            content: "<div>Home page</div>",
            linkingId: "home",
            order: 1,
            type: $Enums.PageType.PAGE,
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
        ],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(template);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: "DRAFT",
              workspaceId,
              createdBy: userId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              activeTheme: { id: 1 },
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              linkingId: "abc12345",
            }),
          },
          template: {
            update: vi.fn().mockResolvedValue({
              id: templateId,
              usageCount: 1,
            }),
          },
        };

        return await callback(tx);
      });

      const result = await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(result.message).toContain("successfully");
      expect(result.funnelId).toBe(1);
    });

    it("should allow admin to create funnel from template", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: 999,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      const member = {
        role: $Enums.WorkspaceRole.ADMIN,
        permissions: [],
      };

      const template = {
        id: templateId,
        name: "Template",
        isActive: true,
        isPublic: true,
        pages: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(template);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      const result = await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(result.funnelId).toBe(1);
    });

    it("should allow editor with CREATE_FUNNELS permission", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: 999,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      const member = {
        role: $Enums.WorkspaceRole.EDITOR,
        permissions: [$Enums.WorkspacePermission.CREATE_FUNNELS],
      };

      const template = {
        id: templateId,
        name: "Template",
        isActive: true,
        isPublic: true,
        pages: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(template);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      const result = await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(result.funnelId).toBe(1);
    });

    it("should deny editor without CREATE_FUNNELS permission", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: 999,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      const member = {
        role: $Enums.WorkspaceRole.EDITOR,
        permissions: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(member);

      await expect(
        createFromTemplate(templateId, userId, {
          name: "Test Funnel",
          workspaceSlug,
        })
      ).rejects.toThrow("permission");
    });

    it("should deny non-member from creating funnel", async () => {
      const workspace = {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: 999,
        owner: {
          plan: $Enums.UserPlan.BUSINESS,
          addOns: [],
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        createFromTemplate(templateId, userId, {
          name: "Test Funnel",
          workspaceSlug,
        })
      ).rejects.toThrow();
    });
  });

  describe("Workspace Limits", () => {
    const workspace = {
      id: workspaceId,
      name: "Test Workspace",
      ownerId: userId,
      owner: {
        plan: $Enums.UserPlan.BUSINESS,
        addOns: [],
      },
    };

    const template = {
      id: templateId,
      name: "Template",
      isActive: true,
      isPublic: true,
      pages: [],
    };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.template.findUnique.mockResolvedValue(template);
    });

    it("should check funnel allocation before creation", async () => {
      mockPrisma.funnel.count.mockResolvedValue(0);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(mockPrisma.funnel.count).toHaveBeenCalledWith({
        where: { workspaceId: workspace.id },
      });
    });

    it("should reject when workspace funnel limit reached (BUSINESS plan: 1 funnel)", async () => {
      mockPrisma.funnel.count.mockResolvedValue(1); // Already at limit

      await expect(
        createFromTemplate(templateId, userId, {
          name: "Test Funnel",
          workspaceSlug,
        })
      ).rejects.toThrow(/maximum.*1.*funnel/i);
    });

    it("should allow creation when space available", async () => {
      mockPrisma.funnel.count.mockResolvedValue(0);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      const result = await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(result.funnelId).toBe(1);
    });

    it("should provide proper error message with limit information", async () => {
      mockPrisma.funnel.count.mockResolvedValue(1);

      await expect(
        createFromTemplate(templateId, userId, {
          name: "Test Funnel",
          workspaceSlug,
        })
      ).rejects.toThrow(/upgrade your plan/i);
    });
  });

  describe("Template Functionality", () => {
    const workspace = {
      id: workspaceId,
      name: "Test Workspace",
      ownerId: userId,
      owner: {
        plan: $Enums.UserPlan.BUSINESS,
        addOns: [],
      },
    };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
    });

    it("should create funnel with template pages in correct order", async () => {
      const template = {
        id: templateId,
        name: "Template",
        isActive: true,
        isPublic: true,
        pages: [
          {
            id: 1,
            name: "Home",
            content: "<div>Home</div>",
            linkingId: "home",
            order: 1,
            type: $Enums.PageType.PAGE,
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
          {
            id: 2,
            name: "About",
            content: "<div>About</div>",
            linkingId: "about",
            order: 2,
            type: $Enums.PageType.PAGE,
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
        ],
      };

      mockPrisma.template.findUnique.mockResolvedValue(template);

      const createdPages: any[] = [];
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              const page = { id: createdPages.length + 1, ...data.data };
              createdPages.push(page);
              return Promise.resolve(page);
            }),
          },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(createdPages).toHaveLength(2);
      expect(createdPages[0].name).toBe("Home");
      expect(createdPages[0].order).toBe(1);
      expect(createdPages[1].name).toBe("About");
      expect(createdPages[1].order).toBe(2);
    });

    it("should generate unique slug from name", async () => {
      const template = {
        id: templateId,
        name: "Template",
        isActive: true,
        isPublic: true,
        pages: [],
      };

      mockPrisma.template.findUnique.mockResolvedValue(template);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              return Promise.resolve({
                id: 1,
                ...data.data,
              });
            }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      await createFromTemplate(templateId, userId, {
        name: "My Funnel",
        workspaceSlug,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should increment template usage count", async () => {
      const template = {
        id: templateId,
        name: "Template",
        isActive: true,
        isPublic: true,
        usageCount: 5,
        pages: [],
      };

      mockPrisma.template.findUnique.mockResolvedValue(template);

      let templateUpdateCalled = false;
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          template: {
            update: vi.fn().mockImplementation((data: any) => {
              templateUpdateCalled = true;
              expect(data.data.usageCount).toEqual({ increment: 1 });
              return Promise.resolve({ id: templateId, usageCount: 6 });
            }),
          },
        };
        return await callback(tx);
      });

      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(templateUpdateCalled).toBe(true);
    });

    it("should create theme and funnel settings", async () => {
      const template = {
        id: templateId,
        name: "Template",
        isActive: true,
        isPublic: true,
        pages: [],
      };

      mockPrisma.template.findUnique.mockResolvedValue(template);

      let themeCreated = false;
      let settingsCreated = false;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: {
            create: vi.fn().mockImplementation(() => {
              themeCreated = true;
              return Promise.resolve({ id: 1 });
            }),
          },
          funnelSettings: {
            create: vi.fn().mockImplementation(() => {
              settingsCreated = true;
              return Promise.resolve({ id: 1 });
            }),
          },
          page: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(themeCreated).toBe(true);
      expect(settingsCreated).toBe(true);
    });
  });

  describe("Linking ID Replacement", () => {
    const workspace = {
      id: workspaceId,
      name: "Test Workspace",
      ownerId: userId,
      owner: {
        plan: $Enums.UserPlan.BUSINESS,
        addOns: [],
      },
    };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
    });

    it("should generate new linking IDs for all pages", async () => {
      const template = {
        id: templateId,
        name: "Template",
        isActive: true,
        isPublic: true,
        pages: [
          {
            id: 1,
            name: "Home",
            content: "<div>Home</div>",
            linkingId: "old-home-id",
            order: 1,
            type: $Enums.PageType.PAGE,
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
        ],
      };

      mockPrisma.template.findUnique.mockResolvedValue(template);

      let createdLinkingId: string | null = null;
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              createdLinkingId = data.data.linkingId;
              return Promise.resolve({ id: 1, ...data.data });
            }),
          },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(createdLinkingId).not.toBe("old-home-id");
      expect(createdLinkingId).toHaveLength(8);
    });

    it("should replace linking IDs in page content", async () => {
      const template = {
        id: templateId,
        name: "Template",
        isActive: true,
        isPublic: true,
        pages: [
          {
            id: 1,
            name: "Home",
            content: '<a href="about-page">Link to about</a>',
            linkingId: "home",
            order: 1,
            type: $Enums.PageType.PAGE,
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
          {
            id: 2,
            name: "About",
            content: "<div>About page</div>",
            linkingId: "about-page",
            order: 2,
            type: $Enums.PageType.PAGE,
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
        ],
      };

      mockPrisma.template.findUnique.mockResolvedValue(template);

      let homePageContent: string | null = null;
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              if (data.data.name === "Home") {
                homePageContent = data.data.content;
              }
              return Promise.resolve({ id: 1, ...data.data });
            }),
          },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(homePageContent).not.toContain("about-page");
      expect(homePageContent).toContain('href="');
    });
  });

  describe("Cache Invalidation", () => {
    const workspace = {
      id: workspaceId,
      name: "Test Workspace",
      ownerId: userId,
      owner: {
        plan: $Enums.UserPlan.BUSINESS,
        addOns: [],
      },
    };

    const template = {
      id: templateId,
      name: "Template",
      isActive: true,
      isPublic: true,
      pages: [],
    };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(template);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });
    });

    it("should delete individual funnel cache key", async () => {
      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnel:1:full`
      );
    });

    it("should delete workspace funnels all cache", async () => {
      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`
      );
    });

    it("should delete workspace funnels list cache", async () => {
      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:list`
      );
    });

    it("should delete user-specific workspace cache", async () => {
      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `user:${userId}:workspace:${workspaceId}:funnels`
      );
    });

    it("should handle cache deletion failures gracefully", async () => {
      (cacheService.del as any).mockRejectedValue(
        new Error("Cache service error")
      );

      const result = await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(result.funnelId).toBe(1);
    });
  });

  describe("Transaction Tests", () => {
    const workspace = {
      id: workspaceId,
      name: "Test Workspace",
      ownerId: userId,
      owner: {
        plan: $Enums.UserPlan.BUSINESS,
        addOns: [],
      },
    };

    const template = {
      id: templateId,
      name: "Template",
      isActive: true,
      isPublic: true,
      pages: [
        {
          id: 1,
          name: "Home",
          content: "<div>Home</div>",
          linkingId: "home",
          order: 1,
          type: $Enums.PageType.PAGE,
          seoTitle: null,
          seoDescription: null,
          seoKeywords: null,
        },
      ],
    };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.template.findUnique.mockResolvedValue(template);
    });

    it("should use transaction for all operations", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should rollback on transaction failure", async () => {
      mockPrisma.$transaction.mockRejectedValue(
        new Error("Transaction failed")
      );

      await expect(
        createFromTemplate(templateId, userId, {
          name: "Test Funnel",
          workspaceSlug,
        })
      ).rejects.toThrow("Transaction failed");
    });
  });

  describe("Edge Cases", () => {
    const workspace = {
      id: workspaceId,
      name: "Test Workspace",
      ownerId: userId,
      owner: {
        plan: $Enums.UserPlan.BUSINESS,
        addOns: [],
      },
    };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
    });

    it("should handle template with no pages", async () => {
      const template = {
        id: templateId,
        name: "Empty Template",
        isActive: true,
        isPublic: true,
        pages: [],
      };

      mockPrisma.template.findUnique.mockResolvedValue(template);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      const result = await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(result.funnelId).toBe(1);
    });

    it("should handle template with many pages (20+)", async () => {
      const pages = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Page ${i + 1}`,
        content: `<div>Page ${i + 1}</div>`,
        linkingId: `page-${i + 1}`,
        order: i + 1,
        type: $Enums.PageType.PAGE,
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
      }));

      const template = {
        id: templateId,
        name: "Large Template",
        isActive: true,
        isPublic: true,
        pages,
      };

      mockPrisma.template.findUnique.mockResolvedValue(template);

      let pagesCreated = 0;
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 1, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: {
            create: vi.fn().mockImplementation(() => {
              pagesCreated++;
              return Promise.resolve({ id: pagesCreated });
            }),
          },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(pagesCreated).toBe(25);
    });

    it("should validate template ID parameter", async () => {
      await expect(
        createFromTemplate(-1, userId, {
          name: "Test Funnel",
          workspaceSlug,
        })
      ).rejects.toThrow();

      await expect(
        createFromTemplate(0, userId, {
          name: "Test Funnel",
          workspaceSlug,
        })
      ).rejects.toThrow();
    });

    it("should return proper success message and funnel ID", async () => {
      const template = {
        id: templateId,
        name: "Template",
        isActive: true,
        isPublic: true,
        pages: [],
      };

      mockPrisma.template.findUnique.mockResolvedValue(template);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 123, name: "Test", slug: "test", workspaceId, createdBy: userId }),
            update: vi.fn().mockResolvedValue({ id: 123, activeTheme: { id: 1 } }),
          },
          theme: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          funnelSettings: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          page: { create: vi.fn().mockResolvedValue({ id: 1 }) },
          template: { update: vi.fn().mockResolvedValue({ id: templateId, usageCount: 1 }) },
        };
        return await callback(tx);
      });

      const result = await createFromTemplate(templateId, userId, {
        name: "Test Funnel",
        workspaceSlug,
      });

      expect(result).toEqual({
        message: expect.stringContaining("successfully"),
        funnelId: 123,
      });
    });
  });
});
