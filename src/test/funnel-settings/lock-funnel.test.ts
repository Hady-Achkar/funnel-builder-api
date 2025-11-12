import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { lockFunnel } from "../../services/funnel-settings/lock-funnel";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { BadRequestError } from "../../errors";
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

describe("Lock Funnel Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const funnelId = 1;
  const funnelSlug = "test-funnel";
  const workspaceSlug = "test-workspace";
  const workspaceId = 1;
  const password = "SecurePass123";
  const encryptedPassword = "encrypted:iv:salt:data";

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findFirst: vi.fn(),
      },
      funnelSettings: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.del as any).mockResolvedValue(undefined);
    (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
    (encryptionModule.encrypt as any).mockReturnValue(encryptedPassword);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error if user ID is not provided", async () => {
      await expect(
        lockFunnel(0, { workspaceSlug, funnelSlug, password })
      ).rejects.toThrow("User ID is required");
    });

    it("should throw error for missing workspace slug", async () => {
      await expect(
        lockFunnel(userId, { workspaceSlug: "", funnelSlug, password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for missing funnel slug", async () => {
      await expect(
        lockFunnel(userId, { workspaceSlug, funnelSlug: "", password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid workspace slug type", async () => {
      await expect(
        lockFunnel(userId, { workspaceSlug: 123, funnelSlug, password } as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if password is missing", async () => {
      await expect(
        lockFunnel(userId, { workspaceSlug, funnelSlug } as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if password is empty string", async () => {
      await expect(
        lockFunnel(userId, { workspaceSlug, funnelSlug, password: "" })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if password is too short", async () => {
      await expect(
        lockFunnel(userId, { workspaceSlug, funnelSlug, password: "short" })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if funnel does not exist", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await expect(
        lockFunnel(userId, { workspaceSlug, funnelSlug, password })
      ).rejects.toThrow("Funnel not found");
    });
  });

  describe("Permission Checks", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        slug: workspaceSlug,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
    });

    it("should check EDIT_FUNNEL permission", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

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
        lockFunnel(userId, { workspaceSlug, funnelSlug, password })
      ).rejects.toThrow("You don't have permission to edit funnel");
    });

    it("should allow workspace owner to lock funnel", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      const result = await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Funnel locked successfully");
    });

    it("should deny non-member from locking funnel", async () => {
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have access to this workspace")
      );

      await expect(
        lockFunnel(userId, { workspaceSlug, funnelSlug, password })
      ).rejects.toThrow("You don't have access to this workspace");
    });
  });

  describe("Password Encryption", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        slug: workspaceSlug,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
    });

    it("should encrypt password using encryption utility", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(encryptionModule.encrypt).toHaveBeenCalledWith(password);
    });

    it("should trim whitespace from password before encrypting", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      const passwordWithSpaces = "  SecurePass123  ";
      await lockFunnel(userId, { workspaceSlug, funnelSlug, password: passwordWithSpaces });

      expect(encryptionModule.encrypt).toHaveBeenCalledWith("SecurePass123");
    });

    it("should store encrypted password, not plain text", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          isPasswordProtected: true,
          passwordHash: encryptedPassword,
        },
      });

      // Verify that the plain password is NOT stored
      const updateCall = mockPrisma.funnelSettings.update.mock.calls[0][0];
      expect(updateCall.data.passwordHash).not.toBe(password);
      expect(updateCall.data.passwordHash).toBe(encryptedPassword);
    });
  });

  describe("Settings Update (Existing Settings)", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        slug: workspaceSlug,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
    });

    it("should update existing funnel settings", async () => {
      const existingSettings = {
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      };

      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          isPasswordProtected: true,
          passwordHash: encryptedPassword,
        },
      });
      expect(mockPrisma.funnelSettings.create).not.toHaveBeenCalled();
    });

    it("should replace old password hash with new one", async () => {
      const oldHashedPassword = "$2a$10$oldHashedPassword";
      const existingSettings = {
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: oldHashedPassword,
      };

      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          isPasswordProtected: true,
          passwordHash: encryptedPassword,
        },
      });
    });

    it("should set isPasswordProtected to true when locking", async () => {
      const existingSettings = {
        id: 1,
        funnelId,
        isPasswordProtected: false,
        passwordHash: null,
      };

      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      const updateCall = mockPrisma.funnelSettings.update.mock.calls[0][0];
      expect(updateCall.data.isPasswordProtected).toBe(true);
    });
  });

  describe("Settings Creation (No Existing Settings)", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        slug: workspaceSlug,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
    });

    it("should create new settings if they don't exist", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(null);
      mockPrisma.funnelSettings.create.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(mockPrisma.funnelSettings.create).toHaveBeenCalledWith({
        data: {
          funnelId,
          isPasswordProtected: true,
          passwordHash: encryptedPassword,
        },
      });
      expect(mockPrisma.funnelSettings.update).not.toHaveBeenCalled();
    });

    it("should create settings with password protection enabled", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(null);
      mockPrisma.funnelSettings.create.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      const createCall = mockPrisma.funnelSettings.create.mock.calls[0][0];
      expect(createCall.data.isPasswordProtected).toBe(true);
      expect(createCall.data.passwordHash).toBe(encryptedPassword);
    });
  });

  describe("Transaction Handling", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        slug: workspaceSlug,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
    });

    it("should execute settings update within a transaction", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should rollback if transaction fails", async () => {
      mockPrisma.$transaction.mockRejectedValue(
        new Error("Transaction failed")
      );

      await expect(
        lockFunnel(userId, { workspaceSlug, funnelSlug, password })
      ).rejects.toThrow("Transaction failed");
    });

    it("should not commit changes if update fails", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          ...mockPrisma,
          funnelSettings: {
            findUnique: vi.fn().mockResolvedValue({
              id: 1,
              funnelId,
              isPasswordProtected: false,
            }),
            update: vi.fn().mockRejectedValue(new Error("Update failed")),
          },
        });
      });

      await expect(
        lockFunnel(userId, { workspaceSlug, funnelSlug, password })
      ).rejects.toThrow("Update failed");
    });
  });

  describe("Cache Invalidation", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        slug: workspaceSlug,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });
    });

    it("should invalidate all relevant cache keys", async () => {
      await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(cacheService.del).toHaveBeenCalledTimes(3);
      expect(cacheService.del).toHaveBeenCalledWith(
        `funnel:${funnelId}:settings:full`
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

      const result = await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Funnel locked successfully");
    });

    it("should invalidate cache with correct funnel ID", async () => {
      const customFunnelId = 999;
      const customFunnelSlug = "custom-funnel";
      const customWorkspaceSlug = "custom-workspace";
      const customWorkspaceId = 888;
      const customFunnel = {
        id: customFunnelId,
        slug: customFunnelSlug,
        workspaceId: customWorkspaceId,
        workspace: {
          slug: customWorkspaceSlug,
        },
      };

      mockPrisma.funnel.findFirst.mockResolvedValue(customFunnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId: customFunnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId: customFunnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug: customWorkspaceSlug, funnelSlug: customFunnelSlug, password });

      expect(cacheService.del).toHaveBeenCalledWith(
        `funnel:${customFunnelId}:settings:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${customWorkspaceSlug}:funnel:${customFunnelSlug}:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${customWorkspaceId}:funnels:all`
      );
    });
  });

  describe("Response Format", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        slug: workspaceSlug,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });
    });

    it("should return success message", async () => {
      const result = await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(result.message).toBe("Funnel locked successfully");
      expect(result.success).toBe(true);
    });

    it("should return valid response object", async () => {
      const result = await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("success");
      expect(typeof result.message).toBe("string");
      expect(typeof result.success).toBe("boolean");
    });

    it("should not include password or hash in response", async () => {
      const result = await lockFunnel(userId, { workspaceSlug, funnelSlug, password });

      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("passwordHash");
    });
  });

  describe("Edge Cases", () => {
    const funnel = {
      id: funnelId,
      slug: funnelSlug,
      workspaceId,
      workspace: {
        slug: workspaceSlug,
      },
    };

    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue(funnel);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
    });

    it("should handle encryption errors gracefully", async () => {
      (encryptionModule.encrypt as any).mockImplementation(() => {
        throw new Error("Encryption error");
      });

      await expect(
        lockFunnel(userId, { workspaceSlug, funnelSlug, password })
      ).rejects.toThrow("Encryption error");
    });

    it("should handle very long passwords", async () => {
      const longPassword = "A".repeat(100);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password: longPassword });

      expect(encryptionModule.encrypt).toHaveBeenCalledWith(longPassword);
    });

    it("should handle special characters in password", async () => {
      const specialPassword = "P@ssw0rd!#$%^&*()";
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password: specialPassword });

      expect(encryptionModule.encrypt).toHaveBeenCalledWith(specialPassword);
    });

    it("should handle unicode characters in password", async () => {
      const unicodePassword = "Пароль123密码";
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: encryptedPassword,
      });

      await lockFunnel(userId, { workspaceSlug, funnelSlug, password: unicodePassword });

      expect(encryptionModule.encrypt).toHaveBeenCalledWith(unicodePassword);
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.$transaction.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        lockFunnel(userId, { workspaceSlug, funnelSlug, password })
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("Zod Validation Errors", () => {
    it("should throw BadRequestError for Zod validation errors", async () => {
      try {
        await lockFunnel(userId, { workspaceSlug: "", funnelSlug, password });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
      }
    });

    it("should include validation message in BadRequestError", async () => {
      try {
        await lockFunnel(userId, { workspaceSlug, funnelSlug: "", password });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        if (error instanceof BadRequestError) {
          expect(error.message).toBeTruthy();
        }
      }
    });
  });
});
