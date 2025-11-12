import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { updateFunnelPassword } from "../../services/funnel-settings/update-password";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../errors";
import * as encryptionModule from "../../services/funnel-settings/lock-funnel/utils/encryption";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");
vi.mock("../../services/funnel-settings/lock-funnel/utils/encryption", () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn(),
}));
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
  const funnelSlug = "test-funnel";
  const workspaceSlug = "test-workspace";
  const newPassword = "NewPassword456";
  const currentPasswordHash = "$2a$10$currentHashedPassword";
  const newPasswordHash = "$2a$10$newHashedPassword";

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findFirst: vi.fn(),
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
          workspaceSlug,
          funnelSlug,
          newPassword,
        })
      ).rejects.toThrow("User ID is required");
    });

    it("should throw error for missing workspace slug", async () => {
      await expect(
        updateFunnelPassword(userId, {
          workspaceSlug: "",
          funnelSlug,
          newPassword,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for missing funnel slug", async () => {
      await expect(
        updateFunnelPassword(userId, {
          workspaceSlug,
          funnelSlug: "",
          newPassword,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if newPassword is missing", async () => {
      await expect(
        updateFunnelPassword(userId, {
          workspaceSlug,
          funnelSlug,
        } as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if newPassword is too short", async () => {
      await expect(
        updateFunnelPassword(userId, {
          workspaceSlug,
          funnelSlug,
          newPassword: "short",
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if newPassword is too long", async () => {
      const longPassword = "a".repeat(101);
      await expect(
        updateFunnelPassword(userId, {
          workspaceSlug,
          funnelSlug,
          newPassword: longPassword,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if funnel does not exist", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await expect(
        updateFunnelPassword(userId, {
          workspaceSlug,
          funnelSlug,
          newPassword,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Permission Checks", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      name: "Test Funnel",
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: "ACTIVE",
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
    });

    it("should check EDIT_FUNNEL permission", async () => {
      const settings = {
        id: 1,
        isPasswordProtected: true,
        passwordHash: currentPasswordHash,
      };

      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
      (encryptionModule.encrypt as any).mockReturnValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...settings,
        passwordHash: newPasswordHash,
      });

      await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
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
          workspaceSlug,
          funnelSlug,
          newPassword,
        })
      ).rejects.toThrow("You don't have permission to edit funnel");
    });
  });

  describe("Business Logic - Funnel Lock Requirement", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      name: "Test Funnel",
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: "ACTIVE",
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
    });

    it("should throw error if funnel settings do not exist", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(null);

      await expect(
        updateFunnelPassword(userId, {
          workspaceSlug,
          funnelSlug,
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
          workspaceSlug,
          funnelSlug,
          newPassword,
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        updateFunnelPassword(userId, {
          workspaceSlug,
          funnelSlug,
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
          workspaceSlug,
          funnelSlug,
          newPassword,
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        updateFunnelPassword(userId, {
          workspaceSlug,
          funnelSlug,
          newPassword,
        })
      ).rejects.toThrow("No password is set for this funnel");
    });
  });

  describe("Password Encryption", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      name: "Test Funnel",
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: "ACTIVE",
      },
    };

    const settings = {
      id: 1,
      isPasswordProtected: true,
      passwordHash: currentPasswordHash,
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
    });

    it("should encrypt new password using encryption utility", async () => {
      (encryptionModule.encrypt as any).mockReturnValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
        newPassword,
      });

      expect(encryptionModule.encrypt).toHaveBeenCalledWith(newPassword);
    });

    it("should trim whitespace from passwords before processing", async () => {
      const passwordWithSpaces = "  NewPass123  ";
      (encryptionModule.encrypt as any).mockReturnValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
        newPassword: passwordWithSpaces,
      });

      expect(encryptionModule.encrypt).toHaveBeenCalledWith("NewPass123");
    });

    it("should never store plain text password", async () => {
      (encryptionModule.encrypt as any).mockReturnValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
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
      slug: funnelSlug,
      name: "Test Funnel",
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: "ACTIVE",
      },
    };

    const settings = {
      id: 1,
      isPasswordProtected: true,
      passwordHash: currentPasswordHash,
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
      (encryptionModule.encrypt as any).mockReturnValue(newPasswordHash);
    });

    it("should update only passwordHash field", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...settings,
        passwordHash: newPasswordHash,
      });

      await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
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
        workspaceSlug,
        funnelSlug,
        newPassword,
      });

      const updateCall = mockPrisma.funnelSettings.update.mock.calls[0][0];
      expect(updateCall.data.isPasswordProtected).toBeUndefined();
    });
  });

  describe("Cache Invalidation", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      name: "Test Funnel",
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: "ACTIVE",
      },
    };

    const settings = {
      id: 1,
      isPasswordProtected: true,
      passwordHash: currentPasswordHash,
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
      (encryptionModule.encrypt as any).mockReturnValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);
    });

    it("should invalidate funnel settings cache", async () => {
      await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
        newPassword,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `funnel:${funnelId}:settings:full`,
        { prefix: "settings" }
      );
    });

    it("should invalidate workspace funnel cache", async () => {
      await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
        newPassword,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceSlug}:funnel:${funnelSlug}:full`,
        { prefix: "funnel" }
      );
    });

    it("should invalidate workspace funnels list cache", async () => {
      await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
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
        workspaceSlug,
        funnelSlug,
        newPassword,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Funnel password updated successfully");
    });
  });

  describe("Response Format", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      name: "Test Funnel",
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: "ACTIVE",
      },
    };

    const settings = {
      id: 1,
      isPasswordProtected: true,
      passwordHash: currentPasswordHash,
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
      (encryptionModule.encrypt as any).mockReturnValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);
    });

    it("should return success message and status", async () => {
      const result = await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
        newPassword,
      });

      expect(result).toEqual({
        message: "Funnel password updated successfully",
        success: true,
      });
    });

    it("should have correct response structure", async () => {
      const result = await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
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
      slug: funnelSlug,
      name: "Test Funnel",
      workspaceId,
      workspace: {
        id: workspaceId,
        slug: workspaceSlug,
        status: "ACTIVE",
      },
    };

    const settings = {
      id: 1,
      isPasswordProtected: true,
      passwordHash: currentPasswordHash,
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(settings);
    });

    it("should handle special characters in password", async () => {
      const specialPassword = "P@$$w0rd!#$%^&*()";
      (encryptionModule.encrypt as any).mockReturnValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      const result = await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
        newPassword: specialPassword,
      });

      expect(result.success).toBe(true);
      expect(encryptionModule.encrypt).toHaveBeenCalledWith(specialPassword);
    });

    it("should handle unicode characters in password", async () => {
      const unicodePassword = "密碼123パス";
      (encryptionModule.encrypt as any).mockReturnValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      const result = await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
        newPassword: unicodePassword,
      });

      expect(result.success).toBe(true);
    });

    it("should handle maximum length password (100 chars)", async () => {
      const maxPassword = "a".repeat(100);
      (encryptionModule.encrypt as any).mockReturnValue(newPasswordHash);
      mockPrisma.funnelSettings.update.mockResolvedValue(settings);

      const result = await updateFunnelPassword(userId, {
        workspaceSlug,
        funnelSlug,
        newPassword: maxPassword,
      });

      expect(result.success).toBe(true);
    });
  });
});
