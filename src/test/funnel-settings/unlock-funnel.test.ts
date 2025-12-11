import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { unlockFunnel } from "../../services/funnel-settings/unlock-funnel";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { BadRequestError } from "../../errors";
import { $Enums } from "../../generated/prisma-client";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");
vi.mock("../../utils/workspace-utils/workspace-permission-manager", () => ({
  PermissionManager: {
    requirePermission: vi.fn(),
  },
  PermissionAction: {
    EDIT_FUNNEL: "EDIT_FUNNEL",
  },
}));

import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager";

describe("Unlock Funnel Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const funnelId = 1;
  const workspaceId = 1;
  const funnelSlug = "test-funnel";
  const workspaceSlug = "test-workspace";

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findFirst: vi.fn(),
      },
      funnelSettings: {
        update: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.del as any).mockResolvedValue(undefined);
    (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error if user ID is not provided", async () => {
      await expect(unlockFunnel(0, { workspaceSlug, funnelSlug })).rejects.toThrow(
        "User ID is required"
      );
    });

    it("should throw error for missing workspace slug", async () => {
      await expect(unlockFunnel(userId, { workspaceSlug: "", funnelSlug })).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw error for missing funnel slug", async () => {
      await expect(unlockFunnel(userId, { workspaceSlug, funnelSlug: "" })).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw error for invalid workspace slug type", async () => {
      await expect(
        unlockFunnel(userId, { workspaceSlug: 123 as any, funnelSlug })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if funnel does not exist", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await expect(unlockFunnel(userId, { workspaceSlug, funnelSlug })).rejects.toThrow(
        "Funnel not found"
      );
    });
  });

  describe("Permission Checks", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: $Enums.WorkspaceStatus.ACTIVE,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
    });

    it("should check EDIT_FUNNEL permission", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "EDIT_FUNNEL",
      });
    });

    it("should throw error if user lacks EDIT_FUNNEL permission", async () => {
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have permission to edit funnel")
      );

      await expect(unlockFunnel(userId, { workspaceSlug, funnelSlug })).rejects.toThrow(
        "You don't have permission to edit funnel"
      );
    });

    it("should allow workspace owner to unlock funnel", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      const result = await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Funnel unlocked successfully");
    });

    it("should deny non-member from unlocking funnel", async () => {
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have access to this workspace")
      );

      await expect(unlockFunnel(userId, { workspaceSlug, funnelSlug })).rejects.toThrow(
        "You don't have access to this workspace"
      );
    });
  });

  describe("DRAFT Workspace Status Restriction", () => {
    it("should prevent unlocking funnel in DRAFT workspace", async () => {
      const draftFunnel = {
        id: funnelId,
        slug: funnelSlug,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          status: $Enums.WorkspaceStatus.DRAFT,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(draftFunnel);

      await expect(unlockFunnel(userId, { workspaceSlug, funnelSlug })).rejects.toThrow(
        "Password protection cannot be removed from funnels in your current workspace plan"
      );
    });

    it("should show user-friendly message for DRAFT workspace restriction", async () => {
      const draftFunnel = {
        id: funnelId,
        slug: funnelSlug,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          status: $Enums.WorkspaceStatus.DRAFT,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(draftFunnel);

      await expect(unlockFunnel(userId, { workspaceSlug, funnelSlug })).rejects.toThrow(
        "This feature is available for workspaces with enhanced access"
      );
    });

    it("should allow unlocking in ACTIVE workspace", async () => {
      const activeFunnel = {
        id: funnelId,
        slug: funnelSlug,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          status: $Enums.WorkspaceStatus.ACTIVE,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(activeFunnel);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      const result = await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(result.success).toBe(true);
    });

    it("should not call update for DRAFT workspace", async () => {
      const draftFunnel = {
        id: funnelId,
        slug: funnelSlug,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          status: $Enums.WorkspaceStatus.DRAFT,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(draftFunnel);

      await expect(unlockFunnel(userId, { workspaceSlug, funnelSlug })).rejects.toThrow();

      expect(mockPrisma.funnelSettings.update).not.toHaveBeenCalled();
    });

    it("should check workspace status before updating settings", async () => {
      const activeFunnel = {
        id: funnelId,
        slug: funnelSlug,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          status: $Enums.WorkspaceStatus.ACTIVE,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(activeFunnel);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalled();
    });
  });

  describe("Settings Update", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: $Enums.WorkspaceStatus.ACTIVE,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
    });

    it("should set isPasswordProtected to false", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });
    });

    it("should remove passwordHash", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      const updateCall = mockPrisma.funnelSettings.update.mock.calls[0][0];
      expect(updateCall.data.passwordHash).toBeNull();
    });

    it("should remove existing password hash", async () => {
      const existingHash = "$2a$10$hashedPassword";
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: expect.objectContaining({
          passwordHash: null,
        }),
      });
    });

    it("should update settings for correct funnel ID", async () => {
      const customFunnelId = 999;
      const customFunnelSlug = "custom-funnel";
      const customFunnel = {
        id: customFunnelId,
        slug: customFunnelSlug,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          status: $Enums.WorkspaceStatus.ACTIVE,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(customFunnel);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId: customFunnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      await unlockFunnel(userId, { workspaceSlug, funnelSlug: customFunnelSlug });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId: customFunnelId },
        data: expect.any(Object),
      });
    });
  });

  describe("Cache Invalidation", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: $Enums.WorkspaceStatus.ACTIVE,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });
    });

    it("should invalidate all relevant cache keys", async () => {
      await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(cacheService.del).toHaveBeenCalledTimes(3);
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceSlug}:funnel:${funnelSlug}:settings:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceSlug}:funnel:${funnelSlug}:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`
      );
    });

    it("should continue operation if cache invalidation fails", async () => {
      (cacheService.del as any).mockRejectedValue(new Error("Cache error"));

      const result = await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Funnel unlocked successfully");
    });

    it("should invalidate cache with correct funnel ID", async () => {
      const customFunnelId = 999;
      const customWorkspaceId = 888;
      const customFunnelSlug = "custom-funnel";
      const customWorkspaceSlug = "custom-workspace";
      const customFunnel = {
        id: customFunnelId,
        slug: customFunnelSlug,
        workspaceId: customWorkspaceId,
        workspace: {
          id: customWorkspaceId,
          slug: customWorkspaceSlug,
          status: $Enums.WorkspaceStatus.ACTIVE,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(customFunnel);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId: customFunnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      await unlockFunnel(userId, { workspaceSlug: customWorkspaceSlug, funnelSlug: customFunnelSlug });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${customWorkspaceSlug}:funnel:${customFunnelSlug}:settings:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${customWorkspaceSlug}:funnel:${customFunnelSlug}:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${customWorkspaceId}:funnels:all`
      );
    });

    it("should invalidate cache after successful update", async () => {
      await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe("Response Format", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: $Enums.WorkspaceStatus.ACTIVE,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });
    });

    it("should return success message", async () => {
      const result = await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(result.message).toBe("Funnel unlocked successfully");
      expect(result.success).toBe(true);
    });

    it("should return valid response object", async () => {
      const result = await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("success");
      expect(typeof result.message).toBe("string");
      expect(typeof result.success).toBe("boolean");
    });

    it("should not include password or hash in response", async () => {
      const result = await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("passwordHash");
    });

    it("should not include funnel or workspace data in response", async () => {
      const result = await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(result).not.toHaveProperty("funnel");
      expect(result).not.toHaveProperty("workspace");
    });
  });

  describe("Error Handling", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: $Enums.WorkspaceStatus.ACTIVE,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.funnelSettings.update.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(unlockFunnel(userId, { workspaceSlug, funnelSlug })).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle prisma errors", async () => {
      mockPrisma.funnelSettings.update.mockRejectedValue(
        new Error("Prisma error")
      );

      await expect(unlockFunnel(userId, { workspaceSlug, funnelSlug })).rejects.toThrow(
        "Prisma error"
      );
    });

    it("should handle settings not found error", async () => {
      const prismaError = new Error("Record to update not found");
      (prismaError as any).code = "P2025";
      mockPrisma.funnelSettings.update.mockRejectedValue(prismaError);

      await expect(unlockFunnel(userId, { workspaceSlug, funnelSlug })).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle funnel in different workspace", async () => {
      const differentWorkspaceId = 999;
      const differentWorkspaceSlug = "different-workspace";
      const funnel = {
        id: funnelId,
        slug: funnelSlug,
        workspaceId: differentWorkspaceId,
        workspace: {
          id: differentWorkspaceId,
          slug: differentWorkspaceSlug,
          status: $Enums.WorkspaceStatus.ACTIVE,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      await unlockFunnel(userId, { workspaceSlug: differentWorkspaceSlug, funnelSlug });

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId: differentWorkspaceId,
        action: "EDIT_FUNNEL",
      });
    });

    it("should handle concurrent unlock requests", async () => {
      const funnel = {
        id: funnelId,
        slug: funnelSlug,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          status: $Enums.WorkspaceStatus.ACTIVE,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      const results = await Promise.all([
        unlockFunnel(userId, { workspaceSlug, funnelSlug }),
        unlockFunnel(userId, { workspaceSlug, funnelSlug }),
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it("should handle already unlocked funnel", async () => {
      const funnel = {
        id: funnelId,
        slug: funnelSlug,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          status: $Enums.WorkspaceStatus.ACTIVE,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      const result = await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      expect(result.success).toBe(true);
    });
  });

  describe("Zod Validation Errors", () => {
    it("should throw BadRequestError for Zod validation errors", async () => {
      try {
        await unlockFunnel(userId, { workspaceSlug: "", funnelSlug });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
      }
    });

    it("should include validation message in BadRequestError", async () => {
      try {
        await unlockFunnel(userId, { workspaceSlug, funnelSlug: "" });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        if (error instanceof BadRequestError) {
          expect(error.message).toBeTruthy();
        }
      }
    });
  });

  describe("Workflow Integration", () => {
    it("should complete full unlock workflow for ACTIVE workspace", async () => {
      const funnel = {
        id: funnelId,
        slug: funnelSlug,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          status: $Enums.WorkspaceStatus.ACTIVE,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      });

      const result = await unlockFunnel(userId, { workspaceSlug, funnelSlug });

      // Verify all steps executed
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalled();
      expect(PermissionManager.requirePermission).toHaveBeenCalled();
      expect(mockPrisma.funnelSettings.update).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should stop workflow at DRAFT workspace check", async () => {
      const funnel = {
        id: funnelId,
        slug: funnelSlug,
        workspaceId,
        workspace: {
          id: workspaceId,
          slug: workspaceSlug,
          status: $Enums.WorkspaceStatus.DRAFT,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);

      await expect(unlockFunnel(userId, { workspaceSlug, funnelSlug })).rejects.toThrow();

      // Verify workflow stopped
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalled();
      expect(PermissionManager.requirePermission).toHaveBeenCalled();
      expect(mockPrisma.funnelSettings.update).not.toHaveBeenCalled();
      expect(cacheService.del).not.toHaveBeenCalled();
    });
  });
});
