import { describe, it, expect, beforeEach, vi } from "vitest";
import { getPrisma } from "../../lib/prisma";
import { UserPlan } from "../../generated/prisma-client";
import { GetUserDataController } from "../../controllers/auth/get-user-data";
import { AuthRequest } from "../../middleware/auth";
import { Response, NextFunction } from "express";

// Mock dependencies
vi.mock("../../lib/prisma");

describe("Get User Data Controller Tests", () => {
  let mockPrisma: any;
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  // Test utilities
  const createMockUser = (overrides = {}) => ({
    id: 1,
    email: "test@example.com",
    username: "testuser",
    firstName: "John",
    lastName: "Doe",
    avatar: null,
    isAdmin: false,
    plan: UserPlan.FREE,
    balance: 0,
    trialStartDate: new Date("2024-01-01"),
    trialEndDate: new Date("2024-01-31"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
    };
    (getPrisma as any).mockReturnValue(mockPrisma);

    // Mock Express objects
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  describe("Authentication Tests", () => {
    it("should reject requests without user ID", async () => {
      mockReq.userId = undefined;

      await GetUserDataController.getUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required"
        })
      );
    });

    it("should return 404 for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockReq.userId = 999;

      await GetUserDataController.getUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should return user data for valid user", async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockReq.userId = 1;

      await GetUserDataController.getUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ user: mockUser });
    });
  });

  describe("Response Validation", () => {
    it("should return all 13 required fields", async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockReq.userId = 1;

      await GetUserDataController.getUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      const user = responseCall.user;

      // Verify all 13 required fields are present
      const expectedFields = [
        "id", "email", "username", "firstName", "lastName", "avatar",
        "isAdmin", "plan", "balance",
        "trialStartDate", "trialEndDate", "createdAt", "updatedAt"
      ];

      expectedFields.forEach(field => {
        expect(user).toHaveProperty(field);
      });

      expect(Object.keys(user)).toHaveLength(13);
    });

    it("should handle different user plans", async () => {
      const businessUser = createMockUser({ plan: UserPlan.BUSINESS });
      mockPrisma.user.findUnique.mockResolvedValue(businessUser);
      mockReq.userId = 1;

      await GetUserDataController.getUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.user.plan).toBe(UserPlan.BUSINESS);
    });

    it("should handle admin users", async () => {
      const adminUser = createMockUser({ isAdmin: true });
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      mockReq.userId = 1;

      await GetUserDataController.getUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.user.isAdmin).toBe(true);
    });

    it("should handle null trial dates", async () => {
      const userWithoutTrial = createMockUser({
        trialStartDate: null,
        trialEndDate: null,
      });
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutTrial);
      mockReq.userId = 1;

      await GetUserDataController.getUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.user.trialStartDate).toBeNull();
      expect(responseCall.user.trialEndDate).toBeNull();
    });

    it("should handle avatar URLs and null avatars", async () => {
      // Test with avatar URL
      const userWithAvatar = createMockUser({
        avatar: "https://example.com/avatar.jpg",
      });
      mockPrisma.user.findUnique.mockResolvedValue(userWithAvatar);
      mockReq.userId = 1;

      await GetUserDataController.getUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.user.avatar).toBe("https://example.com/avatar.jpg");

      // Test with null avatar
      vi.clearAllMocks();
      const userWithoutAvatar = createMockUser({ avatar: null });
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutAvatar);

      await GetUserDataController.getUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCallNull = (mockRes.json as any).mock.calls[0][0];
      expect(responseCallNull.user.avatar).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );
      mockReq.userId = 1;

      await GetUserDataController.getUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});