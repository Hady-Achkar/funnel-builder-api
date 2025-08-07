import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { AuthController } from "../../controllers/auth.controller";
import { AuthService } from "../../services/auth.service";

// Mock AuthService
vi.mock("../../services/auth.service");

const app = express();
app.use(express.json());
app.post("/auth/register", AuthController.register);
app.post("/auth/login", AuthController.login);

describe("AuthController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should register user successfully", async () => {
      const userData = {
        email: "test@example.com",
        name: "Test User",
        password: "password123",
      };

      const mockResponse = {
        message: "User created successfully",
        token: "mock-jwt-token",
        user: {
          id: 1,
          email: userData.email,
          name: userData.name,
        },
      };

      vi.mocked(AuthService.register).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(AuthService.register).toHaveBeenCalledWith(userData);
    });

    it("should return 400 if email is missing", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ password: "password123" })
        .expect(400);

      expect(response.body.error).toBe("Email and password are required");
      expect(AuthService.register).not.toHaveBeenCalled();
    });

    it("should return 400 if password is missing", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ email: "test@example.com" })
        .expect(400);

      expect(response.body.error).toBe("Email and password are required");
      expect(AuthService.register).not.toHaveBeenCalled();
    });

    it("should return 400 if user already exists", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      vi.mocked(AuthService.register).mockRejectedValue(
        new Error("User already exists")
      );

      const response = await request(app)
        .post("/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe("User already exists");
    });

    it("should return 500 for internal server errors", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      vi.mocked(AuthService.register).mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await request(app)
        .post("/auth/register")
        .send(userData)
        .expect(500);

      expect(response.body.error).toBe("Internal server error");
    });
  });

  describe("POST /auth/login", () => {
    it("should login user successfully", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const mockResponse = {
        message: "Login successful",
        token: "mock-jwt-token",
        user: {
          id: 1,
          email: loginData.email,
          name: "Test User",
        },
      };

      vi.mocked(AuthService.login).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(AuthService.login).toHaveBeenCalledWith(loginData);
    });

    it("should return 400 if email is missing", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ password: "password123" })
        .expect(400);

      expect(response.body.error).toBe("Email and password are required");
      expect(AuthService.login).not.toHaveBeenCalled();
    });

    it("should return 400 if password is missing", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com" })
        .expect(400);

      expect(response.body.error).toBe("Email and password are required");
      expect(AuthService.login).not.toHaveBeenCalled();
    });

    it("should return 401 for invalid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      vi.mocked(AuthService.login).mockRejectedValue(
        new Error("Invalid credentials")
      );

      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should return 500 for internal server errors", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      vi.mocked(AuthService.login).mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(500);

      expect(response.body.error).toBe("Internal server error");
    });
  });
});
