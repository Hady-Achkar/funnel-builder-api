import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { LoginService } from "../service/login.service";
import { getPrisma } from "../../../lib/prisma";

// Mock dependencies
vi.mock("../../../lib/prisma");
vi.mock("bcryptjs");
vi.mock("jsonwebtoken");

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
};

describe("LoginService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getPrisma as any).mockReturnValue(mockPrisma);
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    const validLoginData = {
      identifier: "test@example.com",
      password: "password123",
    };

    const mockUser = {
      id: 1,
      email: "test@example.com",
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      password: "hashed-password",
      isAdmin: false,
    };

    it("should successfully login with email", async () => {
      // Arrange
      const token = "jwt-token";

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue(token);

      // Act
      const result = await LoginService.login(validLoginData);

      // Assert
      expect(result).toEqual({
        message: "Login successful",
        token,
        user: {
          id: 1,
          email: "test@example.com",
          username: "testuser",
          firstName: "Test",
          lastName: "User",
          isAdmin: false,
        },
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          password: true,
          isAdmin: true,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed-password");
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 1 }, "test-secret", { expiresIn: "180d" });
    });

    it("should successfully login with username", async () => {
      // Arrange
      const loginWithUsername = {
        identifier: "testuser",
        password: "password123",
      };
      const token = "jwt-token";

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue(token);

      // Act
      const result = await LoginService.login(loginWithUsername);

      // Assert
      expect(result).toEqual({
        message: "Login successful",
        token,
        user: {
          id: 1,
          email: "test@example.com",
          username: "testuser",
          firstName: "Test",
          lastName: "User",
          isAdmin: false,
        },
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: "testuser" },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          password: true,
          isAdmin: true,
        },
      });
    });

    it("should throw error for non-existent user", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(LoginService.login(validLoginData)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should throw error for incorrect password", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      // Act & Assert
      await expect(LoginService.login(validLoginData)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should throw error for invalid identifier", async () => {
      // Arrange
      const invalidData = {
        identifier: "",
        password: "password123",
      };

      // Act & Assert
      await expect(LoginService.login(invalidData)).rejects.toThrow(
        "Invalid input:"
      );
    });

    it("should throw error for missing password", async () => {
      // Arrange
      const invalidData = {
        identifier: "test@example.com",
        password: "",
      };

      // Act & Assert
      await expect(LoginService.login(invalidData)).rejects.toThrow(
        "Invalid input:"
      );
    });

    it("should throw error for invalid data type", async () => {
      // Arrange
      const invalidData = {
        identifier: 123, // Should be string
        password: "password123",
      };

      // Act & Assert
      await expect(LoginService.login(invalidData)).rejects.toThrow(
        "Invalid input:"
      );
    });

    it("should throw error if JWT secret is not configured", async () => {
      // Arrange
      delete process.env.JWT_SECRET;
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      // Act & Assert
      await expect(LoginService.login(validLoginData)).rejects.toThrow(
        "JWT secret not configured"
      );
    });

    it("should handle admin user login", async () => {
      // Arrange
      const adminUser = { ...mockUser, isAdmin: true };
      const token = "jwt-token";

      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue(token);

      // Act
      const result = await LoginService.login(validLoginData);

      // Assert
      expect(result.user.isAdmin).toBe(true);
    });

    it("should handle user with null isAdmin field", async () => {
      // Arrange
      const userWithNullAdmin = { ...mockUser, isAdmin: null };
      const token = "jwt-token";

      mockPrisma.user.findUnique.mockResolvedValue(userWithNullAdmin);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue(token);

      // Act
      const result = await LoginService.login(validLoginData);

      // Assert
      expect(result.user.isAdmin).toBe(false);
    });

    it("should correctly identify email vs username", async () => {
      // Arrange
      const emailIdentifier = { identifier: "user@domain.com", password: "pass" };
      const usernameIdentifier = { identifier: "username123", password: "pass" };
      const token = "jwt-token";

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue(token);

      // Act
      await LoginService.login(emailIdentifier);
      await LoginService.login(usernameIdentifier);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { email: "user@domain.com" },
        select: expect.any(Object),
      });
      expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { username: "username123" },
        select: expect.any(Object),
      });
    });

    it("should handle missing identifier field", async () => {
      // Arrange
      const invalidData = {
        password: "password123",
      };

      // Act & Assert
      await expect(LoginService.login(invalidData)).rejects.toThrow(
        "Invalid input:"
      );
    });

    it("should handle completely invalid request body", async () => {
      // Arrange
      const invalidData = {};

      // Act & Assert
      await expect(LoginService.login(invalidData)).rejects.toThrow(
        "Invalid input:"
      );
    });
  });
});