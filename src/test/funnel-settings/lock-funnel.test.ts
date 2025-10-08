import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { lockFunnel } from "../../services/funnel-settings/lock-funnel";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import bcrypt from "bcryptjs";
import { BadRequestError } from "../../errors";

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

describe("Lock Funnel Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const funnelId = 1;
  const workspaceId = 1;
  const password = "SecurePass123";
  const hashedPassword = "$2a$10$hashedPasswordExample";

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findUnique: vi.fn(),
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
    (bcrypt.hash as any).mockResolvedValue(hashedPassword);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error if user ID is not provided", async () => {
      await expect(
        lockFunnel(0, { funnelId, password })
      ).rejects.toThrow("User ID is required");
    });

    it("should throw error for invalid funnel ID (negative)", async () => {
      await expect(
        lockFunnel(userId, { funnelId: -1, password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel ID (zero)", async () => {
      await expect(
        lockFunnel(userId, { funnelId: 0, password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel ID (non-integer)", async () => {
      await expect(
        lockFunnel(userId, { funnelId: 1.5, password } as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if password is missing", async () => {
      await expect(
        lockFunnel(userId, { funnelId } as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if password is empty string", async () => {
      await expect(
        lockFunnel(userId, { funnelId, password: "" })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if password is too short", async () => {
      await expect(
        lockFunnel(userId, { funnelId, password: "short" })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if funnel does not exist", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(
        lockFunnel(userId, { funnelId, password })
      ).rejects.toThrow("Funnel not found");
    });
  });

  describe("Permission Checks", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
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
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password });

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
        lockFunnel(userId, { funnelId, password })
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
        passwordHash: hashedPassword,
      });

      const result = await lockFunnel(userId, { funnelId, password });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Funnel locked successfully");
    });

    it("should deny non-member from locking funnel", async () => {
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have access to this workspace")
      );

      await expect(
        lockFunnel(userId, { funnelId, password })
      ).rejects.toThrow("You don't have access to this workspace");
    });
  });

  describe("Password Hashing", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
    });

    it("should hash password using bcrypt with 10 salt rounds", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password });

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it("should trim whitespace from password before hashing", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });

      const passwordWithSpaces = "  SecurePass123  ";
      await lockFunnel(userId, { funnelId, password: passwordWithSpaces });

      expect(bcrypt.hash).toHaveBeenCalledWith("SecurePass123", 10);
    });

    it("should store hashed password, not plain text", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId,
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });

      // Verify that the plain password is NOT stored
      const updateCall = mockPrisma.funnelSettings.update.mock.calls[0][0];
      expect(updateCall.data.passwordHash).not.toBe(password);
      expect(updateCall.data.passwordHash).toBe(hashedPassword);
    });
  });

  describe("Settings Update (Existing Settings)", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
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
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
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
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
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
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password });

      const updateCall = mockPrisma.funnelSettings.update.mock.calls[0][0];
      expect(updateCall.data.isPasswordProtected).toBe(true);
    });
  });

  describe("Settings Creation (No Existing Settings)", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
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
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password });

      expect(mockPrisma.funnelSettings.create).toHaveBeenCalledWith({
        data: {
          funnelId,
          isPasswordProtected: true,
          passwordHash: hashedPassword,
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
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password });

      const createCall = mockPrisma.funnelSettings.create.mock.calls[0][0];
      expect(createCall.data.isPasswordProtected).toBe(true);
      expect(createCall.data.passwordHash).toBe(hashedPassword);
    });
  });

  describe("Transaction Handling", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
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
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should rollback if transaction fails", async () => {
      mockPrisma.$transaction.mockRejectedValue(
        new Error("Transaction failed")
      );

      await expect(
        lockFunnel(userId, { funnelId, password })
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
        lockFunnel(userId, { funnelId, password })
      ).rejects.toThrow("Update failed");
    });
  });

  describe("Cache Invalidation", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
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
        passwordHash: hashedPassword,
      });
    });

    it("should invalidate funnel settings cache", async () => {
      await lockFunnel(userId, { funnelId, password });

      expect(cacheService.del).toHaveBeenCalledWith(
        `funnel:${funnelId}:settings:full`
      );
    });

    it("should continue operation if cache invalidation fails", async () => {
      (cacheService.del as any).mockRejectedValue(new Error("Cache error"));

      const result = await lockFunnel(userId, { funnelId, password });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Funnel locked successfully");
    });

    it("should invalidate cache with correct funnel ID", async () => {
      const customFunnelId = 999;
      const customFunnel = {
        id: customFunnelId,
        workspaceId,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(customFunnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        id: 1,
        funnelId: customFunnelId,
        isPasswordProtected: false,
      });
      mockPrisma.funnelSettings.update.mockResolvedValue({
        id: 1,
        funnelId: customFunnelId,
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId: customFunnelId, password });

      expect(cacheService.del).toHaveBeenCalledWith(
        `funnel:${customFunnelId}:settings:full`
      );
    });
  });

  describe("Response Format", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
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
        passwordHash: hashedPassword,
      });
    });

    it("should return success message", async () => {
      const result = await lockFunnel(userId, { funnelId, password });

      expect(result.message).toBe("Funnel locked successfully");
      expect(result.success).toBe(true);
    });

    it("should return valid response object", async () => {
      const result = await lockFunnel(userId, { funnelId, password });

      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("success");
      expect(typeof result.message).toBe("string");
      expect(typeof result.success).toBe("boolean");
    });

    it("should not include password or hash in response", async () => {
      const result = await lockFunnel(userId, { funnelId, password });

      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("passwordHash");
    });
  });

  describe("Edge Cases", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
    });

    it("should handle bcrypt errors gracefully", async () => {
      (bcrypt.hash as any).mockRejectedValue(new Error("Bcrypt error"));

      await expect(
        lockFunnel(userId, { funnelId, password })
      ).rejects.toThrow("Bcrypt error");
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
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password: longPassword });

      expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, 10);
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
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password: specialPassword });

      expect(bcrypt.hash).toHaveBeenCalledWith(specialPassword, 10);
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
        passwordHash: hashedPassword,
      });

      await lockFunnel(userId, { funnelId, password: unicodePassword });

      expect(bcrypt.hash).toHaveBeenCalledWith(unicodePassword, 10);
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.$transaction.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        lockFunnel(userId, { funnelId, password })
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("Zod Validation Errors", () => {
    it("should throw BadRequestError for Zod validation errors", async () => {
      try {
        await lockFunnel(userId, { funnelId: -1, password });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
      }
    });

    it("should include validation message in BadRequestError", async () => {
      try {
        await lockFunnel(userId, { funnelId: 0, password });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        if (error instanceof BadRequestError) {
          expect(error.message).toBeTruthy();
        }
      }
    });
  });
});
