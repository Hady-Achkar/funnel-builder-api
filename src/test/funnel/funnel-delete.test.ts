import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { deleteFunnel } from "../../services/funnel/delete";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { $Enums } from "../../generated/prisma-client";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

describe("Funnel Deletion Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const funnelId = 1;
  const workspaceId = 1;

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
      funnel: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);

    // Mock cache service
    (cacheService.del as any).mockResolvedValue(undefined);
    (cacheService.get as any).mockResolvedValue(null);
    (cacheService.set as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("should require user to be logged in", async () => {
      await expect(deleteFunnel(funnelId, null as any)).rejects.toThrow(
        "User ID is required"
      );
    });

    it("should throw error when funnel not found", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(deleteFunnel(funnelId, userId)).rejects.toThrow(
        "Funnel not found"
      );
    });

    it("should allow workspace owner to delete funnel", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: [{ id: 1 }, { id: 2 }],
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId, // User is owner
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: userId,
      });
      mockPrisma.funnel.delete.mockResolvedValue(mockFunnel);

      const result = await deleteFunnel(funnelId, userId);

      expect(result.message).toBe("Funnel deleted successfully");
      expect(mockPrisma.funnel.delete).toHaveBeenCalledWith({
        where: { id: funnelId },
      });
    });

    it("should allow admin to delete funnel", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: [],
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: 999, // Different owner
        },
      };

      const mockMember = {
        role: $Enums.WorkspaceRole.ADMIN,
        permissions: [],
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: 999,
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.funnel.delete.mockResolvedValue(mockFunnel);

      const result = await deleteFunnel(funnelId, userId);

      expect(result.message).toBe("Funnel deleted successfully");
    });

    it("should allow editor with DELETE_FUNNELS permission to delete", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: [],
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: 999,
        },
      };

      const mockMember = {
        role: $Enums.WorkspaceRole.EDITOR,
        permissions: [$Enums.WorkspacePermission.DELETE_FUNNELS],
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: 999,
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.funnel.delete.mockResolvedValue(mockFunnel);

      const result = await deleteFunnel(funnelId, userId);

      expect(result.message).toBe("Funnel deleted successfully");
    });

    it("should deny editor without DELETE_FUNNELS permission", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: [],
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: 999,
        },
      };

      const mockMember = {
        role: $Enums.WorkspaceRole.EDITOR,
        permissions: [], // No DELETE_FUNNELS permission
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: 999,
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      await expect(deleteFunnel(funnelId, userId)).rejects.toThrow(
        "permission"
      );
    });

    it("should allow viewer with DELETE_FUNNELS permission to delete", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: [],
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: 999,
        },
      };

      const mockMember = {
        role: $Enums.WorkspaceRole.VIEWER,
        permissions: [$Enums.WorkspacePermission.DELETE_FUNNELS],
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: 999,
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.funnel.delete.mockResolvedValue(mockFunnel);

      const result = await deleteFunnel(funnelId, userId);

      expect(result.message).toBe("Funnel deleted successfully");
    });

    it("should deny viewer without DELETE_FUNNELS permission", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: [],
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: 999,
        },
      };

      const mockMember = {
        role: $Enums.WorkspaceRole.VIEWER,
        permissions: [], // No DELETE_FUNNELS permission
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: 999,
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      await expect(deleteFunnel(funnelId, userId)).rejects.toThrow(
        "permission"
      );
    });

    it("should deny non-member from deleting funnel", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: [],
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: 999,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: 999,
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null); // Not a member

      await expect(deleteFunnel(funnelId, userId)).rejects.toThrow();
    });
  });

  describe("Cache Invalidation", () => {
    const mockFunnel = {
      id: funnelId,
      name: "Test Funnel",
      workspaceId,
      pages: [{ id: 1 }, { id: 2 }, { id: 3 }],
      workspace: {
        id: workspaceId,
        name: "Test Workspace",
        ownerId: userId,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: userId,
      });
      mockPrisma.funnel.delete.mockResolvedValue(mockFunnel);
    });

    it("should delete individual funnel cache key", async () => {
      await deleteFunnel(funnelId, userId);

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnel:${funnelId}:full`
      );
    });

    it("should delete all page cache keys for the funnel", async () => {
      await deleteFunnel(funnelId, userId);

      // Verify each page cache key is deleted
      expect(cacheService.del).toHaveBeenCalledWith(
        `funnel:${funnelId}:page:1:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `funnel:${funnelId}:page:2:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `funnel:${funnelId}:page:3:full`
      );
    });

    it("should delete workspace funnels list cache keys", async () => {
      await deleteFunnel(funnelId, userId);

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:list`
      );
    });

    it("should delete user-specific workspace cache", async () => {
      await deleteFunnel(funnelId, userId);

      expect(cacheService.del).toHaveBeenCalledWith(
        `user:${userId}:workspace:${workspaceId}:funnels`
      );
    });

    it("should update all funnels cache by removing deleted funnel", async () => {
      const existingFunnels = [
        { id: funnelId, name: "Test Funnel" },
        { id: 2, name: "Another Funnel" },
      ];

      (cacheService.get as any).mockResolvedValue(existingFunnels);

      await deleteFunnel(funnelId, userId);

      // Should get the existing cache
      expect(cacheService.get).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`
      );

      // Should update the cache with filtered list
      expect(cacheService.set).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`,
        [{ id: 2, name: "Another Funnel" }],
        { ttl: 0 }
      );
    });

    it("should delete all funnels cache if no funnels remain", async () => {
      const existingFunnels = [{ id: funnelId, name: "Test Funnel" }];

      (cacheService.get as any).mockResolvedValue(existingFunnels);

      await deleteFunnel(funnelId, userId);

      // Should delete the cache if empty
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`
      );
    });

    it("should handle cache deletion failures gracefully", async () => {
      (cacheService.del as any).mockRejectedValue(
        new Error("Cache service error")
      );

      // Should not throw even if cache deletion fails
      const result = await deleteFunnel(funnelId, userId);

      expect(result.message).toBe("Funnel deleted successfully");
    });
  });

  describe("Data Integrity", () => {
    it("should delete funnel from database", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: [],
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: userId,
      });
      mockPrisma.funnel.delete.mockResolvedValue(mockFunnel);

      await deleteFunnel(funnelId, userId);

      expect(mockPrisma.funnel.delete).toHaveBeenCalledWith({
        where: { id: funnelId },
      });
    });

    it("should work with funnel that has no pages", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: [], // No pages
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: userId,
      });
      mockPrisma.funnel.delete.mockResolvedValue(mockFunnel);

      const result = await deleteFunnel(funnelId, userId);

      expect(result.message).toBe("Funnel deleted successfully");
    });

    it("should work with funnel that has many pages", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: Array.from({ length: 20 }, (_, i) => ({ id: i + 1 })),
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: userId,
      });
      mockPrisma.funnel.delete.mockResolvedValue(mockFunnel);

      const result = await deleteFunnel(funnelId, userId);

      expect(result.message).toBe("Funnel deleted successfully");
      // Verify all page caches were deleted
      expect(cacheService.del).toHaveBeenCalledTimes(23); // 20 pages + 3 other cache keys
    });
  });

  describe("Edge Cases", () => {
    it("should validate funnel ID parameter", async () => {
      await expect(deleteFunnel(-1, userId)).rejects.toThrow();
      await expect(deleteFunnel(0, userId)).rejects.toThrow();
    });

    it("should handle database errors gracefully", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: [],
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: userId,
      });
      mockPrisma.funnel.delete.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(deleteFunnel(funnelId, userId)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should return proper success message", async () => {
      const mockFunnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
        pages: [],
        workspace: {
          id: workspaceId,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        ownerId: userId,
      });
      mockPrisma.funnel.delete.mockResolvedValue(mockFunnel);

      const result = await deleteFunnel(funnelId, userId);

      expect(result).toEqual({
        message: "Funnel deleted successfully",
      });
    });
  });
});
