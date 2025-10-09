import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getFunnel } from "../../services/funnel/get";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { $Enums } from "../../generated/prisma-client";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");
vi.mock("../../utils/workspace-utils/workspace-permission-manager", () => ({
  PermissionManager: {
    can: vi.fn(),
  },
}));

import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager";

describe("Get Funnel by ID Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const funnelId = 1;
  const workspaceId = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.get as any).mockResolvedValue(null);
    (cacheService.set as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Funnel Validation", () => {
    it("should throw error if funnel does not exist", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(getFunnel(funnelId, userId)).rejects.toThrow(
        "Funnel not found"
      );
    });

    it("should throw error if user ID is not provided", async () => {
      await expect(getFunnel(funnelId, 0)).rejects.toThrow(
        "User ID is required"
      );
    });

    it("should throw error for invalid funnel ID", async () => {
      await expect(getFunnel(-1, userId)).rejects.toThrow("Invalid input");
    });
  });

  describe("Permission Checks", () => {
    const mockFunnelExists = {
      id: funnelId,
      workspaceId,
      workspace: {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: userId,
      },
    };

    it("should allow workspace owner to view funnel", async () => {
      const fullFunnel = {
        id: funnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        activeThemeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customTheme: null,
        pages: [],
      };

      mockPrisma.funnel.findUnique
        .mockResolvedValueOnce(mockFunnelExists)
        .mockResolvedValueOnce(fullFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
        userPermissions: [],
        isOwner: true,
      });

      const result = await getFunnel(funnelId, userId);

      expect(result.id).toBe(funnelId);
      expect(result.name).toBe("Test Funnel");
      expect(PermissionManager.can).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "VIEW_FUNNEL",
      });
    });

    it("should allow admin member to view funnel", async () => {
      const mockFunnelExistsNonOwner = {
        ...mockFunnelExists,
        workspace: {
          ...mockFunnelExists.workspace,
          ownerId: 999,
        },
      };

      const fullFunnel = {
        id: funnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: 999,
        activeThemeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customTheme: null,
        pages: [],
      };

      mockPrisma.funnel.findUnique
        .mockResolvedValueOnce(mockFunnelExistsNonOwner)
        .mockResolvedValueOnce(fullFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.ADMIN,
        userPermissions: [],
        isOwner: false,
      });

      const result = await getFunnel(funnelId, userId);

      expect(result.id).toBe(funnelId);
      expect(PermissionManager.can).toHaveBeenCalled();
    });

    it("should allow editor member to view funnel", async () => {
      const mockFunnelExistsNonOwner = {
        ...mockFunnelExists,
        workspace: {
          ...mockFunnelExists.workspace,
          ownerId: 999,
        },
      };

      const fullFunnel = {
        id: funnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: 999,
        activeThemeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customTheme: null,
        pages: [],
      };

      mockPrisma.funnel.findUnique
        .mockResolvedValueOnce(mockFunnelExistsNonOwner)
        .mockResolvedValueOnce(fullFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.EDITOR,
        userPermissions: [$Enums.WorkspacePermission.EDIT_FUNNELS],
        isOwner: false,
      });

      const result = await getFunnel(funnelId, userId);

      expect(result.id).toBe(funnelId);
    });

    it("should allow viewer member to view funnel", async () => {
      const mockFunnelExistsNonOwner = {
        ...mockFunnelExists,
        workspace: {
          ...mockFunnelExists.workspace,
          ownerId: 999,
        },
      };

      const fullFunnel = {
        id: funnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: 999,
        activeThemeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customTheme: null,
        pages: [],
      };

      mockPrisma.funnel.findUnique
        .mockResolvedValueOnce(mockFunnelExistsNonOwner)
        .mockResolvedValueOnce(fullFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.VIEWER,
        userPermissions: [],
        isOwner: false,
      });

      const result = await getFunnel(funnelId, userId);

      expect(result.id).toBe(funnelId);
    });

    it("should deny non-member access to funnel", async () => {
      const mockFunnelExistsNonOwner = {
        ...mockFunnelExists,
        workspace: {
          ...mockFunnelExists.workspace,
          ownerId: 999,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnelExistsNonOwner);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: false,
        reason: "You don't have access to this workspace",
        userRole: $Enums.WorkspaceRole.VIEWER,
        userPermissions: [],
        isOwner: false,
      });

      await expect(getFunnel(funnelId, userId)).rejects.toThrow(
        "You don't have access to this workspace"
      );
    });

    it("should deny user without VIEW_FUNNEL permission", async () => {
      const mockFunnelExistsNonOwner = {
        ...mockFunnelExists,
        workspace: {
          ...mockFunnelExists.workspace,
          ownerId: 999,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnelExistsNonOwner);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: false,
        reason: "You don't have permission to view funnel",
        userRole: $Enums.WorkspaceRole.VIEWER,
        userPermissions: [],
        isOwner: false,
      });

      await expect(getFunnel(funnelId, userId)).rejects.toThrow(
        "You don't have permission to view funnel"
      );
    });
  });

  describe("Caching Behavior", () => {
    const mockFunnelExists = {
      id: funnelId,
      workspaceId,
      workspace: {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: userId,
      },
    };

    const mockCachedFunnel = {
      id: funnelId,
      name: "Cached Funnel",
      slug: "cached-funnel",
      status: $Enums.FunnelStatus.LIVE,
      workspaceId,
      createdBy: userId,
      activeThemeId: 1,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      customTheme: {
        id: 1,
        name: "Custom Theme",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        buttonColor: "#007bff",
        buttonTextColor: "#ffffff",
        borderColor: "#dee2e6",
        optionColor: "#f8f9fa",
        fontFamily: "Arial",
        borderRadius: $Enums.BorderRadius.SOFT,
        type: $Enums.ThemeType.CUSTOM,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      pages: [
        {
          id: 1,
          name: "Page 1",
          type: $Enums.PageType.PAGE,
          order: 1,
          linkingId: "link1",
          seoTitle: "SEO Title",
          seoDescription: "SEO Description",
          seoKeywords: "keywords",
        },
      ],
    };

    it("should return cached funnel when available", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnelExists);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
        userPermissions: [],
        isOwner: true,
      });

      (cacheService.get as any).mockResolvedValue(mockCachedFunnel);

      const result = await getFunnel(funnelId, userId);

      expect(result.id).toBe(funnelId);
      expect(result.name).toBe("Cached Funnel");
      expect(cacheService.get).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnel:${funnelId}:full`
      );
      // Should NOT fetch from database when cache hit
      expect(mockPrisma.funnel.findUnique).toHaveBeenCalledTimes(1); // Only for permission check
    });

    it("should fetch from database and cache when not in cache", async () => {
      const fullFunnel = {
        id: funnelId,
        name: "Fresh Funnel",
        slug: "fresh-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        activeThemeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customTheme: null,
        pages: [
          {
            id: 1,
            name: "Page 1",
            type: $Enums.PageType.PAGE,
            order: 1,
            linkingId: "link1",
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
        ],
      };

      mockPrisma.funnel.findUnique
        .mockResolvedValueOnce(mockFunnelExists)
        .mockResolvedValueOnce(fullFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
        userPermissions: [],
        isOwner: true,
      });

      (cacheService.get as any).mockResolvedValue(null);

      const result = await getFunnel(funnelId, userId);

      expect(result.id).toBe(funnelId);
      expect(result.name).toBe("Fresh Funnel");
      expect(cacheService.get).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnel:${funnelId}:full`,
        expect.objectContaining({
          id: funnelId,
          name: "Fresh Funnel",
        }),
        { ttl: 0 }
      );
    });

    it("should still return funnel if caching fails", async () => {
      const fullFunnel = {
        id: funnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        activeThemeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customTheme: null,
        pages: [],
      };

      mockPrisma.funnel.findUnique
        .mockResolvedValueOnce(mockFunnelExists)
        .mockResolvedValueOnce(fullFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
        userPermissions: [],
        isOwner: true,
      });

      (cacheService.get as any).mockResolvedValue(null);
      (cacheService.set as any).mockRejectedValue(new Error("Cache error"));

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = await getFunnel(funnelId, userId);

      expect(result.id).toBe(funnelId);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to cache funnel:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Response Validation", () => {
    const mockFunnelExists = {
      id: funnelId,
      workspaceId,
      workspace: {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: userId,
      },
    };

    it("should include all funnel fields in response", async () => {
      const fullFunnel = {
        id: funnelId,
        name: "Complete Funnel",
        slug: "complete-funnel",
        status: $Enums.FunnelStatus.LIVE,
        workspaceId,
        createdBy: userId,
        activeThemeId: 1,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-15"),
        customTheme: {
          id: 1,
          name: "Theme 1",
          backgroundColor: "#fff",
          textColor: "#000",
          buttonColor: "#007bff",
          buttonTextColor: "#fff",
          borderColor: "#ccc",
          optionColor: "#f0f0f0",
          fontFamily: "Arial",
          borderRadius: $Enums.BorderRadius.SOFT,
          type: $Enums.ThemeType.CUSTOM,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        pages: [
          {
            id: 1,
            name: "Homepage",
            type: $Enums.PageType.PAGE,
            order: 1,
            linkingId: "home",
            seoTitle: "Home Page",
            seoDescription: "Description",
            seoKeywords: "keywords",
          },
          {
            id: 2,
            name: "Contact",
            type: $Enums.PageType.RESULT,
            order: 2,
            linkingId: "contact",
            seoTitle: null,
            seoDescription: null,
            seoKeywords: null,
          },
        ],
      };

      mockPrisma.funnel.findUnique
        .mockResolvedValueOnce(mockFunnelExists)
        .mockResolvedValueOnce(fullFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
        userPermissions: [],
        isOwner: true,
      });

      (cacheService.get as any).mockResolvedValue(null);

      const result = await getFunnel(funnelId, userId);

      expect(result).toHaveProperty("id", funnelId);
      expect(result).toHaveProperty("name", "Complete Funnel");
      expect(result).toHaveProperty("slug", "complete-funnel");
      expect(result).toHaveProperty("status", $Enums.FunnelStatus.LIVE);
      expect(result).toHaveProperty("workspaceId", workspaceId);
      expect(result).toHaveProperty("createdBy", userId);
      expect(result).toHaveProperty("activeThemeId", 1);
      expect(result).toHaveProperty("customTheme");
      expect(result.customTheme).toMatchObject({
        id: 1,
        name: "Theme 1",
      });
      expect(result).toHaveProperty("pages");
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0]).toMatchObject({
        id: 1,
        name: "Homepage",
        order: 1,
      });
    });

    it("should handle funnel without custom theme", async () => {
      const fullFunnel = {
        id: funnelId,
        name: "Simple Funnel",
        slug: "simple-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        activeThemeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customTheme: null,
        pages: [],
      };

      mockPrisma.funnel.findUnique
        .mockResolvedValueOnce(mockFunnelExists)
        .mockResolvedValueOnce(fullFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
        userPermissions: [],
        isOwner: true,
      });

      (cacheService.get as any).mockResolvedValue(null);

      const result = await getFunnel(funnelId, userId);

      expect(result.customTheme).toBeNull();
      expect(result.activeThemeId).toBeNull();
    });

    it("should handle funnel with no pages", async () => {
      const fullFunnel = {
        id: funnelId,
        name: "Empty Funnel",
        slug: "empty-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        createdBy: userId,
        activeThemeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customTheme: null,
        pages: [],
      };

      mockPrisma.funnel.findUnique
        .mockResolvedValueOnce(mockFunnelExists)
        .mockResolvedValueOnce(fullFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
        userPermissions: [],
        isOwner: true,
      });

      (cacheService.get as any).mockResolvedValue(null);

      const result = await getFunnel(funnelId, userId);

      expect(result.pages).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle database error gracefully", async () => {
      mockPrisma.funnel.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(getFunnel(funnelId, userId)).rejects.toThrow(
        "Failed to get funnel: Database connection failed"
      );
    });

    it("should handle permission check error", async () => {
      const mockFunnelExists = {
        id: funnelId,
        workspaceId,
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: 999,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnelExists);

      (PermissionManager.can as any).mockRejectedValue(
        new Error("Permission service error")
      );

      await expect(getFunnel(funnelId, userId)).rejects.toThrow(
        "Failed to get funnel"
      );
    });
  });
});
