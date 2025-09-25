import { describe, it, expect, beforeEach, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { RegisterController } from "../../controllers/auth/register";
import { User, WorkspaceRole, WorkspacePermission } from "../../generated/prisma-client";

describe("Register Controller Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  describe("Input Validation Errors", () => {
    it("should reject missing email", async () => {
      mockReq.body = {
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Email must be a string" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject invalid email format", async () => {
      mockReq.body = {
        email: "invalid-email",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Please provide a valid email address" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject missing username", async () => {
      mockReq.body = {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Username must be a string" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject short password", async () => {
      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("at least") })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject missing firstName", async () => {
      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        lastName: "Doe",
        password: "password123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "First name must be a string" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject missing lastName", async () => {
      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        password: "password123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Last name must be a string" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("Business Rule Violations", () => {
    it("should reject existing email", async () => {
      const { RegisterService } = await import("../../services/auth/register");

      const serviceSpy = vi.spyOn(RegisterService, 'register').mockRejectedValue(
        new Error("User with this email already exists")
      );

      mockReq.body = {
        email: "existing@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User with this email already exists" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });

    it("should reject existing username", async () => {
      const { RegisterService } = await import("../../services/auth/register");

      const serviceSpy = vi.spyOn(RegisterService, 'register').mockRejectedValue(
        new Error("Username is already taken")
      );

      mockReq.body = {
        email: "test@example.com",
        username: "existinguser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Username is already taken" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });
  });

  describe("Successful Registration", () => {
    it("should register user successfully without invitation", async () => {
      const { RegisterService } = await import("../../services/auth/register");

      const mockResponse = {
        message: "User created successfully. Please check your email to verify your account.",
        user: {
          id: 1,
          email: "test@example.com",
          username: "testuser",
          firstName: "John",
          lastName: "Doe",
          isAdmin: false,
          plan: "FREE",
          verified: false,
        } as Pick<User, "id" | "email" | "username" | "firstName" | "lastName" | "isAdmin" | "plan" | "verified">,
        workspace: undefined,
      };

      const serviceSpy = vi.spyOn(RegisterService, 'register').mockResolvedValue(mockResponse);

      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
        plan: "FREE",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
      expect(mockNext).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });

    it("should register user successfully with workspace invitation", async () => {
      const { RegisterService } = await import("../../services/auth/register");

      const mockResponse = {
        message: "User created successfully and added to workspace Test Workspace. Please check your email to verify your account.",
        user: {
          id: 1,
          email: "test@example.com",
          username: "testuser",
          firstName: "John",
          lastName: "Doe",
          isAdmin: false,
          plan: "FREE",
          verified: false,
        } as Pick<User, "id" | "email" | "username" | "firstName" | "lastName" | "isAdmin" | "plan" | "verified">,
        workspace: {
          id: 1,
          name: "Test Workspace",
          slug: "test-workspace",
          role: "EDITOR" as WorkspaceRole,
          permissions: ["EDIT_FUNNELS", "EDIT_PAGES"] as WorkspacePermission[],
        },
      };

      const serviceSpy = vi.spyOn(RegisterService, 'register').mockResolvedValue(mockResponse);

      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
        plan: "FREE",
        invitationToken: "valid-invitation-token",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
      expect(mockNext).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });
  });

  describe("Invitation Token Errors", () => {
    it("should continue registration even if invitation token is invalid", async () => {
      const { RegisterService } = await import("../../services/auth/register");

      const mockResponse = {
        message: "User created successfully. Please check your email to verify your account.",
        user: {
          id: 1,
          email: "test@example.com",
          username: "testuser",
          firstName: "John",
          lastName: "Doe",
          isAdmin: false,
          plan: "FREE",
          verified: false,
        } as Pick<User, "id" | "email" | "username" | "firstName" | "lastName" | "isAdmin" | "plan" | "verified">,
        workspace: undefined,
      };

      const serviceSpy = vi.spyOn(RegisterService, 'register').mockResolvedValue(mockResponse);

      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
        plan: "FREE",
        invitationToken: "invalid-token",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
      expect(mockNext).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });
  });
});