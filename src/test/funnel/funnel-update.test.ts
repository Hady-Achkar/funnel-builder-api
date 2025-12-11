import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { updateFunnel } from "../../services/funnel/update";
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

describe("Update Funnel Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const funnelId = 1;
  const workspaceId = 1;
  const workspaceSlug = "test-workspace";
  const funnelSlug = "test-funnel";

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.del as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error if user ID is not provided", async () => {
      await expect(
        updateFunnel(0, { workspaceSlug, funnelSlug }, { name: "New Name" })
      ).rejects.toThrow("User ID is required");
    });

    it("should throw error for invalid funnel ID", async () => {
      await expect(
        updateFunnel(userId, { workspaceSlug: "", funnelSlug: "" }, { name: "New Name" })
      ).rejects.toThrow("Invalid input");
    });

    it("should throw error if funnel does not exist", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await expect(
        updateFunnel(userId, { workspaceSlug, funnelSlug }, { name: "New Name" })
      ).rejects.toThrow("Funnel not found");
    });

    it("should throw error if no fields to update", async () => {
      const existingFunnel = {
        id: funnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(existingFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
      });

      await expect(updateFunnel(userId, { workspaceSlug, funnelSlug }, {})).rejects.toThrow(
        "Nothing to update"
      );
    });

    it("should throw error if update data is same as existing", async () => {
      const existingFunnel = {
        id: funnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(existingFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
      });

      await expect(
        updateFunnel(userId, { workspaceSlug, funnelSlug }, {
          name: "Test Funnel",
          status: $Enums.FunnelStatus.DRAFT,
        })
      ).rejects.toThrow("Nothing to update");
    });
  });

  describe("Permission Checks", () => {
    const existingFunnel = {
      id: funnelId,
      name: "Test Funnel",
      slug: "test-funnel",
      status: $Enums.FunnelStatus.DRAFT,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        name: "Test Workspace",
        ownerId: userId,
      },
    };

    it("should allow workspace owner to update funnel", async () => {
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(existingFunnel)
        .mockResolvedValueOnce(null);
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "Updated Funnel",
        slug: "updated-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
      });

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
        isOwner: true,
      });

      const result = await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        name: "Updated Funnel",
      });

      expect(result.message).toContain("Updated Funnel");
      expect(PermissionManager.can).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "EDIT_FUNNEL",
      });
    });

    it("should allow admin member to update funnel", async () => {
      const adminFunnel = {
        ...existingFunnel,
        workspace: {
          ...existingFunnel.workspace,
          ownerId: 999,
        },
      };

      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(adminFunnel)
        .mockResolvedValueOnce(null);
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "Updated by Admin",
        slug: "updated-by-admin",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
      });

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.ADMIN,
        isOwner: false,
      });

      const result = await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        name: "Updated by Admin",
      });

      expect(result.message).toContain("Updated by Admin");
    });

    it("should allow editor member to update funnel", async () => {
      const editorFunnel = {
        ...existingFunnel,
        workspace: {
          ...existingFunnel.workspace,
          ownerId: 999,
        },
      };

      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(editorFunnel)
        .mockResolvedValueOnce(null);
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "Updated by Editor",
        slug: "updated-by-editor",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
      });

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.EDITOR,
        isOwner: false,
      });

      const result = await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        name: "Updated by Editor",
      });

      expect(result.message).toContain("Updated by Editor");
    });

    it("should deny viewer member from updating funnel", async () => {
      const viewerFunnel = {
        ...existingFunnel,
        workspace: {
          ...existingFunnel.workspace,
          ownerId: 999,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(viewerFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: false,
        reason: "You don't have permission to update funnel",
        userRole: $Enums.WorkspaceRole.VIEWER,
      });

      await expect(
        updateFunnel(userId, { workspaceSlug, funnelSlug }, { name: "Try to Update" })
      ).rejects.toThrow("You don't have permission to update funnel");
    });

    it("should deny non-member from updating funnel", async () => {
      const nonMemberFunnel = {
        ...existingFunnel,
        workspace: {
          ...existingFunnel.workspace,
          ownerId: 999,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(nonMemberFunnel);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: false,
        reason: "You don't have access to this workspace",
      });

      await expect(
        updateFunnel(userId, { workspaceSlug, funnelSlug }, { name: "Try to Update" })
      ).rejects.toThrow("You don't have access to this workspace");
    });
  });

  describe("Name Updates", () => {
    const existingFunnel = {
      id: funnelId,
      name: "Old Name",
      slug: "old-name",
      status: $Enums.FunnelStatus.DRAFT,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        name: "Test Workspace",
        ownerId: userId,
      },
    };

    beforeEach(() => {
      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
      });
    });

    it("should update funnel name", async () => {
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(existingFunnel)
        .mockResolvedValueOnce(null);
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "New Name",
        slug: "new-name",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
      });

      const result = await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        name: "New Name",
      });

      expect(result.message).toContain("New Name");
      expect(mockPrisma.funnel.update).toHaveBeenCalledWith({
        where: { id: funnelId },
        data: expect.objectContaining({
          name: "New Name",
          slug: expect.any(String),
        }),
        select: expect.any(Object),
      });
    });

    it("should trim whitespace from name", async () => {
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(existingFunnel)
        .mockResolvedValueOnce(null);
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "Trimmed Name",
        slug: "trimmed-name",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
      });

      await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        name: "  Trimmed Name  ",
      });

      expect(mockPrisma.funnel.update).toHaveBeenCalledWith({
        where: { id: funnelId },
        data: expect.objectContaining({
          name: "Trimmed Name",
        }),
        select: expect.any(Object),
      });
    });

    it("should auto-generate slug when name changes", async () => {
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(existingFunnel)
        .mockResolvedValueOnce(null);
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "New Name",
        slug: "new-name",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
      });

      await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        name: "New Name",
      });

      expect(mockPrisma.funnel.update).toHaveBeenCalledWith({
        where: { id: funnelId },
        data: expect.objectContaining({
          slug: expect.any(String),
        }),
        select: expect.any(Object),
      });
    });

    it("should throw error for duplicate name", async () => {
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(existingFunnel)
        .mockResolvedValueOnce(null);

      const duplicateError = new Error("Unique constraint failed on slug");
      (duplicateError as any).code = "P2002";
      mockPrisma.funnel.update.mockRejectedValue(duplicateError);

      await expect(
        updateFunnel(userId, { workspaceSlug, funnelSlug }, { name: "Duplicate Name" })
      ).rejects.toThrow("already in use");
    });
  });

  describe("Slug Updates", () => {
    const existingFunnel = {
      id: funnelId,
      name: "Test Funnel",
      slug: "old-slug",
      status: $Enums.FunnelStatus.DRAFT,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        name: "Test Workspace",
        ownerId: userId,
      },
    };

    beforeEach(() => {
      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
      });
    });

    it("should update funnel slug", async () => {
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(existingFunnel)
        .mockResolvedValueOnce(null);
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "Test Funnel",
        slug: "new-slug",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
      });

      const result = await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        slug: "new-slug",
      });

      expect(result.funnelId).toBe(funnelId);
      expect(mockPrisma.funnel.update).toHaveBeenCalledWith({
        where: { id: funnelId },
        data: expect.objectContaining({
          slug: expect.any(String),
        }),
        select: expect.any(Object),
      });
    });

    it("should not auto-generate slug if explicitly provided", async () => {
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(existingFunnel)
        .mockResolvedValueOnce(null);
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "New Name",
        slug: "custom-slug",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
      });

      await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        name: "New Name",
        slug: "custom-slug",
      });

      expect(mockPrisma.funnel.update).toHaveBeenCalled();
    });
  });

  describe("Status Updates", () => {
    const existingFunnel = {
      id: funnelId,
      name: "Test Funnel",
      slug: "test-funnel",
      status: $Enums.FunnelStatus.DRAFT,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        name: "Test Workspace",
        ownerId: userId,
      },
    };

    beforeEach(() => {
      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
      });
      mockPrisma.funnel.findFirst.mockResolvedValue(existingFunnel);
    });

    it("should update funnel status to LIVE", async () => {
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.LIVE,
        workspaceId,
      });

      const result = await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        status: $Enums.FunnelStatus.LIVE,
      });

      expect(result.funnelId).toBe(funnelId);
      expect(mockPrisma.funnel.update).toHaveBeenCalledWith({
        where: { id: funnelId },
        data: expect.objectContaining({
          status: $Enums.FunnelStatus.LIVE,
        }),
        select: expect.any(Object),
      });
    });

    it("should update funnel status to ARCHIVED", async () => {
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.ARCHIVED,
        workspaceId,
      });

      await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        status: $Enums.FunnelStatus.ARCHIVED,
      });

      expect(mockPrisma.funnel.update).toHaveBeenCalledWith({
        where: { id: funnelId },
        data: expect.objectContaining({
          status: $Enums.FunnelStatus.ARCHIVED,
        }),
        select: expect.any(Object),
      });
    });

    it("should update funnel status to SHARED", async () => {
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.SHARED,
        workspaceId,
      });

      await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        status: $Enums.FunnelStatus.SHARED,
      });

      expect(mockPrisma.funnel.update).toHaveBeenCalledWith({
        where: { id: funnelId },
        data: expect.objectContaining({
          status: $Enums.FunnelStatus.SHARED,
        }),
        select: expect.any(Object),
      });
    });
  });

  describe("Cache Invalidation", () => {
    const existingFunnel = {
      id: funnelId,
      name: "Test Funnel",
      slug: "test-funnel",
      status: $Enums.FunnelStatus.DRAFT,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        name: "Test Workspace",
        ownerId: userId,
      },
    };

    beforeEach(() => {
      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
      });
      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(existingFunnel)
        .mockResolvedValueOnce(null);
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "Updated Funnel",
        slug: "updated-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
      });
    });

    it("should invalidate individual funnel cache after update", async () => {
      await updateFunnel(userId, { workspaceSlug, funnelSlug }, { name: "Updated Funnel" });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceSlug}:funnel:updated-funnel:full`
      );
    });

    it("should invalidate workspace funnels list cache after update", async () => {
      await updateFunnel(userId, { workspaceSlug, funnelSlug }, { name: "Updated Funnel" });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`
      );
    });

    it("should invalidate all relevant cache keys", async () => {
      await updateFunnel(userId, { workspaceSlug, funnelSlug }, { name: "Updated Funnel" });

      const expectedCacheKeys = [
        `funnel:${funnelId}:settings:full`,
        `workspace:${workspaceSlug}:funnel:updated-funnel:full`,
        `workspace:${workspaceId}:funnels:all`,
        `workspace:${workspaceId}:funnels:list`,
        `user:${userId}:workspace:${workspaceId}:funnels`,
        `workspace:${workspaceSlug}:funnel:test-funnel:full`, // Old slug cache invalidation
      ];

      expectedCacheKeys.forEach((key) => {
        expect(cacheService.del).toHaveBeenCalledWith(key);
      });

      expect(cacheService.del).toHaveBeenCalledTimes(expectedCacheKeys.length);
    });

    it("should continue operation if cache invalidation fails", async () => {
      (cacheService.del as any).mockRejectedValue(new Error("Cache error"));

      const result = await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        name: "Updated Funnel",
      });

      expect(result.message).toContain("Updated Funnel");
    });
  });

  describe("Edge Cases", () => {
    it("should handle database errors gracefully", async () => {
      const existingFunnel = {
        id: funnelId,
        name: "Test Funnel",
        slug: "test-funnel",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(existingFunnel)
        .mockResolvedValueOnce(null);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
      });

      mockPrisma.funnel.update.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        updateFunnel(userId, { workspaceSlug, funnelSlug }, { name: "New Name" })
      ).rejects.toThrow("Failed to update funnel");
    });

    it("should update multiple fields at once", async () => {
      const existingFunnel = {
        id: funnelId,
        name: "Old Name",
        slug: "old-slug",
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          name: "Test Workspace",
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce(existingFunnel)
        .mockResolvedValueOnce(null);
      mockPrisma.funnel.update.mockResolvedValue({
        id: funnelId,
        name: "New Name",
        slug: "new-slug",
        status: $Enums.FunnelStatus.LIVE,
        workspaceId,
      });

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
        userRole: $Enums.WorkspaceRole.OWNER,
      });

      const result = await updateFunnel(userId, { workspaceSlug, funnelSlug }, {
        name: "New Name",
        slug: "new-slug",
        status: $Enums.FunnelStatus.LIVE,
      });

      expect(result.message).toContain("New Name");
      expect(mockPrisma.funnel.update).toHaveBeenCalledWith({
        where: { id: funnelId },
        data: expect.objectContaining({
          name: "New Name",
          slug: expect.any(String),
          status: $Enums.FunnelStatus.LIVE,
        }),
        select: expect.any(Object),
      });
    });
  });
});
