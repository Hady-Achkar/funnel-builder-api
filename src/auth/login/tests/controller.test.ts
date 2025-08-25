import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { LoginController } from "../controller/login.controller";
import { LoginService } from "../service/login.service";

// Mock the LoginService
vi.mock("../service/login.service");

describe("LoginController", () => {
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

  describe("login", () => {
    it("should successfully login a user and return 200 status", async () => {
      // Arrange
      const requestBody = {
        identifier: "test@example.com",
        password: "password123",
      };

      const serviceResponse = {
        message: "Login successful",
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
      (LoginService.login as any).mockResolvedValue(serviceResponse);

      // Act
      await LoginController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(LoginService.login).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error when service throws an error", async () => {
      // Arrange
      const requestBody = {
        identifier: "test@example.com",
        password: "wrongpassword",
      };

      const error = new Error("Invalid credentials");
      mockRequest.body = requestBody;
      (LoginService.login as any).mockRejectedValue(error);

      // Act
      await LoginController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(LoginService.login).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle validation errors from service", async () => {
      // Arrange
      const requestBody = {
        identifier: "",
        password: "password123",
      };

      const validationError = new Error("Invalid input: Identifier is required");
      mockRequest.body = requestBody;
      (LoginService.login as any).mockRejectedValue(validationError);

      // Act
      await LoginController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(LoginService.login).toHaveBeenCalledWith(requestBody);
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle empty request body", async () => {
      // Arrange
      mockRequest.body = {};
      const validationError = new Error("Invalid input: Identifier is required");
      (LoginService.login as any).mockRejectedValue(validationError);

      // Act
      await LoginController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(LoginService.login).toHaveBeenCalledWith({});
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle missing required fields", async () => {
      // Arrange
      const incompleteBody = {
        identifier: "test@example.com",
        // Missing password
      };

      mockRequest.body = incompleteBody;
      const validationError = new Error("Invalid input: Password is required");
      (LoginService.login as any).mockRejectedValue(validationError);

      // Act
      await LoginController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(LoginService.login).toHaveBeenCalledWith(incompleteBody);
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle login with username identifier", async () => {
      // Arrange
      const requestBody = {
        identifier: "testuser",
        password: "password123",
      };

      const serviceResponse = {
        message: "Login successful",
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
      (LoginService.login as any).mockResolvedValue(serviceResponse);

      // Act
      await LoginController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(LoginService.login).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle admin user login", async () => {
      // Arrange
      const requestBody = {
        identifier: "admin@example.com",
        password: "adminpassword",
      };

      const serviceResponse = {
        message: "Login successful",
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
      (LoginService.login as any).mockResolvedValue(serviceResponse);

      // Act
      await LoginController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(LoginService.login).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle service throwing non-validation errors", async () => {
      // Arrange
      const requestBody = {
        identifier: "test@example.com",
        password: "password123",
      };

      const serviceError = new Error("Database connection failed");
      mockRequest.body = requestBody;
      (LoginService.login as any).mockRejectedValue(serviceError);

      // Act
      await LoginController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(LoginService.login).toHaveBeenCalledWith(requestBody);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("should handle invalid data types in request body", async () => {
      // Arrange
      const requestBody = {
        identifier: 123, // Should be string
        password: true, // Should be string
      };

      mockRequest.body = requestBody;
      const validationError = new Error("Invalid input: Identifier must be a string");
      (LoginService.login as any).mockRejectedValue(validationError);

      // Act
      await LoginController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(LoginService.login).toHaveBeenCalledWith(requestBody);
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should pass through request body exactly as received", async () => {
      // Arrange
      const requestBody = {
        identifier: "test@example.com",
        password: "password123",
        extraField: "should be ignored by service",
      };

      const serviceResponse = {
        message: "Login successful",
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
      (LoginService.login as any).mockResolvedValue(serviceResponse);

      // Act
      await LoginController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(LoginService.login).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
    });
  });
});