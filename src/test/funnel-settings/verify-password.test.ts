import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { verifyFunnelPassword } from "../../services/funnel-settings/verify-password";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../errors";
import bcrypt from "bcryptjs";

vi.mock("../../lib/prisma");
vi.mock("bcryptjs");

describe("Verify Funnel Password Tests", () => {
  let mockPrisma: any;
  const funnelId = 1;
  const password = "SecurePass123";
  const hashedPassword = "$2a$10$hashedPasswordExample";

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnelSettings: {
        findUnique: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error for invalid funnel ID (negative)", async () => {
      await expect(
        verifyFunnelPassword({ funnelId: -1, password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel ID (zero)", async () => {
      await expect(
        verifyFunnelPassword({ funnelId: 0, password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel ID (non-integer)", async () => {
      await expect(
        verifyFunnelPassword({ funnelId: 1.5, password } as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if password is missing", async () => {
      await expect(
        verifyFunnelPassword({ funnelId } as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if password is empty string", async () => {
      await expect(
        verifyFunnelPassword({ funnelId, password: "" })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Funnel Settings Existence", () => {
    it("should throw NotFoundError if settings not found", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(null);

      await expect(
        verifyFunnelPassword({ funnelId, password })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError with correct message", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(null);

      await expect(
        verifyFunnelPassword({ funnelId, password })
      ).rejects.toThrow("Funnel settings not found");
    });
  });

  describe("Password Protection Status", () => {
    it("should allow access if funnel is not password protected", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: false,
        passwordHash: null,
      });

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Funnel is not password protected");
    });

    it("should allow access if passwordHash is null", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: null,
      });

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Funnel is not password protected");
    });

    it("should allow access if isPasswordProtected is false even with hash", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: false,
        passwordHash: hashedPassword,
      });

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Funnel is not password protected");
    });

    it("should not call bcrypt.compare if funnel is not protected", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: false,
        passwordHash: null,
      });

      await verifyFunnelPassword({ funnelId, password });

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe("Password Verification", () => {
    beforeEach(() => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
    });

    it("should return valid=true for correct password", async () => {
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Password is correct");
    });

    it("should return valid=false for incorrect password", async () => {
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({
        funnelId,
        password: "WrongPassword",
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBe("Invalid password");
    });

    it("should call bcrypt.compare with correct arguments", async () => {
      (bcrypt.compare as any).mockResolvedValue(true);

      await verifyFunnelPassword({ funnelId, password });

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it("should reject password with wrong case", async () => {
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({
        funnelId,
        password: "securepass123",
      });

      expect(result.valid).toBe(false);
    });

    it("should reject password with extra spaces", async () => {
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({
        funnelId,
        password: "  SecurePass123  ",
      });

      expect(result.valid).toBe(false);
    });

    it("should verify password with special characters", async () => {
      const specialPassword = "P@ssw0rd!#$%^&*()";
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyFunnelPassword({
        funnelId,
        password: specialPassword,
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        specialPassword,
        hashedPassword
      );
      expect(result.valid).toBe(true);
    });

    it("should verify password with unicode characters", async () => {
      const unicodePassword = "Пароль123密码";
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyFunnelPassword({
        funnelId,
        password: unicodePassword,
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        unicodePassword,
        hashedPassword
      );
      expect(result.valid).toBe(true);
    });

    it("should handle empty string password against hash", async () => {
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        verifyFunnelPassword({ funnelId, password: "" })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Response Format", () => {
    it("should return valid response structure for correct password", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("message");
      expect(typeof result.valid).toBe("boolean");
      expect(typeof result.message).toBe("string");
    });

    it("should return valid response structure for incorrect password", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("message");
      expect(result.valid).toBe(false);
    });

    it("should return valid response structure for unprotected funnel", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: false,
        passwordHash: null,
      });

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("message");
      expect(result.valid).toBe(true);
    });

    it("should allow optional sessionToken field in response", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: false,
        passwordHash: null,
      });

      const result = await verifyFunnelPassword({ funnelId, password });

      // sessionToken is optional, so it may or may not be present
      expect(result.sessionToken === undefined || typeof result.sessionToken === "string").toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long password", async () => {
      const longPassword = "A".repeat(500);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({
        funnelId,
        password: longPassword,
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(longPassword, hashedPassword);
      expect(result.valid).toBe(false);
    });

    it("should handle SQL injection attempt in password", async () => {
      const sqlInjectionPassword = "' OR '1'='1";
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({
        funnelId,
        password: sqlInjectionPassword,
      });

      expect(result.valid).toBe(false);
    });

    it("should handle bcrypt compare error", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
      (bcrypt.compare as any).mockRejectedValue(new Error("Bcrypt error"));

      await expect(
        verifyFunnelPassword({ funnelId, password })
      ).rejects.toThrow("Bcrypt error");
    });

    it("should handle null password hash gracefully", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: null,
      });

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Funnel is not password protected");
    });

    it("should handle multiple consecutive verification attempts", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });

      (bcrypt.compare as any)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result1 = await verifyFunnelPassword({
        funnelId,
        password: "wrong1",
      });
      const result2 = await verifyFunnelPassword({
        funnelId,
        password: "wrong2",
      });
      const result3 = await verifyFunnelPassword({
        funnelId,
        password: "correct",
      });

      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);
      expect(result3.valid).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledTimes(3);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockPrisma.funnelSettings.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        verifyFunnelPassword({ funnelId, password })
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle bcrypt errors", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
      (bcrypt.compare as any).mockRejectedValue(new Error("Bcrypt failed"));

      await expect(
        verifyFunnelPassword({ funnelId, password })
      ).rejects.toThrow("Bcrypt failed");
    });

    it("should throw BadRequestError for Zod validation errors", async () => {
      try {
        await verifyFunnelPassword({ funnelId: -1, password });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
      }
    });

    it("should include validation message in BadRequestError", async () => {
      try {
        await verifyFunnelPassword({ funnelId: 0, password });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        if (error instanceof BadRequestError) {
          expect(error.message).toBeTruthy();
        }
      }
    });
  });

  describe("Security Tests", () => {
    it("should not leak password hash in response", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(result).not.toHaveProperty("passwordHash");
      expect(result).not.toHaveProperty("hash");
      expect(JSON.stringify(result)).not.toContain(hashedPassword);
    });

    it("should not leak password hash on incorrect password", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(result).not.toHaveProperty("passwordHash");
      expect(JSON.stringify(result)).not.toContain(hashedPassword);
    });

    it("should not include sensitive data in error messages", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(null);

      try {
        await verifyFunnelPassword({ funnelId, password });
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).not.toContain(password);
          expect(error.message).not.toContain(hashedPassword);
        }
      }
    });

    it("should always use bcrypt.compare for timing attack resistance", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const startTime = Date.now();
      await verifyFunnelPassword({ funnelId, password });
      const endTime = Date.now();

      expect(bcrypt.compare).toHaveBeenCalled();
      // Bcrypt is inherently slow, protecting against timing attacks
    });
  });

  describe("Integration Tests", () => {
    it("should complete full workflow with correct password", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(mockPrisma.funnelSettings.findUnique).toHaveBeenCalledWith({
        where: { funnelId },
        select: {
          isPasswordProtected: true,
          passwordHash: true,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("Password is correct");
    });

    it("should complete full workflow with incorrect password", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: true,
        passwordHash: hashedPassword,
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(mockPrisma.funnelSettings.findUnique).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Invalid password");
    });

    it("should complete full workflow for unprotected funnel", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: false,
        passwordHash: null,
      });

      const result = await verifyFunnelPassword({ funnelId, password });

      expect(mockPrisma.funnelSettings.findUnique).toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("Funnel is not password protected");
    });

    it("should handle multiple funnels with different passwords", async () => {
      const funnel1Id = 1;
      const funnel2Id = 2;
      const hash1 = "$2a$10$hash1";
      const hash2 = "$2a$10$hash2";

      mockPrisma.funnelSettings.findUnique
        .mockResolvedValueOnce({
          isPasswordProtected: true,
          passwordHash: hash1,
        })
        .mockResolvedValueOnce({
          isPasswordProtected: true,
          passwordHash: hash2,
        });

      (bcrypt.compare as any).mockResolvedValue(true);

      const result1 = await verifyFunnelPassword({
        funnelId: funnel1Id,
        password: "password1",
      });
      const result2 = await verifyFunnelPassword({
        funnelId: funnel2Id,
        password: "password2",
      });

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(bcrypt.compare).toHaveBeenNthCalledWith(1, "password1", hash1);
      expect(bcrypt.compare).toHaveBeenNthCalledWith(2, "password2", hash2);
    });
  });

  describe("Query Optimization", () => {
    it("should only select required fields from database", async () => {
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: false,
        passwordHash: null,
      });

      await verifyFunnelPassword({ funnelId, password });

      expect(mockPrisma.funnelSettings.findUnique).toHaveBeenCalledWith({
        where: { funnelId },
        select: {
          isPasswordProtected: true,
          passwordHash: true,
        },
      });
    });

    it("should use correct funnel ID in query", async () => {
      const customFunnelId = 999;
      mockPrisma.funnelSettings.findUnique.mockResolvedValue({
        isPasswordProtected: false,
        passwordHash: null,
      });

      await verifyFunnelPassword({ funnelId: customFunnelId, password });

      expect(mockPrisma.funnelSettings.findUnique).toHaveBeenCalledWith({
        where: { funnelId: customFunnelId },
        select: expect.any(Object),
      });
    });
  });
});
