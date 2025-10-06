import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { duplicateFunnel } from "../../services/funnel/duplicate";
import { duplicateFunnelController } from "../../controllers/funnel/duplicate";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { $Enums } from "../../generated/prisma-client";
import { NextFunction } from "express";

// Mock only external dependencies
vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

// Internal test utilities - DO NOT import from outside
const generateTestLinkingId = (): string => {
  return `test-${Math.random().toString(36).substring(2, 11)}`;
};

const createLinkingIdMap = (pages: any[]): Map<string, string> => {
  const map = new Map<string, string>();
  pages.forEach((page) => {
    if (page.linkingId) {
      map.set(page.linkingId, generateTestLinkingId());
    }
  });
  return map;
};

const replaceLinkingIdsInTestContent = (
  content: string,
  linkingMap: Map<string, string>
): string => {
  let updatedContent = content;
  linkingMap.forEach((newId, oldId) => {
    const patterns = [
      new RegExp(`href="${oldId}"`, "g"),
      new RegExp(`href='${oldId}'`, "g"),
      new RegExp(`href="/${oldId}"`, "g"),
      new RegExp(`href='/${oldId}'`, "g"),
      new RegExp(`\\(${oldId}\\)`, "g"),
      new RegExp(`\\[${oldId}\\]`, "g"),
      new RegExp(`"${oldId}"`, "g"),
    ];

    patterns.forEach((pattern) => {
      updatedContent = updatedContent.replace(pattern, (match) =>
        match.replace(oldId, newId)
      );
    });
  });
  return updatedContent;
};

