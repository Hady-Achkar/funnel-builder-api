import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "../../services/auth.service";
import { testPrisma, testFactory } from "../setup";
import { TestHelpers } from "../helpers";
import bcrypt from "bcryptjs";

describe("AuthService", () => {
  // Prisma client is already injected in setup.ts

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const timestamp = Date.now();
      const userData = {
        email: `auth-test-${timestamp}@example.com`,
        name: "Auth Test User",
        password: "password123",
      };

      const result = await AuthService.register(userData);

      expect(result).toHaveProperty("message", "User created successfully");
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user).not.toHaveProperty("password");

      // Verify user exists in database
      const dbUser = await testPrisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(dbUser).toBeTruthy();
      expect(dbUser!.email).toBe(userData.email);

      // Verify password is hashed
      const isPasswordValid = await bcrypt.compare(
        userData.password,
        dbUser!.password
      );
      expect(isPasswordValid).toBe(true);
    });

    it("should throw error if user already exists", async () => {
      // Use test factory to create existing user
      const existingUser = await testFactory.createUser({
        email: "existing@example.com"
      });
      
      const userData = {
        email: existingUser.email,
        name: "Duplicate User",
        password: "password123",
      };

      // Try to register with an already existing email
      await expect(AuthService.register(userData)).rejects.toThrow(
        "User already exists"
      );
    });

    it("should register user without name", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await AuthService.register(userData);

      expect(result.user.name).toBeNull();
    });
  });

  describe("login", () => {
    it("should login user with correct credentials", async () => {
      const userData = {
        email: "test@example.com",
        name: "Test User",
        password: "password123",
      };

      // Register user first
      await AuthService.register(userData);

      // Login
      const result = await AuthService.login({
        email: userData.email,
        password: userData.password,
      });

      expect(result).toHaveProperty("message", "Login successful");
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user.email).toBe(userData.email);
      expect(result.user).not.toHaveProperty("password");
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        AuthService.login({
          email: "nonexistent@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw error for incorrect password", async () => {
      const timestamp = Date.now();
      const userData = {
        email: `test${timestamp}@example.com`,
        name: "Test User",
        password: "password123",
      };

      // Register user first
      await AuthService.register(userData);

      // Try to login with wrong password
      await expect(
        AuthService.login({
          email: userData.email,
          password: "wrongpassword",
        })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("generateToken", () => {
    it("should throw error if JWT_SECRET is not configured", async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const timestamp = Date.now();
      const userData = {
        email: `test${timestamp}@example.com`,
        password: "password123",
      };

      await expect(AuthService.register(userData)).rejects.toThrow(
        "JWT secret not configured"
      );

      // Restore original secret
      process.env.JWT_SECRET = originalSecret;
    });
  });
});
