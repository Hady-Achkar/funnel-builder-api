import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { updateFunnelPassword } from "../../services/funnel-settings/update-password";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import bcrypt from "bcryptjs";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../errors";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");
vi.mock("bcryptjs");
vi.mock("../../utils/workspace-utils/workspace-permission-manager", () => ({
  PermissionManager: {
    requirePermission: vi.fn(),
  },
  PermissionAction: {
    EDIT_FUNNEL: "EDIT_FUNNEL",
  },
}));

import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager";

describe("Update Funnel Password Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const funnelId = 1;
  const workspaceId = 1;
  const newPassword = "NewPassword456";
  const currentPasswordHash = "$2a$10$currentHashedPassword";
  const newPasswordHash = "$2a$10$newHashedPassword";

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findUnique: vi.fn(),
      },
      funnelSettings: {
        findUnique: vi.fn(),
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
      await expect(
        updateFunnelPassword(0, {
          funnelId,
          newPassword,
        })
      ).rejects.toThrow("User ID is required");
    });

    it("should throw error for invalid funnel ID (negative)", async () => {
      await expect(
        updateFunnelPassword(userId, {
          funnelId: -1,
          newPassword,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel ID (zero)", async () => {
      await expect(
        updateFunnelPassword(userId, {
          funnelId: 0,
          newPassword,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if newPassword is missing", async () => {
      await expect(
        updateFunnelPassword(userId, {
          funnelId,
        } as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if newPassword is too short", async () => {
      await expect(
        updateFunnelPassword(userId, {
          funnelId,
          newPassword: "short",
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if newPassword is too long", async () => {
      const longPassword = "a".repeat(101);
      await expect(
        updateFunnelPassword(userId, {
          funnelId,
          newPassword: longPassword,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if funnel does not exist", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(
        updateFunnelPassword(userId, {
          funnelId,
          newPassword,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Permission Checks", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: "test-workspace",
        status: "ACTIVE",
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
    });

    it("should check EDIT_FUNNEL permission", async () => {
      const settings = {
        id: 1,
        isPasswordProtected: true,
        passwordHash: currentPasswordHash,
      };

      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
      (bcrypt.hash as any).mockResolvedValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...settings,
        passwordHash: newPasswordHash,
      });

      await updateFunnelPassword(userId, {
        funnelId,
        newPassword,
      });

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

      await expect(
        updateFunnelPassword(userId, {
          funnelId,
          newPassword,
        })
      ).rejects.toThrow("You don't have permission to edit funnel");
    });
  });

  describe("Business Logic - Funnel Lock Requirement", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: "test-workspace",
        status: "ACTIVE",
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
    });

    it("should throw error if funnel settings do not exist", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(null);

      await expect(
        updateFunnelPassword(userId, {
          funnelId,
          newPassword,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw error if funnel is not password protected", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        isPasswordProtected: false,
        passwordHash: null,
      });

      await expect(
        updateFunnelPassword(userId, {
          funnelId,
          newPassword,
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        updateFunnelPassword(userId, {
          funnelId,
          newPassword,
        })
      ).rejects.toThrow(
        "This funnel is not password protected. Please lock the funnel first before updating its password."
      );
    });

    it("should throw error if passwordHash is null", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        isPasswordProtected: true,
        passwordHash: null,
      });

      await expect(
        updateFunnelPassword(userId, {
          funnelId,
          newPassword,
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        updateFunnelPassword(userId, {
          funnelId,
          newPassword,
        })
      ).rejects.toThrow("No password is set for this funnel");
    });
  });

  describe("Password Hashing", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: "test-workspace",
        status: "ACTIVE",
      },
    };

    const settings = {
      id: 1,
      isPasswordProtected: true,
      passwordHash: currentPasswordHash,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
    });

    it("should hash new password using bcrypt with 10 rounds", async () => {
      (bcrypt.hash as any).mockResolvedValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      await updateFunnelPassword(userId, {
        funnelId,
        newPassword,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
    });

    it("should trim whitespace from passwords before processing", async () => {
      const passwordWithSpaces = "  NewPass123  ";
      (bcrypt.hash as any).mockResolvedValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      await updateFunnelPassword(userId, {
        funnelId,
        newPassword: passwordWithSpaces,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("NewPass123", 10);
    });

    it("should never store plain text password", async () => {
      (bcrypt.hash as any).mockResolvedValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      await updateFunnelPassword(userId, {
        funnelId,
        newPassword,
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { id: settings.id },
        data: {
          passwordHash: newPasswordHash,
        },
      });

      const updateCall = mockPrisma.funnelSettings.update.mock.calls[0][0];
      expect(updateCall.data.passwordHash).toBe(newPasswordHash);
      expect(updateCall.data.passwordHash).not.toBe(newPassword);
    });
  });

  describe("Settings Update", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: "test-workspace",
        status: "ACTIVE",
      },
    };

    const settings = {
      id: 1,
      isPasswordProtected: true,
      passwordHash: currentPasswordHash,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
      (bcrypt.hash as any).mockResolvedValue(newPasswordHash);
    });

    it("should update only passwordHash field", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...settings,
        passwordHash: newPasswordHash,
      });

      await updateFunnelPassword(userId, {
        funnelId,
        newPassword,
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { id: settings.id },
        data: {
          passwordHash: newPasswordHash,
        },
      });

      // Ensure it only updates passwordHash, not isPasswordProtected
      const updateData = mockPrisma.funnelSettings.update.mock.calls[0][0].data;
      expect(Object.keys(updateData)).toEqual(["passwordHash"]);
    });

    it("should keep isPasswordProtected flag unchanged", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      await updateFunnelPassword(userId, {
        funnelId,
        newPassword,
      });

      const updateCall = mockPrisma.funnelSettings.update.mock.calls[0][0];
      expect(updateCall.data.isPasswordProtected).toBeUndefined();
    });
  });

  describe("Cache Invalidation", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: "test-workspace",
        status: "ACTIVE",
      },
    };

    const settings = {
      id: 1,
      isPasswordProtected: true,
      passwordHash: currentPasswordHash,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
      (bcrypt.hash as any).mockResolvedValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);
    });

    it("should invalidate funnel settings cache", async () => {
      await updateFunnelPassword(userId, {
        funnelId,
        newPassword,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `funnel:${funnelId}:settings:full`,
        { prefix: "settings" }
      );
    });

    it("should invalidate workspace funnel cache", async () => {
      await updateFunnelPassword(userId, {
        funnelId,
        newPassword,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnel:${funnelId}:full`,
        { prefix: "funnel" }
      );
    });

    it("should invalidate workspace funnels list cache", async () => {
      await updateFunnelPassword(userId, {
        funnelId,
        newPassword,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`,
        { prefix: "funnel" }
      );
    });

    it("should continue if cache invalidation fails", async () => {
      (cacheService.del as any).mockRejectedValue(
        new Error("Cache service unavailable")
      );

      const result = await updateFunnelPassword(userId, {
        funnelId,
        newPassword,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Funnel password updated successfully");
    });
  });

  describe("Response Format", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: "test-workspace",
        status: "ACTIVE",
      },
    };

    const settings = {
      id: 1,
      isPasswordProtected: true,
      passwordHash: currentPasswordHash,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
      (bcrypt.hash as any).mockResolvedValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);
    });

    it("should return success message and status", async () => {
      const result = await updateFunnelPassword(userId, {
        funnelId,
        newPassword,
      });

      expect(result).toEqual({
        message: "Funnel password updated successfully",
        success: true,
      });
    });

    it("should have correct response structure", async () => {
      const result = await updateFunnelPassword(userId, {
        funnelId,
        newPassword,
      });

      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("success");
      expect(typeof result.message).toBe("string");
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("Edge Cases", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: "test-workspace",
        status: "ACTIVE",
      },
    };

    const settings = {
      id: 1,
      isPasswordProtected: true,
      passwordHash: currentPasswordHash,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
    });

    it("should handle special characters in password", async () => {
      const specialPassword = "P@$$w0rd!#$%^&*()";
      (bcrypt.hash as any).mockResolvedValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      const result = await updateFunnelPassword(userId, {
        funnelId,
        newPassword: specialPassword,
      });

      expect(result.success).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith(specialPassword, 10);
    });

    it("should handle unicode characters in password", async () => {
      const unicodePassword = "密碼123パス";
      (bcrypt.hash as any).mockResolvedValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      const result = await updateFunnelPassword(userId, {
        funnelId,
        newPassword: unicodePassword,
      });

      expect(result.success).toBe(true);
    });

    it("should handle maximum length password (100 chars)", async () => {
      const maxPassword = "a".repeat(100);
      (bcrypt.hash as any).mockResolvedValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      const result = await updateFunnelPassword(userId, {
        funnelId,
        newPassword: maxPassword,
      });

      expect(result.success).toBe(true);
    });
  });
});