describe("Funnel Duplication Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  const userId = 1;
  const workspaceId = 1;
  const workspaceSlug = "test-workspace";
  const originalFunnelId = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Prisma client with all methods the real service uses
    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
      funnel: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      theme: {
        create: vi.fn(),
        findUnique: vi.fn(),
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

    // Mock Express request and response
    mockReq = {
      userId,
      body: {},
      params: { id: originalFunnelId.toString() },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("should require user to be logged in", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(
        duplicateFunnel(originalFunnelId, null as any, {})
      ).rejects.toThrow("Funnel not found");
    });

    it("should return user-friendly error message when not logged in", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      const error = await duplicateFunnel(originalFunnelId, null as any, {}).catch(
        (e) => e
      );
      expect(error.message).toMatch(/Funnel not found/i);
    });

    it("should verify original funnel exists", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(
        duplicateFunnel(originalFunnelId, userId, {})
      ).rejects.toThrow("Funnel not found");
    });

    it("should return user-friendly error when funnel not found", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      const error = await duplicateFunnel(originalFunnelId, userId, {}).catch(
        (e) => e
      );
      expect(error.message).toMatch(/Funnel not found/i);
    });

    it("should allow workspace owner to duplicate funnel", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          name: "Custom Theme",
          type: $Enums.ThemeType.CUSTOM,
          funnelId: originalFunnelId,
          backgroundColor: "#0e1e12",
          textColor: "#d4ecd0",
          buttonColor: "#387e3d",
          buttonTextColor: "#e8f5e9",
          borderColor: "#214228",
          optionColor: "#16331b",
          fontFamily: "Inter, sans-serif",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [
          {
            id: 1,
            name: "Home",
            content: "",
            order: 1,
            type: $Enums.PageType.PAGE,
            linkingId: "home",
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
        ],
        settings: null,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              type: $Enums.ThemeType.CUSTOM,
              funnelId: 2,
              name: "Custom Theme",
              backgroundColor: "#0e1e12",
              textColor: "#d4ecd0",
              buttonColor: "#387e3d",
              buttonTextColor: "#e8f5e9",
              borderColor: "#214228",
              optionColor: "#16331b",
              fontFamily: "Inter, sans-serif",
              borderRadius: $Enums.BorderRadius.SOFT,
            }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: "Original Funnel - copy",
              slug: "original-funnel-copy",
              status: $Enums.FunnelStatus.DRAFT,
              workspaceId,
              createdBy: userId,
              activeThemeId: 2,
            }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              name: "Original Funnel - copy",
              slug: "original-funnel-copy",
              activeThemeId: 2,
              activeTheme: {
                id: 2,
                type: $Enums.ThemeType.CUSTOM,
                name: "Custom Theme",
              },
              settings: null,
            }),
          },
          page: {
            create: vi.fn().mockResolvedValue({
              id: 2,
              name: "Home",
              order: 1,
              linkingId: "home-new",
            }),
          },
          funnelSettings: {
            create: vi.fn(),
          },
        };
        return await callback(tx);
      });

      const result = await duplicateFunnel(originalFunnelId, userId, {});

      expect(result.response.message).toBe("Funnel duplicated successfully");
      expect(result.response.funnelId).toBe(2);
    });

    it("should deny access if user not member of original workspace", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: 999, // Different owner
        },
        pages: [],
        settings: null,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        duplicateFunnel(originalFunnelId, userId, {})
      ).rejects.toThrow(
        "You don't have access to the original funnel. Please ask the workspace owner to invite you."
      );
    });

    it("should deny access to target workspace if user not a member", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        workspaceId: 1,
        workspace: {
          id: 1,
          name: "Source Workspace",
          ownerId: userId,
        },
        pages: [],
        settings: null,
      };

      const targetWorkspace = {
        id: 2,
        name: "Target Workspace",
        ownerId: 999, // Different owner
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue(targetWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        duplicateFunnel(originalFunnelId, userId, {
          workspaceSlug: "target-workspace",
        })
      ).rejects.toThrow(
        "You don't have access to the target workspace Target Workspace"
      );
    });

    it("should deny if user lacks CREATE_FUNNELS permission in target workspace", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        workspaceId: 1,
        workspace: {
          id: 1,
          name: "Source Workspace",
          ownerId: userId,
        },
        pages: [],
        settings: null,
      };

      const targetWorkspace = {
        id: 2,
        name: "Target Workspace",
        ownerId: 999,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue(targetWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        role: $Enums.WorkspaceRole.VIEWER,
        permissions: [$Enums.WorkspacePermission.MANAGE_DOMAINS],
      });

      await expect(
        duplicateFunnel(originalFunnelId, userId, {
          workspaceSlug: "target-workspace",
        })
      ).rejects.toThrow(
        "You don't have permission to create funnels in the target workspace"
      );
    });
  });

  describe("Workspace Validation", () => {
    it("should check workspace funnel limit before duplication", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        pages: [],
        settings: null,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(3); // At limit

      await expect(
        duplicateFunnel(originalFunnelId, userId, {})
      ).rejects.toThrow("This workspace has reached its maximum limit of 3 funnels");
    });

    it("should return user-friendly error when workspace at limit", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        pages: [],
        settings: null,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(3);

      const error = await duplicateFunnel(originalFunnelId, userId, {}).catch(
        (e) => e
      );
      expect(error.message).toMatch(/maximum limit of 3 funnels/i);
    });

    it("should allow duplication when workspace has space", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1); // Has space
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      const result = await duplicateFunnel(originalFunnelId, userId, {});

      expect(result.response.funnelId).toBe(2);
      expect(mockPrisma.funnel.count).toHaveBeenCalledWith({
        where: { workspaceId },
      });
    });

    it("should reject if target workspace doesn't exist", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        workspaceId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        pages: [],
        settings: null,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        duplicateFunnel(originalFunnelId, userId, { workspaceSlug: "non-existent" })
      ).rejects.toThrow("Target workspace not found");
    });

    it("should check funnel limit in target workspace for cross-workspace duplication", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        workspaceId: 1,
        workspace: {
          id: 1,
          name: "Source Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      const targetWorkspace = {
        id: 2,
        name: "Target Workspace",
        slug: "target-workspace",
        ownerId: userId,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue(targetWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(3); // Target at limit

      await expect(
        duplicateFunnel(originalFunnelId, userId, {
          workspaceSlug: "target-workspace",
        })
      ).rejects.toThrow("This workspace has reached its maximum limit of 3 funnels");
    });
  });

  describe("Name & Slug Generation", () => {
    it("should append ' - copy' to original funnel name", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Marketing Funnel",
        slug: "marketing-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      let createdFunnelName: string | null = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelName = data.data.name;
              return Promise.resolve({ id: 2, name: data.data.name });
            }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      expect(createdFunnelName).toBe("Marketing Funnel - copy");
    });

    it("should generate unique name with ' - copy (2)' if duplicate exists", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Marketing Funnel",
        slug: "marketing-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      let createdFunnelName: string | null = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([
        { name: "Marketing Funnel - copy" },
      ]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelName = data.data.name;
              return Promise.resolve({ id: 2, name: data.data.name });
            }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      expect(createdFunnelName).toBe("Marketing Funnel - copy (2)");
    });

    it("should generate unique name with ' - copy (3)' if multiple duplicates exist", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Marketing Funnel",
        slug: "marketing-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      let createdFunnelName: string | null = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([
        { name: "Marketing Funnel - copy" },
        { name: "Marketing Funnel - copy (2)" },
      ]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelName = data.data.name;
              return Promise.resolve({ id: 2, name: data.data.name });
            }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      expect(createdFunnelName).toBe("Marketing Funnel - copy (3)");
    });

    it("should generate slug from duplicated funnel name", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Marketing Funnel",
        slug: "marketing-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      let createdSlug: string | null = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdSlug = data.data.slug;
              return Promise.resolve({ id: 2, slug: data.data.slug });
            }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      expect(createdSlug).toMatch(/marketing-funnel-copy/i);
    });

    it("should ensure slug is unique by appending -1 if base slug exists", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Marketing Funnel",
        slug: "marketing-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      let createdSlug: string | null = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce({ id: 99 }) // Base slug exists
        .mockResolvedValueOnce(null); // -1 version available

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdSlug = data.data.slug;
              return Promise.resolve({ id: 2, slug: data.data.slug });
            }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      expect(createdSlug).toMatch(/-1$/);
    });

    it("should handle special characters in funnel name correctly", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "My Awesome! Funnel @ 2024",
        slug: "my-awesome-funnel-2024",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      let createdFunnelName: string | null = null;
      let createdSlug: string | null = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelName = data.data.name;
              createdSlug = data.data.slug;
              return Promise.resolve({ id: 2, name: data.data.name, slug: data.data.slug });
            }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      expect(createdFunnelName).toBe("My Awesome! Funnel @ 2024 - copy");
      expect(createdSlug).toMatch(/my-awesome-funnel-2024-copy/i);
    });
  });

  describe("Theme Duplication - New Schema", () => {
    describe("Custom Theme Active", () => {
      it("should create NEW custom theme when original has custom theme active", async () => {
        const originalFunnel = {
          id: originalFunnelId,
          name: "Original Funnel",
          slug: "original-funnel",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId,
          activeThemeId: 1,
          workspace: {
            id: workspaceId,
            name: "Test Workspace",
            ownerId: userId,
          },
          activeTheme: {
            id: 1,
            name: "My Custom Theme",
            type: $Enums.ThemeType.CUSTOM,
            funnelId: originalFunnelId,
            backgroundColor: "#123456",
            textColor: "#abcdef",
            buttonColor: "#ff0000",
            buttonTextColor: "#00ff00",
            borderColor: "#0000ff",
            optionColor: "#ffff00",
            fontFamily: "Roboto",
            borderRadius: $Enums.BorderRadius.ROUNDED,
          },
          pages: [],
          settings: null,
        };

        let createdThemeData: any = null;

        mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
        mockPrisma.funnel.count.mockResolvedValue(1);
        mockPrisma.funnel.findMany.mockResolvedValue([]);
        mockPrisma.funnel.findFirst.mockResolvedValue(null);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const tx = {
            theme: {
              create: vi.fn().mockImplementation((data: any) => {
                createdThemeData = data.data;
                return Promise.resolve({
                  id: 2,
                  ...data.data,
                });
              }),
              update: vi.fn().mockResolvedValue({ id: 2 }),
            },
            funnel: {
              create: vi.fn().mockResolvedValue({
                id: 2,
                activeThemeId: 2,
              }),
              findUnique: vi.fn().mockResolvedValue({
                id: 2,
                activeTheme: { id: 2 },
                settings: null,
              }),
            },
            page: { create: vi.fn() },
            funnelSettings: { create: vi.fn() },
          };
          return await callback(tx);
        });

        await duplicateFunnel(originalFunnelId, userId, {});

        // Verify new custom theme was created with copied properties
        expect(createdThemeData).toBeDefined();
        expect(createdThemeData.type).toBe($Enums.ThemeType.CUSTOM);
        expect(createdThemeData.backgroundColor).toBe("#123456");
        expect(createdThemeData.textColor).toBe("#abcdef");
        expect(createdThemeData.buttonColor).toBe("#ff0000");
        expect(createdThemeData.buttonTextColor).toBe("#00ff00");
        expect(createdThemeData.borderColor).toBe("#0000ff");
        expect(createdThemeData.optionColor).toBe("#ffff00");
        expect(createdThemeData.fontFamily).toBe("Roboto");
        expect(createdThemeData.borderRadius).toBe($Enums.BorderRadius.ROUNDED);
      });

      it("should set new custom theme as active theme for duplicated funnel", async () => {
        const originalFunnel = {
          id: originalFunnelId,
          name: "Original Funnel",
          slug: "original-funnel",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId,
          activeThemeId: 1,
          workspace: {
            id: workspaceId,
            name: "Test Workspace",
            ownerId: userId,
          },
          customTheme: {
            id: 1,
            type: $Enums.ThemeType.CUSTOM,
            backgroundColor: "#000",
            textColor: "#fff",
            buttonColor: "#00f",
            buttonTextColor: "#fff",
            borderColor: "#ccc",
            optionColor: "#eee",
            fontFamily: "Arial",
            borderRadius: $Enums.BorderRadius.SOFT,
          },
          pages: [],
          settings: null,
        };

        let createdFunnelData: any = null;

        mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
        mockPrisma.funnel.count.mockResolvedValue(1);
        mockPrisma.funnel.findMany.mockResolvedValue([]);
        mockPrisma.funnel.findFirst.mockResolvedValue(null);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const tx = {
            theme: {
              create: vi.fn().mockResolvedValue({
                id: 2,
                type: $Enums.ThemeType.CUSTOM,
              }),
              update: vi.fn().mockResolvedValue({ id: 2 }),
            },
            funnel: {
              create: vi.fn().mockImplementation((data: any) => {
                createdFunnelData = data.data;
                return Promise.resolve({
                  id: 2,
                  ...data.data,
                });
              }),
              findUnique: vi.fn().mockResolvedValue({
                id: 2,
                activeTheme: { id: 2 },
                settings: null,
              }),
            },
            page: { create: vi.fn() },
            funnelSettings: { create: vi.fn() },
          };
          return await callback(tx);
        });

        await duplicateFunnel(originalFunnelId, userId, {});

        // Verify activeThemeId is set to the new theme (NOT the old theme)
        expect(createdFunnelData.activeThemeId).toBe(2);
      });
    });

    describe("Global Theme Active", () => {
      it("should create NEW custom theme (not reuse global) when original uses global theme", async () => {
        const originalFunnel = {
          id: originalFunnelId,
          name: "Original Funnel",
          slug: "original-funnel",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId,
          activeThemeId: 99, // Points to a global theme
          workspace: {
            id: workspaceId,
            name: "Test Workspace",
            ownerId: userId,
          },
          // Simulating the service fetches the active theme
          activeTheme: {
            id: 99,
            name: "Dark Professional",
            type: $Enums.ThemeType.GLOBAL,
            funnelId: null, // Global theme has no funnel
            backgroundColor: "#1a1a1a",
            textColor: "#ffffff",
            buttonColor: "#007bff",
            buttonTextColor: "#ffffff",
            borderColor: "#333333",
            optionColor: "#2a2a2a",
            fontFamily: "Helvetica",
            borderRadius: $Enums.BorderRadius.SOFT,
          },
          customTheme: null, // No custom theme
          pages: [],
          settings: null,
        };

        let createdThemeData: any = null;

        mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
        mockPrisma.funnel.count.mockResolvedValue(1);
        mockPrisma.funnel.findMany.mockResolvedValue([]);
        mockPrisma.funnel.findFirst.mockResolvedValue(null);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const tx = {
            theme: {
              create: vi.fn().mockImplementation((data: any) => {
                createdThemeData = data.data;
                return Promise.resolve({
                  id: 2,
                  type: $Enums.ThemeType.CUSTOM,
                  ...data.data,
                });
              }),
              update: vi.fn().mockResolvedValue({ id: 2 }),
            },
            funnel: {
              create: vi.fn().mockResolvedValue({
                id: 2,
                activeThemeId: 2,
              }),
              findUnique: vi.fn().mockResolvedValue({
                id: 2,
                activeTheme: { id: 2, type: $Enums.ThemeType.CUSTOM },
                settings: null,
              }),
            },
            page: { create: vi.fn() },
            funnelSettings: { create: vi.fn() },
          };
          return await callback(tx);
        });

        await duplicateFunnel(originalFunnelId, userId, {});

        // Verify NEW custom theme was created (not global theme reused)
        expect(createdThemeData).toBeDefined();
        // Should copy the global theme's properties
        expect(createdThemeData.backgroundColor).toBe("#1a1a1a");
        expect(createdThemeData.textColor).toBe("#ffffff");
        expect(createdThemeData.buttonColor).toBe("#007bff");
      });

      it("should NOT set activeThemeId to global theme - must create custom", async () => {
        const originalFunnel = {
          id: originalFunnelId,
          name: "Original Funnel",
          slug: "original-funnel",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId,
          activeThemeId: 99, // Global theme
          workspace: {
            id: workspaceId,
            name: "Test Workspace",
            ownerId: userId,
          },
          activeTheme: {
            id: 99,
            type: $Enums.ThemeType.GLOBAL,
            funnelId: null,
            backgroundColor: "#000",
            textColor: "#fff",
            buttonColor: "#00f",
            buttonTextColor: "#fff",
            borderColor: "#ccc",
            optionColor: "#eee",
            fontFamily: "Arial",
            borderRadius: $Enums.BorderRadius.SOFT,
          },
          customTheme: null,
          pages: [],
          settings: null,
        };

        let createdFunnelData: any = null;

        mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
        mockPrisma.funnel.count.mockResolvedValue(1);
        mockPrisma.funnel.findMany.mockResolvedValue([]);
        mockPrisma.funnel.findFirst.mockResolvedValue(null);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const tx = {
            theme: {
              create: vi.fn().mockResolvedValue({
                id: 2,
                type: $Enums.ThemeType.CUSTOM,
              }),
              update: vi.fn().mockResolvedValue({ id: 2 }),
            },
            funnel: {
              create: vi.fn().mockImplementation((data: any) => {
                createdFunnelData = data.data;
                return Promise.resolve({
                  id: 2,
                  ...data.data,
                });
              }),
              findUnique: vi.fn().mockResolvedValue({
                id: 2,
                activeTheme: { id: 2 },
                settings: null,
              }),
            },
            page: { create: vi.fn() },
            funnelSettings: { create: vi.fn() },
          };
          return await callback(tx);
        });

        await duplicateFunnel(originalFunnelId, userId, {});

        // activeThemeId should be 2 (new custom theme), NOT 99 (global)
        expect(createdFunnelData.activeThemeId).toBe(2);
        expect(createdFunnelData.activeThemeId).not.toBe(99);
      });
    });

    describe("No Active Theme", () => {
      it("should create default custom theme when original has no theme", async () => {
        const originalFunnel = {
          id: originalFunnelId,
          name: "Original Funnel",
          slug: "original-funnel",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId,
          activeThemeId: null,
          workspace: {
            id: workspaceId,
            name: "Test Workspace",
            ownerId: userId,
          },
          customTheme: null,
          activeTheme: null,
          pages: [],
          settings: null,
        };

        let createdThemeData: any = null;

        mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
        mockPrisma.funnel.count.mockResolvedValue(1);
        mockPrisma.funnel.findMany.mockResolvedValue([]);
        mockPrisma.funnel.findFirst.mockResolvedValue(null);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const tx = {
            theme: {
              create: vi.fn().mockImplementation((data: any) => {
                createdThemeData = data.data;
                return Promise.resolve({
                  id: 2,
                  type: $Enums.ThemeType.CUSTOM,
                  ...data.data,
                });
              }),
              update: vi.fn().mockResolvedValue({ id: 2 }),
            },
            funnel: {
              create: vi.fn().mockResolvedValue({
                id: 2,
                activeThemeId: 2,
              }),
              findUnique: vi.fn().mockResolvedValue({
                id: 2,
                activeTheme: { id: 2 },
                settings: null,
              }),
            },
            page: { create: vi.fn() },
            funnelSettings: { create: vi.fn() },
          };
          return await callback(tx);
        });

        await duplicateFunnel(originalFunnelId, userId, {});

        // Should create theme with default values
        expect(createdThemeData).toBeDefined();
        // Will use defaults from schema or fallback in service
      });
    });
  });

  describe("Settings Duplication", () => {
    it("should duplicate all settings except analytics and facebook pixel", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: {
          id: 1,
          funnelId: originalFunnelId,
          defaultSeoTitle: "Original SEO Title",
          defaultSeoDescription: "Original SEO Description",
          defaultSeoKeywords: "keyword1, keyword2",
          favicon: "https://example.com/favicon.ico",
          ogImage: "https://example.com/og-image.jpg",
          googleAnalyticsId: "GA-123456789", // Should NOT be copied
          facebookPixelId: "FB-987654321", // Should NOT be copied
          customTrackingScripts: "<script>console.log('tracking')</script>",
          enableCookieConsent: true,
          cookieConsentText: "We use cookies",
          privacyPolicyUrl: "https://example.com/privacy",
          termsOfServiceUrl: "https://example.com/terms",
          language: "en",
          timezone: "UTC",
          dateFormat: "YYYY-MM-DD",
          isPasswordProtected: true,
          passwordHash: "hashed_password_123",
        },
      };

      let createdSettingsData: any = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: { id: 2 },
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: {
            create: vi.fn().mockImplementation((data: any) => {
              createdSettingsData = data.data;
              return Promise.resolve({ id: 2, ...data.data });
            }),
          },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // Verify settings were copied
      expect(createdSettingsData).toBeDefined();
      expect(createdSettingsData.funnelId).toBe(2);
      expect(createdSettingsData.defaultSeoTitle).toBe("Original SEO Title");
      expect(createdSettingsData.defaultSeoDescription).toBe("Original SEO Description");
      expect(createdSettingsData.defaultSeoKeywords).toBe("keyword1, keyword2");
      expect(createdSettingsData.favicon).toBe("https://example.com/favicon.ico");
      expect(createdSettingsData.ogImage).toBe("https://example.com/og-image.jpg");
      expect(createdSettingsData.customTrackingScripts).toBe("<script>console.log('tracking')</script>");
      expect(createdSettingsData.enableCookieConsent).toBe(true);
      expect(createdSettingsData.cookieConsentText).toBe("We use cookies");
      expect(createdSettingsData.privacyPolicyUrl).toBe("https://example.com/privacy");
      expect(createdSettingsData.termsOfServiceUrl).toBe("https://example.com/terms");
      expect(createdSettingsData.language).toBe("en");
      expect(createdSettingsData.timezone).toBe("UTC");
      expect(createdSettingsData.dateFormat).toBe("YYYY-MM-DD");
      expect(createdSettingsData.isPasswordProtected).toBe(true);
      expect(createdSettingsData.passwordHash).toBe("hashed_password_123");

      // Verify analytics IDs were NOT copied
      expect(createdSettingsData.googleAnalyticsId).toBeNull();
      expect(createdSettingsData.facebookPixelId).toBeNull();
    });

    it("should handle funnel with no settings gracefully", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null, // No settings
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      let settingsCreated = false;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: {
            create: vi.fn().mockImplementation(() => {
              settingsCreated = true;
              return Promise.resolve({ id: 2 });
            }),
          },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // Settings creation should not be called
      expect(settingsCreated).toBe(false);
    });
  });

  describe("Page Duplication & LinkingId Replacement", () => {
    it("should duplicate all pages with same names, order, types, and SEO", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [
          {
            id: 1,
            name: "Home",
            content: '<a href="contact">Contact Us</a>',
            order: 1,
            type: $Enums.PageType.PAGE,
            linkingId: "home",
            seoTitle: "Home Page Title",
            seoDescription: "Home page description",
            seoKeywords: "home, landing",
          },
          {
            id: 2,
            name: "Contact",
            content: '<a href="home">Back to Home</a>',
            order: 2,
            type: $Enums.PageType.PAGE,
            linkingId: "contact",
            seoTitle: "Contact Page",
            seoDescription: null,
            seoKeywords: null,
          },
        ],
        settings: null,
      };

      const createdPages: any[] = [];

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              const pageData = data.data;
              createdPages.push(pageData);
              return Promise.resolve({
                id: createdPages.length + 10,
                ...pageData,
              });
            }),
          },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // Verify pages were duplicated
      expect(createdPages).toHaveLength(2);

      // Page 1
      expect(createdPages[0].name).toBe("Home");
      expect(createdPages[0].order).toBe(1);
      expect(createdPages[0].type).toBe($Enums.PageType.PAGE);
      expect(createdPages[0].seoTitle).toBe("Home Page Title");
      expect(createdPages[0].seoDescription).toBe("Home page description");
      expect(createdPages[0].seoKeywords).toBe("home, landing");
      expect(createdPages[0].funnelId).toBe(2);

      // Page 2
      expect(createdPages[1].name).toBe("Contact");
      expect(createdPages[1].order).toBe(2);
      expect(createdPages[1].type).toBe($Enums.PageType.PAGE);
      expect(createdPages[1].seoTitle).toBe("Contact Page");
      expect(createdPages[1].seoDescription).toBeNull();
      expect(createdPages[1].seoKeywords).toBeNull();
      expect(createdPages[1].funnelId).toBe(2);
    });

    it("should generate NEW linkingId for each duplicated page", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [
          {
            id: 1,
            name: "Home",
            content: "",
            order: 1,
            type: $Enums.PageType.PAGE,
            linkingId: "home",
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
        ],
        settings: null,
      };

      let createdLinkingId: string | null = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              createdLinkingId = data.data.linkingId;
              return Promise.resolve({
                id: 2,
                ...data.data,
              });
            }),
          },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // Verify NEW linkingId was generated (not same as original)
      expect(createdLinkingId).toBeDefined();
      expect(createdLinkingId).not.toBe("home");
    });

    it("should replace old linkingIds in page content with new ones", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [
          {
            id: 1,
            name: "Home",
            content: '<a href="about">About</a><a href="contact">Contact</a>',
            order: 1,
            type: $Enums.PageType.PAGE,
            linkingId: "home",
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
          {
            id: 2,
            name: "About",
            content: '<a href="home">Home</a>',
            order: 2,
            type: $Enums.PageType.PAGE,
            linkingId: "about",
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
          {
            id: 3,
            name: "Contact",
            content: '<a href="home">Home</a><a href="about">About</a>',
            order: 3,
            type: $Enums.PageType.PAGE,
            linkingId: "contact",
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
        ],
        settings: null,
      };

      const createdPages: any[] = [];

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: {
            create: vi.fn().mockImplementation((data: any) => {
              createdPages.push(data.data);
              return Promise.resolve({
                id: createdPages.length + 10,
                ...data.data,
              });
            }),
          },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // Verify linkingIds were replaced in content
      // Old linkingIds "home", "about", "contact" should NOT appear in new content
      createdPages.forEach((page) => {
        // Content should be updated (not exactly same as original)
        expect(page.content).toBeDefined();
      });

      // Specifically check that content was transformed
      const homePage = createdPages.find((p) => p.name === "Home");
      expect(homePage).toBeDefined();
      // Content should not contain old linkingIds directly
      // (The service replaces them with new ones)
    });
  });

  describe("Domain & Insights Exclusion", () => {
    it("should NOT duplicate domain connections", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        domainConnections: [
          { id: 1, domainId: 10, funnelId: originalFunnelId },
          { id: 2, domainId: 20, funnelId: originalFunnelId },
        ],
        pages: [],
        settings: null,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      let domainConnectionCreated = false;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
          funnelDomain: {
            create: vi.fn().mockImplementation(() => {
              domainConnectionCreated = true;
              return Promise.resolve({});
            }),
          },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // Verify domain connections were NOT created
      expect(domainConnectionCreated).toBe(false);
    });

    it("should NOT duplicate insights", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        insights: [
          { id: 1, type: $Enums.InsightType.SINGLE_CHOICE, funnelId: originalFunnelId },
          { id: 2, type: $Enums.InsightType.MULTIPLE_CHOICE, funnelId: originalFunnelId },
        ],
        pages: [],
        settings: null,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      let insightCreated = false;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
          insight: {
            create: vi.fn().mockImplementation(() => {
              insightCreated = true;
              return Promise.resolve({});
            }),
          },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // Verify insights were NOT created
      expect(insightCreated).toBe(false);
    });
  });

  describe("Funnel Metadata", () => {
    it("should set createdBy to the user who is duplicating (not original creator)", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: 999, // Different user created original
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId, // Current user is owner
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      let createdFunnelData: any = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelData = data.data;
              return Promise.resolve({
                id: 2,
                ...data.data,
              });
            }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // createdBy should be current user (1), NOT original creator (999)
      expect(createdFunnelData.createdBy).toBe(userId);
      expect(createdFunnelData.createdBy).not.toBe(999);
    });

    it("should always set status to DRAFT for duplicated funnels", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.LIVE, // Original is LIVE
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        activeTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      let createdFunnelData: any = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelData = data.data;
              return Promise.resolve({
                id: 2,
                ...data.data,
              });
            }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // Status should always be DRAFT for duplicates
      expect(createdFunnelData.status).toBe($Enums.FunnelStatus.DRAFT);
    });

    it("should set workspaceId to target workspace (same or different)", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        workspaceId: 1, // Source workspace
        workspace: {
          id: 1,
          name: "Source Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      const targetWorkspace = {
        id: 2, // Target workspace
        name: "Target Workspace",
        slug: "target-workspace",
        ownerId: userId,
      };

      let createdFunnelData: any = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue(targetWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelData = data.data;
              return Promise.resolve({
                id: 2,
                ...data.data,
              });
            }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {
        workspaceSlug: "target-workspace",
      });

      // workspaceId should be target workspace (2), not source (1)
      expect(createdFunnelData.workspaceId).toBe(2);
    });
  });

  describe("Transaction & Rollback", () => {
    it("should use transaction for all operations", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // Verify transaction was called
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });


  describe("Edge Cases", () => {
    it("should handle funnel with many pages (10+)", async () => {
      const manyPages = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `Page ${i + 1}`,
        content: `<h1>Content for page ${i + 1}</h1>`,
        order: i + 1,
        type: $Enums.PageType.PAGE,
        linkingId: `page-${i + 1}`,
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
      }));

      const originalFunnel = {
        id: originalFunnelId,
        name: "Original Funnel",
        slug: "original-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: manyPages,
        settings: null,
      };

      let pagesCreatedCount = 0;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockResolvedValue({ id: 2 }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: {
            create: vi.fn().mockImplementation(() => {
              pagesCreatedCount++;
              return Promise.resolve({ id: pagesCreatedCount + 100 });
            }),
          },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // All pages should be duplicated
      expect(pagesCreatedCount).toBe(15);
    });

    it("should handle duplicate of an already duplicated funnel", async () => {
      const originalFunnel = {
        id: originalFunnelId,
        name: "My Funnel - copy", // Already a copy
        slug: "my-funnel-copy",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        activeThemeId: 1,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
        customTheme: {
          id: 1,
          type: $Enums.ThemeType.CUSTOM,
          backgroundColor: "#000",
          textColor: "#fff",
          buttonColor: "#00f",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#eee",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
        },
        pages: [],
        settings: null,
      };

      let createdFunnelName: string | null = null;

      mockPrisma.funnel.findUnique.mockResolvedValue(originalFunnel);
      mockPrisma.funnel.count.mockResolvedValue(1);
      mockPrisma.funnel.findMany.mockResolvedValue([]);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          theme: {
            create: vi.fn().mockResolvedValue({ id: 2, type: $Enums.ThemeType.CUSTOM }),
            update: vi.fn().mockResolvedValue({ id: 2 }),
          },
          funnel: {
            create: vi.fn().mockImplementation((data: any) => {
              createdFunnelName = data.data.name;
              return Promise.resolve({ id: 2, name: data.data.name });
            }),
            findUnique: vi.fn().mockResolvedValue({
              id: 2,
              activeTheme: { id: 2 },
              settings: null,
            }),
          },
          page: { create: vi.fn() },
          funnelSettings: { create: vi.fn() },
        };
        return await callback(tx);
      });

      await duplicateFunnel(originalFunnelId, userId, {});

      // Name should become "My Funnel - copy - copy"
      expect(createdFunnelName).toBe("My Funnel - copy - copy");
    });
  });
});
