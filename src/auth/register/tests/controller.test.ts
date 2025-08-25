import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { RegisterController } from "../controller/register.controller";
import { RegisterService } from "../service/register.service";

// Mock the RegisterService
vi.mock("../service/register.service");

describe("RegisterController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should successfully register a user and return 201 status", async () => {
      // Arrange
      const requestBody = {
        email: "test@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        password: "password123",
        isAdmin: false,
      };

      const serviceResponse = {
        message: "User created successfully",
        token: "jwt-token",
        user: {
          id: 1,
          email: "test@example.com",
          username: "testuser",
          firstName: "Test",
          lastName: "User",
          isAdmin: false,
        },
      };

      mockRequest.body = requestBody;
      (RegisterService.register as any).mockResolvedValue(serviceResponse);

      // Act
      await RegisterController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(RegisterService.register).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error when service throws an error", async () => {
      // Arrange
      const requestBody = {
        email: "test@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        password: "password123",
        isAdmin: false,
      };

      const error = new Error("User with this email already exists");
      mockRequest.body = requestBody;
      (RegisterService.register as any).mockRejectedValue(error);

      // Act
      await RegisterController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(RegisterService.register).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle validation errors from service", async () => {
      // Arrange
      const requestBody = {
        email: "invalid-email",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        password: "123", // Too short
        isAdmin: false,
      };

      const validationError = new Error("Password must be at least 6 characters long");
      mockRequest.body = requestBody;
      (RegisterService.register as any).mockRejectedValue(validationError);

      // Act
      await RegisterController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(RegisterService.register).toHaveBeenCalledWith(requestBody);
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle empty request body", async () => {
      // Arrange
      mockRequest.body = {};
      const validationError = new Error("Email must be a string");
      (RegisterService.register as any).mockRejectedValue(validationError);

      // Act
      await RegisterController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(RegisterService.register).toHaveBeenCalledWith({});
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle missing required fields", async () => {
      // Arrange
      const incompleteBody = {
        email: "test@example.com",
        // Missing username, firstName, lastName, password
      };

      mockRequest.body = incompleteBody;
      const validationError = new Error("Username must be a string");
      (RegisterService.register as any).mockRejectedValue(validationError);

      // Act
      await RegisterController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(RegisterService.register).toHaveBeenCalledWith(incompleteBody);
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle service returning successful response with admin user", async () => {
      // Arrange
      const requestBody = {
        email: "admin@example.com",
        username: "adminuser",
        firstName: "Admin",
        lastName: "User",
        password: "adminpassword123",
        isAdmin: true,
      };

      const serviceResponse = {
        message: "User created successfully",
        token: "jwt-token",
        user: {
          id: 1,
          email: "admin@example.com",
          username: "adminuser",
          firstName: "Admin",
          lastName: "User",
          isAdmin: true,
        },
      };

      mockRequest.body = requestBody;
      (RegisterService.register as any).mockResolvedValue(serviceResponse);

      // Act
      await RegisterController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(RegisterService.register).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});