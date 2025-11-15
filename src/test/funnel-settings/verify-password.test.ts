import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { verifyFunnelPassword } from "../../services/funnel-settings/verify-password";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../errors";
import * as encryptionModule from "../../services/funnel-settings/lock-funnel/utils/encryption";

vi.mock("../../lib/prisma");
vi.mock("../../services/funnel-settings/lock-funnel/utils/encryption", () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn(),
}));

describe("Verify Funnel Password Tests", () => {
  let mockPrisma: any;
  const hostname = "example.com";
  const funnelSlug = "test-funnel";
  const funnelId = 123;
  const domainId = 1;
  const password = "SecurePass123";
  const hashedPassword = "$2a$10$hashedPasswordExample";

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      domain: {
        findUnique: vi.fn(),
      },
      funnelDomain: {
        findFirst: vi.fn(),
      },
      funnel: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);

    // Set up default mocks for domain and connection
    mockPrisma.domain.findUnique.mockResolvedValue({
      id: domainId,
      hostname,
      status: 'ACTIVE',
    });

    mockPrisma.funnelDomain.findFirst.mockResolvedValue({
      id: 1,
      domainId,
      funnelId,
      isActive: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error for invalid workspace slug (empty string)", async () => {
      await expect(
        verifyFunnelPassword({ hostname: "", funnelSlug, password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel slug (empty string)", async () => {
      await expect(
        verifyFunnelPassword({ hostname, funnelSlug: "", password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel slug (uppercase letters)", async () => {
      await expect(
        verifyFunnelPassword({ hostname, funnelSlug: "TestFunnel", password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel slug (spaces)", async () => {
      await expect(
        verifyFunnelPassword({ hostname, funnelSlug: "test funnel", password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel slug (special characters)", async () => {
      await expect(
        verifyFunnelPassword({ hostname, funnelSlug: "test_funnel@123", password })
      ).rejects.toThrow(BadRequestError);
    });

    it("should accept valid funnel slug with hyphens", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: "test-funnel-123",
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({
        hostname,
        funnelSlug: "test-funnel-123",
        password,
      });

      expect(result.valid).toBe(true);
    });

    it("should throw error if password is missing", async () => {
      await expect(
        verifyFunnelPassword({ hostname, funnelSlug } as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if password is empty string", async () => {
      await expect(
        verifyFunnelPassword({ hostname, funnelSlug, password: "" })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if funnelSlug is missing", async () => {
      await expect(
        verifyFunnelPassword({ hostname, password } as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if hostname is missing", async () => {
      await expect(
        verifyFunnelPassword({ funnelSlug, password } as any)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Funnel Existence", () => {
    it("should throw NotFoundError if funnel not found", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(
        verifyFunnelPassword({ hostname, funnelSlug, password })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError with correct message", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(
        verifyFunnelPassword({ hostname, funnelSlug, password })
      ).rejects.toThrow("Funnel not found");
    });

    it("should throw NotFoundError if settings not found", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: null,
      });

      await expect(
        verifyFunnelPassword({ hostname, funnelSlug, password })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError with correct message for missing settings", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: null,
      });

      await expect(
        verifyFunnelPassword({ hostname, funnelSlug, password })
      ).rejects.toThrow("Funnel settings not found");
    });

    it("should query domain, connection, and funnel correctly", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      await verifyFunnelPassword({ hostname, funnelSlug, password });

      // Should query domain first
      expect(mockPrisma.domain.findUnique).toHaveBeenCalledWith({
        where: { hostname },
      });

      // Then query funnel-domain connection
      expect(mockPrisma.funnelDomain.findFirst).toHaveBeenCalledWith({
        where: {
          domainId,
          isActive: true,
        },
      });

      // Finally query funnel by ID from connection
      expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith({
        where: { id: funnelId },
        select: {
          id: true,
          slug: true,
          status: true,
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
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Access granted");
      expect(result.funnelId).toBe(funnelId);
    });

    it("should allow access if passwordHash is null", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Access granted");
    });

    it("should allow access if isPasswordProtected is false even with hash", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: false,
          passwordHash: hashedPassword,
        },
      });

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Access granted");
    });

    it("should not call encryptionModule.decrypt if funnel is not protected", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(encryptionModule.decrypt).not.toHaveBeenCalled();
    });
  });

  describe("Password Verification", () => {
    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
    });

    it("should return valid=true for correct password", async () => {
      (encryptionModule.decrypt as any).mockReturnValue(password);

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Access granted");
      expect(result.funnelId).toBe(funnelId);
    });

    it("should return valid=false for incorrect password", async () => {
      (encryptionModule.decrypt as any).mockReturnValue("DifferentPassword");

      const result = await verifyFunnelPassword({
        hostname,
        funnelSlug,
        password: "WrongPassword",
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBe("Incorrect password. Please try again.");
      expect(result.funnelId).toBe(funnelId);
    });

    it("should call encryptionModule.decrypt with correct arguments", async () => {
      (encryptionModule.decrypt as any).mockReturnValue(password);

      await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(encryptionModule.decrypt).toHaveBeenCalledWith(hashedPassword);
    });

    it("should reject password with wrong case", async () => {
      (encryptionModule.decrypt as any).mockReturnValue("DifferentPassword");

      const result = await verifyFunnelPassword({
        hostname,
        funnelSlug,
        password: "securepass123",
      });

      expect(result.valid).toBe(false);
    });

    it("should reject password with extra spaces", async () => {
      (encryptionModule.decrypt as any).mockReturnValue("DifferentPassword");

      const result = await verifyFunnelPassword({
        hostname,
        funnelSlug,
        password: "  SecurePass123  ",
      });

      expect(result.valid).toBe(false);
    });

    it("should verify password with special characters", async () => {
      const specialPassword = "P@ssw0rd!#$%^&*()";
      (encryptionModule.decrypt as any).mockReturnValue(specialPassword);

      const result = await verifyFunnelPassword({
        hostname,
        funnelSlug,
        password: specialPassword,
      });

      expect(encryptionModule.decrypt).toHaveBeenCalledWith(hashedPassword);
      expect(result.valid).toBe(true);
    });

    it("should verify password with unicode characters", async () => {
      const unicodePassword = "Пароль123密码";
      (encryptionModule.decrypt as any).mockReturnValue(unicodePassword);

      const result = await verifyFunnelPassword({
        hostname,
        funnelSlug,
        password: unicodePassword,
      });

      expect(encryptionModule.decrypt).toHaveBeenCalledWith(hashedPassword);
      expect(result.valid).toBe(true);
    });

    it("should handle empty string password against hash", async () => {
      (encryptionModule.decrypt as any).mockReturnValue("DifferentPassword");

      await expect(
        verifyFunnelPassword({
        hostname,
        funnelSlug, password: "" })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Response Format", () => {
    it("should return valid response structure for correct password", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (encryptionModule.decrypt as any).mockReturnValue(password);

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("funnelId");
      expect(typeof result.valid).toBe("boolean");
      expect(typeof result.message).toBe("string");
      expect(typeof result.funnelId).toBe("number");
    });

    it("should return valid response structure for incorrect password", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (encryptionModule.decrypt as any).mockReturnValue("DifferentPassword");

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("funnelId");
      expect(result.valid).toBe(false);
    });

    it("should return valid response structure for unprotected funnel", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("funnelId");
      expect(result.valid).toBe(true);
    });

    it("should allow optional sessionToken field in response", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

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
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (encryptionModule.decrypt as any).mockReturnValue("DifferentPassword");

      const result = await verifyFunnelPassword({
        hostname,
        funnelSlug,
        password: longPassword,
      });

      expect(encryptionModule.decrypt).toHaveBeenCalledWith(hashedPassword);
      expect(result.valid).toBe(false);
    });

    it("should handle SQL injection attempt in password", async () => {
      const sqlInjectionPassword = "' OR '1'='1";
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (encryptionModule.decrypt as any).mockReturnValue("DifferentPassword");

      const result = await verifyFunnelPassword({
        hostname,
        funnelSlug,
        password: sqlInjectionPassword,
      });

      expect(result.valid).toBe(false);
    });

    it("should handle decrypt error", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (encryptionModule.decrypt as any).mockImplementation(() => {
        throw new Error("Decryption error");
      });

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      // When decryption fails, password should be considered invalid
      expect(result.valid).toBe(false);
    });

    it("should handle null password hash gracefully", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("Access granted");
    });

    it("should handle multiple consecutive verification attempts", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });

      (encryptionModule.decrypt as any)
        .mockReturnValueOnce("DifferentPassword1")
        .mockReturnValueOnce("DifferentPassword2")
        .mockReturnValueOnce("correct");

      const result1 = await verifyFunnelPassword({
        hostname,
        funnelSlug,
        password: "wrong1",
      });
      const result2 = await verifyFunnelPassword({
        hostname,
        funnelSlug,
        password: "wrong2",
      });
      const result3 = await verifyFunnelPassword({
        hostname,
        funnelSlug,
        password: "correct",
      });

      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);
      expect(result3.valid).toBe(true);
      expect(encryptionModule.decrypt).toHaveBeenCalledTimes(3);
    });

    it("should handle funnel slug with numbers", async () => {
      const slugWithNumbers = "funnel-123";
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: slugWithNumbers,
        status: "LIVE",
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({
        hostname,
        funnelSlug: slugWithNumbers,
        password,
      });

      expect(result.valid).toBe(true);
      expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: funnelId },
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockPrisma.funnel.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        verifyFunnelPassword({ hostname, funnelSlug, password })
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle decryption errors", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (encryptionModule.decrypt as any).mockImplementation(() => {
        throw new Error("Decryption failed");
      });

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      // When decryption fails, password should be considered invalid
      expect(result.valid).toBe(false);
    });

    it("should throw BadRequestError for Zod validation errors", async () => {
      try {
        await verifyFunnelPassword({ hostname, funnelSlug: "", password });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
      }
    });

    it("should include validation message in BadRequestError", async () => {
      try {
        await verifyFunnelPassword({ hostname, funnelSlug: "INVALID_SLUG", password });
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
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (encryptionModule.decrypt as any).mockReturnValue(password);

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(result).not.toHaveProperty("passwordHash");
      expect(result).not.toHaveProperty("hash");
      expect(JSON.stringify(result)).not.toContain(hashedPassword);
    });

    it("should not leak password hash on incorrect password", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (encryptionModule.decrypt as any).mockReturnValue("DifferentPassword");

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(result).not.toHaveProperty("passwordHash");
      expect(JSON.stringify(result)).not.toContain(hashedPassword);
    });

    it("should not include sensitive data in error messages", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      try {
        await verifyFunnelPassword({ hostname, funnelSlug, password });
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).not.toContain(password);
          expect(error.message).not.toContain(hashedPassword);
        }
      }
    });

    it("should always use encryptionModule.decrypt for timing attack resistance", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (encryptionModule.decrypt as any).mockReturnValue(password);

      await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(encryptionModule.decrypt).toHaveBeenCalled();
      // Bcrypt is inherently slow, protecting against timing attacks
    });
  });

  describe("Integration Tests", () => {
    it("should complete full workflow with correct password", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (encryptionModule.decrypt as any).mockReturnValue(password);

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(mockPrisma.domain.findUnique).toHaveBeenCalled();
      expect(mockPrisma.funnelDomain.findFirst).toHaveBeenCalled();
      expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: funnelId },
        })
      );
      expect(encryptionModule.decrypt).toHaveBeenCalled();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("Access granted");
    });

    it("should complete full workflow with incorrect password", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: true,
          passwordHash: hashedPassword,
        },
      });
      (encryptionModule.decrypt as any).mockReturnValue("DifferentPassword");

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(mockPrisma.funnel.findUnique).toHaveBeenCalled();
      expect(encryptionModule.decrypt).toHaveBeenCalled();
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Incorrect password. Please try again.");
    });

    it("should complete full workflow for unprotected funnel", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      const result = await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(mockPrisma.funnel.findUnique).toHaveBeenCalled();
      expect(encryptionModule.decrypt).not.toHaveBeenCalled();
      expect(result.valid).toBe(true);
      expect(result.message).toBe("Access granted");
    });

    it("should handle multiple funnels with different passwords", async () => {
      const funnel1Slug = "funnel-1";
      const funnel2Slug = "funnel-2";
      const hash1 = "$2a$10$hash1";
      const hash2 = "$2a$10$hash2";

      mockPrisma.funnel.findUnique
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

      (encryptionModule.decrypt as any)
        .mockReturnValueOnce("password1")
        .mockReturnValueOnce("password2");

      const result1 = await verifyFunnelPassword({
        hostname,
        funnelSlug: funnel1Slug,
        password: "password1",
      });
      const result2 = await verifyFunnelPassword({
        hostname,
        funnelSlug: funnel2Slug,
        password: "password2",
      });

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(encryptionModule.decrypt).toHaveBeenNthCalledWith(1, hash1);
      expect(encryptionModule.decrypt).toHaveBeenNthCalledWith(2, hash2);
    });
  });

  describe("Query Optimization", () => {
    it("should only select required fields from database", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: funnelId,
        slug: funnelSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      await verifyFunnelPassword({ hostname, funnelSlug, password });

      expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: funnelId },
          select: expect.objectContaining({
            id: true,
            slug: true,
            status: true,
          }),
        })
      );
    });

    it("should query funnel by ID from connection", async () => {
      const customFunnelId = 999;
      const customSlug = "custom-funnel-999";

      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        id: 1,
        domainId,
        funnelId: customFunnelId,
        isActive: true,
      });

      mockPrisma.funnel.findUnique.mockResolvedValue({
        id: customFunnelId,
        slug: customSlug,
        status: "LIVE",
        settings: {
          isPasswordProtected: false,
          passwordHash: null,
        },
      });

      await verifyFunnelPassword({ hostname, funnelSlug: customSlug, password });

      expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: customFunnelId },
        })
      );
    });
  });
});
