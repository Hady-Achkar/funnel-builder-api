import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterService } from "../service/register.service";
import { getPrisma } from "../../../lib/prisma";

// Mock dependencies
vi.mock("../../../lib/prisma");
vi.mock("bcryptjs");
vi.mock("jsonwebtoken");

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  workspace: {
    create: vi.fn(),
  },
  workspaceMember: {
    create: vi.fn(),
  },
  imageFolder: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe("RegisterService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getPrisma as any).mockReturnValue(mockPrisma);
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    const validUserData = {
      email: "test@example.com",
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      password: "password123",
      isAdmin: false,
    };

    it("should successfully register a new user", async () => {
      // Arrange
      const hashedPassword = "hashed-password";
      const token = "jwt-token";
      const createdUser = {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        isAdmin: false,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: vi.fn().mockResolvedValue(createdUser),
          },
          workspace: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Personal Workspace" }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          imageFolder: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Default Folder", userId: 1 }),
          },
        });
      });
      (jwt.sign as any).mockReturnValue(token);

      // Act
      const result = await RegisterService.register(validUserData);

      // Assert
      expect(result).toEqual({
        message: "User created successfully",
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

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 1 }, "test-secret", { expiresIn: "180d" });
    });

    it("should throw error if email already exists", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 1 }); // Existing user

      // Act & Assert
      await expect(RegisterService.register(validUserData)).rejects.toThrow(
        "User with this email already exists"
      );
    });

    it("should throw error if username already exists", async () => {
      // Arrange
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // No user with email
        .mockResolvedValueOnce({ id: 1 }); // Existing user with username

      // Act & Assert
      await expect(RegisterService.register(validUserData)).rejects.toThrow(
        "Username is already taken"
      );
    });

    it("should throw error for invalid email", async () => {
      // Arrange
      const invalidData = {
        ...validUserData,
        email: "invalid-email",
      };

      // Act & Assert
      await expect(RegisterService.register(invalidData)).rejects.toThrow();
    });

    it("should throw error for short password", async () => {
      // Arrange
      const invalidData = {
        ...validUserData,
        password: "123",
      };

      // Act & Assert
      await expect(RegisterService.register(invalidData)).rejects.toThrow();
    });

    it("should throw error for invalid username format", async () => {
      // Arrange
      const invalidData = {
        ...validUserData,
        username: "invalid-username!",
      };

      // Act & Assert
      await expect(RegisterService.register(invalidData)).rejects.toThrow();
    });

    it("should throw error if JWT secret is not configured", async () => {
      // Arrange
      delete process.env.JWT_SECRET;
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue("hashed-password");
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          workspace: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({}),
          },
          imageFolder: {
            create: vi.fn().mockResolvedValue({ id: 1, name: "Default Folder", userId: 1 }),
          },
        });
      });

      // Act & Assert
      await expect(RegisterService.register(validUserData)).rejects.toThrow(
        "JWT secret not configured"
      );
    });

    it("should create workspace and workspace member for new user", async () => {
      // Arrange
      const createdUser = { id: 1, username: "testuser" };
      const createdWorkspace = { id: 1, name: "Personal Workspace" };
      
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue("hashed-password");
      
      const mockTx = {
        user: {
          create: vi.fn().mockResolvedValue(createdUser),
        },
        workspace: {
          create: vi.fn().mockResolvedValue(createdWorkspace),
        },
        workspaceMember: {
          create: vi.fn().mockResolvedValue({}),
        },
        imageFolder: {
          create: vi.fn().mockResolvedValue({ id: 1, name: "Default Folder", userId: 1 }),
        },
      };
      
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });
      
      (jwt.sign as any).mockReturnValue("token");

      // Act
      await RegisterService.register(validUserData);

      // Assert
      expect(mockTx.workspace.create).toHaveBeenCalledWith({
        data: {
          name: "Personal Workspace",
          slug: "testuser-personal",
          ownerId: 1,
          description: "Your personal workspace for creating funnels",
          allocatedFunnels: 10,
          allocatedCustomDomains: 2,
          allocatedSubdomains: 5,
        },
      });

      expect(mockTx.workspaceMember.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          workspaceId: 1,
          role: "OWNER",
          permissions: [
            "MANAGE_WORKSPACE",
            "MANAGE_MEMBERS",
            "CREATE_FUNNELS",
            "EDIT_FUNNELS",
            "EDIT_PAGES",
            "DELETE_FUNNELS",
            "VIEW_ANALYTICS",
            "MANAGE_DOMAINS",
            "CREATE_DOMAINS",
            "EDIT_DOMAINS",
            "DELETE_DOMAINS",
            "CONNECT_DOMAINS",
          ],
        },
      });

      expect(mockTx.imageFolder.create).toHaveBeenCalledWith({
        data: {
          name: "Default Folder",
          userId: 1,
        },
      });
    });
  });
});