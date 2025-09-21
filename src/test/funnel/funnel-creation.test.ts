import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createFunnel } from "../../services/funnel/create";
import { getPrisma } from "../../lib/prisma";
import { format } from "date-fns";
import { $Enums } from "../../generated/prisma-client";

vi.mock("../../lib/prisma");

describe("Funnel Creation Tests", () => {
  let mockPrisma: any;
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
      },
      funnel: {
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Funnel Name Generation", () => {
    it("should use provided name when given", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "My Custom Funnel",
              slug: "my-custom-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "My Custom Funnel",
              slug: "my-custom-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId,
              theme: { id: 1 },
              pages: []
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              type: $Enums.PageType.PAGE
            }),
          },
        };
        return callback(tx);
      });

      const result = await createFunnel(userId, {
        name: "My Custom Funnel",
        workspaceSlug: "test-workspace"
      });

      expect(result.response.message).toBe("Funnel created successfully!");
      expect(result.response.funnelId).toBe(1);
    });

    it.skip("should generate timestamp-based name with seconds when not provided", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: expect.stringMatching(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/),
              slug: expect.stringMatching(/^\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-\d{2}$/),
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: expect.stringMatching(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/),
              slug: expect.stringMatching(/^\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-\d{2}$/),
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId,
              theme: { id: 1 },
              pages: []
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              type: $Enums.PageType.PAGE
            }),
          },
        };
        return callback(tx);
      });

      const result = await createFunnel(userId, {
        workspaceSlug: "test-workspace"
      });

      expect(result.response.message).toBe("Funnel created successfully!");
    });

    it("should handle unique constraint by appending number to slug", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.count.mockResolvedValue(0);

      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: "Test Funnel",
              slug: "test-funnel-1",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId
            }),
            update: vi.fn().mockResolvedValue({
              id: 2,
              name: "Test Funnel",
              slug: "test-funnel-1",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId,
              theme: { id: 1 },
              pages: []
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 2 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              type: $Enums.PageType.PAGE
            }),
          },
        };
        return callback(tx);
      });

      const result = await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug: "test-workspace"
      });

      expect(result.response.funnelId).toBe(2);
    });
  });

  describe("Workspace Validation", () => {
    it("should throw error if workspace does not exist", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        createFunnel(userId, {
          name: "Test Funnel",
          workspaceSlug: "non-existent"
        })
      ).rejects.toThrow("The workspace was not found");
    });

    it("should enforce workspace funnel limit", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.count.mockResolvedValue(3);

      await expect(
        createFunnel(userId, {
          name: "Test Funnel",
          workspaceSlug: "test-workspace"
        })
      ).rejects.toThrow("This workspace has reached its maximum limit of 3 funnels");
    });
  });

  describe("Permissions", () => {
    it("should allow workspace owner to create funnel", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Owners Funnel",
              slug: "owners-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Owners Funnel",
              slug: "owners-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId,
              theme: { id: 1 },
              pages: []
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              type: $Enums.PageType.PAGE
            }),
          },
        };
        return callback(tx);
      });

      const result = await createFunnel(userId, {
        name: "Owners Funnel",
        workspaceSlug: "test-workspace"
      });

      expect(result.response.message).toBe("Funnel created successfully!");
    });

    it("should check member permissions when user is not owner", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: 999 };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        createFunnel(userId, {
          name: "Test Funnel",
          workspaceSlug: "test-workspace"
        })
      ).rejects.toThrow("You don't have access to the \"Test Workspace\" workspace");
    });

    it("should allow admin members to create funnels", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: 999 };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        role: $Enums.WorkspaceRole.ADMIN,
        permissions: [$Enums.WorkspacePermission.CREATE_FUNNEL]
      });
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Admin Funnel",
              slug: "admin-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Admin Funnel",
              slug: "admin-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId,
              theme: { id: 1 },
              pages: []
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              type: $Enums.PageType.PAGE
            }),
          },
        };
        return callback(tx);
      });

      const result = await createFunnel(userId, {
        name: "Admin Funnel",
        workspaceSlug: "test-workspace"
      });

      expect(result.response.message).toBe("Funnel created successfully!");
    });
  });

  describe("Funnel Status", () => {
    it.skip("should use DRAFT status by default", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      let createdFunnelData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelData = data.data;
              return Promise.resolve({
                id: 1,
                ...data.data
              });
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Test Funnel",
              slug: "test-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId,
              theme: { id: 1 },
              pages: []
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              type: $Enums.PageType.PAGE
            }),
          },
        };
        return callback(tx);
      });

      await createFunnel(userId, {
        name: "Test Funnel",
        workspaceSlug: "test-workspace"
      });

      expect(createdFunnelData).not.toBeNull();
      expect(createdFunnelData?.status).toBe($Enums.FunnelStatus.DRAFT);
    });

    it("should accept custom status", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      let createdFunnelData: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelData = data.data;
              return Promise.resolve({
                id: 1,
                ...data.data
              });
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Live Funnel",
              slug: "live-funnel",
              status: $Enums.FunnelStatus.LIVE,
              workspaceId: 1,
              createdBy: userId,
              theme: { id: 1 },
              pages: []
            }),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1, funnelId: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Home",
              order: 1,
              linkingId: "home",
              seoTitle: null,
              seoDescription: null,
              seoKeywords: null,
              type: $Enums.PageType.PAGE
            }),
          },
        };
        return callback(tx);
      });

      await createFunnel(userId, {
        name: "Live Funnel",
        status: $Enums.FunnelStatus.LIVE,
        workspaceSlug: "test-workspace"
      });

      expect(createdFunnelData?.status).toBe($Enums.FunnelStatus.LIVE);
    });
  });

  describe("Transaction and Home Page Creation", () => {
    it("should create theme, settings, and home page in transaction", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      let transactionCalled = false;
      let themeCreated = false;
      let settingsCreated = false;
      let homePageCreated = false;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        transactionCalled = true;
        const tx = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              name: "Complete Funnel",
              slug: "complete-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId
            }),
            update: vi.fn().mockResolvedValue({
              id: 1,
              name: "Complete Funnel",
              slug: "complete-funnel",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: userId,
              theme: { id: 1 },
              pages: []
            }),
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
              return Promise.resolve({ id: 1, funnelId: 1 });
            }),
          },
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              homePageCreated = data.data.name === "Home";
              return Promise.resolve({
                id: 1,
                name: "Home",
                order: 1,
                linkingId: "home",
                seoTitle: null,
                seoDescription: null,
                seoKeywords: null,
                type: $Enums.PageType.PAGE
              });
            }),
          },
        };
        return callback(tx);
      });

      await createFunnel(userId, {
        name: "Complete Funnel",
        workspaceSlug: "test-workspace"
      });

      expect(transactionCalled).toBe(true);
      expect(themeCreated).toBe(true);
      expect(settingsCreated).toBe(true);
      expect(homePageCreated).toBe(true);
    });
  });
});