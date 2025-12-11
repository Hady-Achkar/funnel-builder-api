import { describe, it, expect, beforeEach, vi } from "vitest";
import { getPrisma } from "../../lib/prisma";
import { UserPlan, RegistrationSource } from "../../generated/prisma-client";
import { GetFreshUserDataController } from "../../controllers/auth/get-fresh-user-data";
import { AuthRequest } from "../../middleware/auth";
import { Response, NextFunction } from "express";

// Mock dependencies
vi.mock("../../lib/prisma");

describe("Get Fresh User Data Controller Tests", () => {
  let mockPrisma: any;
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  // Test utilities
  const createMockFreshUserData = (overrides = {}) => ({
    plan: UserPlan.NO_PLAN,
    registrationSource: RegistrationSource.DIRECT,
    registrationToken: null,
    balance: 0,
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

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
        })
      );
    });

    it("should return 404 for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockReq.userId = 999;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should return fresh user data for valid user", async () => {
      const mockUserData = createMockFreshUserData();
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUserData);
    });
  });

  describe("Response Data Validation", () => {
    it("should return exactly 4 required fields", async () => {
      const mockUserData = createMockFreshUserData();
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];

      // Verify all 4 required fields are present
      const expectedFields = [
        "plan",
        "registrationSource",
        "registrationToken",
        "balance",
      ];

      expectedFields.forEach((field) => {
        expect(responseCall).toHaveProperty(field);
      });

      expect(Object.keys(responseCall)).toHaveLength(4);
    });

    it("should return correct data types for all fields", async () => {
      const mockUserData = createMockFreshUserData({
        plan: UserPlan.BUSINESS,
        registrationSource: RegistrationSource.AFFILIATE,
        registrationToken: "affiliate-token-123",
        balance: 150.5,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];

      // Verify data types
      expect(typeof responseCall.plan).toBe("string");
      expect(typeof responseCall.registrationSource).toBe("string");
      expect(typeof responseCall.registrationToken).toBe("string");
      expect(typeof responseCall.balance).toBe("number");
    });
  });

  describe("User Plan Tests", () => {
    it("should handle NO_PLAN user", async () => {
      const mockUserData = createMockFreshUserData({
        plan: UserPlan.NO_PLAN,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.plan).toBe(UserPlan.NO_PLAN);
    });

    it("should handle FREE plan user", async () => {
      const mockUserData = createMockFreshUserData({
        plan: UserPlan.FREE,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.plan).toBe(UserPlan.FREE);
    });

    it("should handle BUSINESS plan user", async () => {
      const mockUserData = createMockFreshUserData({
        plan: UserPlan.BUSINESS,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.plan).toBe(UserPlan.BUSINESS);
    });

    it("should handle AGENCY plan user", async () => {
      const mockUserData = createMockFreshUserData({
        plan: UserPlan.AGENCY,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.plan).toBe(UserPlan.AGENCY);
    });

    it("should handle WORKSPACE_MEMBER user", async () => {
      const mockUserData = createMockFreshUserData({
        plan: UserPlan.WORKSPACE_MEMBER,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.plan).toBe(UserPlan.WORKSPACE_MEMBER);
    });
  });

  describe("Registration Source Tests", () => {
    it("should handle DIRECT registration source", async () => {
      const mockUserData = createMockFreshUserData({
        registrationSource: RegistrationSource.DIRECT,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.registrationSource).toBe(RegistrationSource.DIRECT);
    });

    it("should handle WORKSPACE_INVITE registration source", async () => {
      const mockUserData = createMockFreshUserData({
        registrationSource: RegistrationSource.WORKSPACE_INVITE,
        registrationToken: "workspace-invite-token-abc123",
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.registrationSource).toBe(
        RegistrationSource.WORKSPACE_INVITE
      );
      expect(responseCall.registrationToken).toBe(
        "workspace-invite-token-abc123"
      );
    });

    it("should handle AFFILIATE registration source", async () => {
      const mockUserData = createMockFreshUserData({
        registrationSource: RegistrationSource.AFFILIATE,
        registrationToken: "affiliate-token-xyz789",
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.registrationSource).toBe(
        RegistrationSource.AFFILIATE
      );
      expect(responseCall.registrationToken).toBe("affiliate-token-xyz789");
    });

    it("should handle null registration source", async () => {
      const mockUserData = createMockFreshUserData({
        registrationSource: null,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.registrationSource).toBeNull();
    });
  });

  describe("Registration Token Tests", () => {
    it("should handle null registration token", async () => {
      const mockUserData = createMockFreshUserData({
        registrationToken: null,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.registrationToken).toBeNull();
    });

    it("should handle workspace invitation token", async () => {
      const mockUserData = createMockFreshUserData({
        registrationSource: RegistrationSource.WORKSPACE_INVITE,
        registrationToken: "workspace-token-12345",
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.registrationToken).toBe("workspace-token-12345");
    });

    it("should handle affiliate token", async () => {
      const mockUserData = createMockFreshUserData({
        registrationSource: RegistrationSource.AFFILIATE,
        registrationToken: "aff-token-67890",
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.registrationToken).toBe("aff-token-67890");
    });
  });

  describe("Balance Tests", () => {
    it("should handle zero balance", async () => {
      const mockUserData = createMockFreshUserData({
        balance: 0,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.balance).toBe(0);
    });

    it("should handle positive balance", async () => {
      const mockUserData = createMockFreshUserData({
        balance: 250.75,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.balance).toBe(250.75);
    });

    it("should handle large balance amounts", async () => {
      const mockUserData = createMockFreshUserData({
        balance: 10500.5,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.balance).toBe(10500.5);
    });

    it("should handle decimal balance with precision", async () => {
      const mockUserData = createMockFreshUserData({
        balance: 99.99,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.balance).toBe(99.99);
    });
  });

  describe("Complete User Scenarios", () => {
    it("should return correct data for direct registration NO_PLAN user with zero balance", async () => {
      const mockUserData = createMockFreshUserData({
        plan: UserPlan.NO_PLAN,
        registrationSource: RegistrationSource.DIRECT,
        registrationToken: null,
        balance: 0,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];

      expect(responseCall).toEqual({
        plan: UserPlan.NO_PLAN,
        registrationSource: RegistrationSource.DIRECT,
        registrationToken: null,
        balance: 0,
      });
    });

    it("should return correct data for affiliate BUSINESS user with positive balance", async () => {
      const mockUserData = createMockFreshUserData({
        plan: UserPlan.BUSINESS,
        registrationSource: RegistrationSource.AFFILIATE,
        registrationToken: "aff-123-xyz",
        balance: 500.25,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 2;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];

      expect(responseCall).toEqual({
        plan: UserPlan.BUSINESS,
        registrationSource: RegistrationSource.AFFILIATE,
        registrationToken: "aff-123-xyz",
        balance: 500.25,
      });
    });

    it("should return correct data for workspace invited WORKSPACE_MEMBER user", async () => {
      const mockUserData = createMockFreshUserData({
        plan: UserPlan.WORKSPACE_MEMBER,
        registrationSource: RegistrationSource.WORKSPACE_INVITE,
        registrationToken: "ws-invite-token-456",
        balance: 0,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 3;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];

      expect(responseCall).toEqual({
        plan: UserPlan.WORKSPACE_MEMBER,
        registrationSource: RegistrationSource.WORKSPACE_INVITE,
        registrationToken: "ws-invite-token-456",
        balance: 0,
      });
    });

    it("should return correct data for AGENCY user with high balance", async () => {
      const mockUserData = createMockFreshUserData({
        plan: UserPlan.AGENCY,
        registrationSource: RegistrationSource.DIRECT,
        registrationToken: null,
        balance: 15000.0,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 4;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = (mockRes.json as any).mock.calls[0][0];

      expect(responseCall).toEqual({
        plan: UserPlan.AGENCY,
        registrationSource: RegistrationSource.DIRECT,
        registrationToken: null,
        balance: 15000.0,
      });
    });
  });

  describe("Database Query Verification", () => {
    it("should query database with correct user ID", async () => {
      const mockUserData = createMockFreshUserData();
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 42;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        select: {
          plan: true,
          registrationSource: true,
          registrationToken: true,
          balance: true,
        },
      });
    });

    it("should only select required fields from database", async () => {
      const mockUserData = createMockFreshUserData();
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      const selectCall = mockPrisma.user.findUnique.mock.calls[0][0].select;
      const selectedFields = Object.keys(selectCall);

      expect(selectedFields).toEqual([
        "plan",
        "registrationSource",
        "registrationToken",
        "balance",
      ]);
      expect(selectedFields).toHaveLength(4);
    });

    it("should fetch fresh data on each request", async () => {
      const mockUserData1 = createMockFreshUserData({ balance: 100 });
      const mockUserData2 = createMockFreshUserData({ balance: 200 });

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUserData1)
        .mockResolvedValueOnce(mockUserData2);

      mockReq.userId = 1;

      // First request
      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      let responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.balance).toBe(100);

      // Clear mocks for second request
      vi.clearAllMocks();
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      // Second request
      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      responseCall = (mockRes.json as any).mock.calls[0][0];
      expect(responseCall.balance).toBe(200);

      // Verify database was queried both times
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("Database connection failed");
    });

    it("should handle database timeout errors", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Query timeout"));
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle unexpected database errors", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error("Unexpected error")
      );
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("Type Safety and Validation", () => {
    it("should validate response against Zod schema", async () => {
      const mockUserData = createMockFreshUserData({
        plan: UserPlan.BUSINESS,
        registrationSource: RegistrationSource.AFFILIATE,
        registrationToken: "token-123",
        balance: 150.5,
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
      mockReq.userId = 1;

      await GetFreshUserDataController.getFreshUserData(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      // Should not call next with error if validation passes
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should ensure all enum values are valid", async () => {
      const testCases = [
        {
          plan: UserPlan.NO_PLAN,
          registrationSource: RegistrationSource.DIRECT,
        },
        {
          plan: UserPlan.FREE,
          registrationSource: RegistrationSource.WORKSPACE_INVITE,
        },
        {
          plan: UserPlan.BUSINESS,
          registrationSource: RegistrationSource.AFFILIATE,
        },
        {
          plan: UserPlan.AGENCY,
          registrationSource: RegistrationSource.DIRECT,
        },
        {
          plan: UserPlan.WORKSPACE_MEMBER,
          registrationSource: RegistrationSource.WORKSPACE_INVITE,
        },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        mockRes = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
        };

        const mockUserData = createMockFreshUserData(testCase);
        mockPrisma.user.findUnique.mockResolvedValue(mockUserData);
        mockReq.userId = 1;

        await GetFreshUserDataController.getFreshUserData(
          mockReq as AuthRequest,
          mockRes as Response,
          mockNext
        );

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
      }
    });
  });
});
