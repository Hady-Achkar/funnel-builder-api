import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { verifyFunnelPassword } from "../../services/funnel-settings/verify-password";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../errors";
import bcrypt from "bcryptjs";

vi.mock("../../lib/prisma");
vi.mock("bcryptjs");

describe("Verify Funnel Password Tests", () => {
  let mockPrisma: any;
  const funnelSlug = "test-funnel";
  const funnelId = 123;
  const password = "SecurePass123";
  const hashedPassword = "$2a$10$hashedPasswordExample";

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findFirst: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error for invalid funnel slug (empty string)", async () => {
      await expect(
        verifyFunnelPassword({ funnelSlug: "", password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel slug (uppercase letters)", async () => {
      await expect(
        verifyFunnelPassword({ funnelSlug: "TestFunnel", password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel slug (spaces)", async () => {
      await expect(
        verifyFunnelPassword({ funnelSlug: "test funnel", password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel slug (special characters)", async () => {
      await expect(
        verifyFunnelPassword({ funnelSlug: "test_funnel@123", password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should accept valid funnel slug with hyphens", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: "test-funnel-123",
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({
        funnelSlug: "test-funnel-123",
        password,
      });

      expect(result.valid).toBe(true);
    });

    it("should throw error if password is missing", async () => {
      await expect(
        verifyFunnelPassword({ funnelSlug } as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if password is empty string", async () => {
      await expect(
        verifyFunnelPassword({ funnelSlug, password: "" })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if funnelSlug is missing", async () => {
      await expect(
        verifyFunnelPassword({ password } as any)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Funnel Existence", () => {
    it("should throw NotFoundError if funnel not found", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await expect(
        verifyFunnelPassword({ funnelSlug, password })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError with correct message", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      await expect(
        verifyFunnelPassword({ funnelSlug, password })
      ).rejects.toThrow("Funnel not found");
    });

    it("should throw NotFoundError if settings not found", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: null,
      });

      await expect(
        verifyFunnelPassword({ funnelSlug, password })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError with correct message for missing settings", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: null,
      });

      await expect(
        verifyFunnelPassword({ funnelSlug, password })
      ).rejects.toThrow("Funnel settings not found");
    });

    it("should query funnel by slug", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      await verifyFunnelPassword({ funnelSlug, password });

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: { slug: funnelSlug },
        select: {
          id: true,
          slug: true,
          settings: {
            select: {
              isPasswordProtected: true,
              passwordHash: true,
            },
          },
        },
      });
    });
  });

  describe("Password Protection Status", () => {
    it("should allow access if funnel is not password protected", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Funnel is not password protected");
      expect(result.funnelId).toBe(funnelId);
    });

    it("should allow access if passwordHash is null", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Funnel is not password protected");
    });

    it("should allow access if isPasswordProtected is false even with hash", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: false,
          passwordHash: hashedPassword,
        },
      });

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Funnel is not password protected");
    });

    it("should not call bcrypt.compare if funnel is not protected", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      await verifyFunnelPassword({ funnelSlug, password });

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe("Password Verification", () => {
    beforeEach(() => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
    });

    it("should return valid=true for correct password", async () => {
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Password is correct");
      expect(result.funnelId).toBe(funnelId);
    });

    it("should return valid=false for incorrect password", async () => {
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({
        funnelSlug,
        password: "WrongPassword",
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBe("Invalid password");
      expect(result.funnelId).toBe(funnelId);
    });

    it("should call bcrypt.compare with correct arguments", async () => {
      (bcrypt.compare as any).mockResolvedValue(true);

      await verifyFunnelPassword({ funnelSlug, password });

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it("should reject password with wrong case", async () => {
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({
        funnelSlug,
        password: "securepass123",
      });

      expect(result.valid).toBe(false);
    });

    it("should reject password with extra spaces", async () => {
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({
        funnelSlug,
        password: "  SecurePass123  ",
      });

      expect(result.valid).toBe(false);
    });

    it("should verify password with special characters", async () => {
      const specialPassword = "P@ssw0rd!#$%^&*()";
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyFunnelPassword({
        funnelSlug,
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
        funnelSlug,
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
        verifyFunnelPassword({ funnelSlug, password: "" })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Response Format", () => {
    it("should return valid response structure for correct password", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("funnelId");
      expect(typeof result.valid).toBe("boolean");
      expect(typeof result.message).toBe("string");
      expect(typeof result.funnelId).toBe("number");
    });

    it("should return valid response structure for incorrect password", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("funnelId");
      expect(result.valid).toBe(false);
    });

    it("should return valid response structure for unprotected funnel", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("funnelId");
      expect(result.valid).toBe(true);
    });

    it("should allow optional sessionToken field in response", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ funnelSlug, password });

      // sessionToken is optional, so it may or may not be present
      expect(
        result.sessionToken === undefined ||
          typeof result.sessionToken === "string"
      ).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long password", async () => {
      const longPassword = "A".repeat(500);
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({
        funnelSlug,
        password: longPassword,
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(longPassword, hashedPassword);
      expect(result.valid).toBe(false);
    });

    it("should handle SQL injection attempt in password", async () => {
      const sqlInjectionPassword = "' OR '1'='1";
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({
        funnelSlug,
        password: sqlInjectionPassword,
      });

      expect(result.valid).toBe(false);
    });

    it("should handle bcrypt compare error", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (bcrypt.compare as any).mockRejectedValue(new Error("Bcrypt error"));

      await expect(
        verifyFunnelPassword({ funnelSlug, password })
      ).rejects.toThrow("Bcrypt error");
    });

    it("should handle null password hash gracefully", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Funnel is not password protected");
    });

    it("should handle multiple consecutive verification attempts", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });

      (bcrypt.compare as any)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result1 = await verifyFunnelPassword({
        funnelSlug,
        password: "wrong1",
      });
      const result2 = await verifyFunnelPassword({
        funnelSlug,
        password: "wrong2",
      });
      const result3 = await verifyFunnelPassword({
        funnelSlug,
        password: "correct",
      });

      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);
      expect(result3.valid).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledTimes(3);
    });

    it("should handle funnel slug with numbers", async () => {
      const slugWithNumbers = "funnel-123";
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: slugWithNumbers,
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({
        funnelSlug: slugWithNumbers,
        password,
      });

      expect(result.valid).toBe(true);
      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: { slug: slugWithNumbers },
        select: expect.any(Object),
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockPrisma.funnel.findFirst.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        verifyFunnelPassword({ funnelSlug, password })
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle bcrypt errors", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (bcrypt.compare as any).mockRejectedValue(new Error("Bcrypt failed"));

      await expect(
        verifyFunnelPassword({ funnelSlug, password })
      ).rejects.toThrow("Bcrypt failed");
    });

    it("should throw BadRequestError for Zod validation errors", async () => {
      try {
        await verifyFunnelPassword({ funnelSlug: "", password });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
      }
    });

    it("should include validation message in BadRequestError", async () => {
      try {
        await verifyFunnelPassword({ funnelSlug: "INVALID_SLUG", password });
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
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(result).not.toHaveProperty("passwordHash");
      expect(result).not.toHaveProperty("hash");
      expect(JSON.stringify(result)).not.toContain(hashedPassword);
    });

    it("should not leak password hash on incorrect password", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(result).not.toHaveProperty("passwordHash");
      expect(JSON.stringify(result)).not.toContain(hashedPassword);
    });

    it("should not include sensitive data in error messages", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      try {
        await verifyFunnelPassword({ funnelSlug, password });
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).not.toContain(password);
          expect(error.message).not.toContain(hashedPassword);
        }
      }
    });

    it("should always use bcrypt.compare for timing attack resistance", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      await verifyFunnelPassword({ funnelSlug, password });

      expect(bcrypt.compare).toHaveBeenCalled();
      // Bcrypt is inherently slow, protecting against timing attacks
    });
  });

  describe("Integration Tests", () => {
    it("should complete full workflow with correct password", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: { slug: funnelSlug },
        select: {
          id: true,
          slug: true,
          settings: {
            select: {
              isPasswordProtected: true,
              passwordHash: true,
            },
          },
        },
      });
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("Password is correct");
    });

    it("should complete full workflow with incorrect password", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Invalid password");
    });

    it("should complete full workflow for unprotected funnel", async () => {
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ funnelSlug, password });

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("Funnel is not password protected");
    });

    it("should handle multiple funnels with different passwords", async () => {
      const funnel1Slug = "funnel-1";
      const funnel2Slug = "funnel-2";
      const hash1 = "$2a$10$hash1";
      const hash2 = "$2a$10$hash2";

      mockPrisma.funnel.findFirst
        .mockResolvedValueOnce({
          id: 1,
          slug: funnel1Slug,
          settings: {
            isPasswordProtected: true,
            passwordHash: hash1,
          },
        })
        .mockResolvedValueOnce({
          id: 2,
          slug: funnel2Slug,
          settings: {
            isPasswordProtected: true,
            passwordHash: hash2,
          },
        });

      (bcrypt.compare as any).mockResolvedValue(true);

      const result1 = await verifyFunnelPassword({
        funnelSlug: funnel1Slug,
        password: "password1",
      });
      const result2 = await verifyFunnelPassword({
        funnelSlug: funnel2Slug,
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
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      await verifyFunnelPassword({ funnelSlug, password });

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: { slug: funnelSlug },
        select: {
          id: true,
          slug: true,
          settings: {
            select: {
              isPasswordProtected: true,
              passwordHash: true,
            },
          },
        },
      });
    });

    it("should use correct funnel slug in query", async () => {
      const customSlug = "custom-funnel-999";
      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: 999,
        slug: customSlug,
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      await verifyFunnelPassword({ funnelSlug: customSlug, password });

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: { slug: customSlug },
        select: expect.any(Object),
      });
    });
  });
});
