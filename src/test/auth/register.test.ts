import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { RegisterController } from "../../controllers/auth/register";
import { RegisterService } from "../../services/auth/register";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError, ConflictError } from "../../errors";
import { UserPlan } from "../../generated/prisma-client";

// Mock dependencies
vi.mock("../../lib/prisma");
vi.mock("../../helpers/auth/emails/register");

describe("Register Route - Complete Flow", () => {
  let mockPrisma: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Prisma
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      workspaceMember: {
        findFirst: vi.fn(),
      },
    };
    (getPrisma as any).mockReturnValue(mockPrisma);

    // Setup Express objects
    mockReq = {
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    // Setup environment
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe("Validation Tests", () => {
    it("should reject request with invalid email format", async () => {
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

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("valid email");
    });

    it("should reject request with short username", async () => {
      mockReq.body = {
        email: "test@example.com",
        username: "ab",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("at least 3 characters");
    });

    it("should reject request with invalid username characters", async () => {
      mockReq.body = {
        email: "test@example.com",
        username: "test-user!",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain(
        "lowercase letters, numbers, and underscores"
      );
    });

    it("should reject request with short password", async () => {
      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "12345",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("at least 6 characters");
    });

    it("should reject request with empty first name", async () => {
      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "",
        lastName: "Doe",
        password: "password123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("cannot be empty");
    });

    it("should validate trial period format", async () => {
      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
        trialPeriod: "invalid",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("Trial period must be in format");
    });
  });

  describe("Edge Case Tests", () => {
    it("should strictly reject registration with invalid invitation token", async () => {
      process.env.JWT_SECRET = "test-secret";

      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
        workspaceInvitationToken: "invalid.token.here"
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("invitation link appears to be invalid or expired");
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject registration with existing email", async () => {
      mockPrisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.email === "existing@example.com") {
          return Promise.resolve({ id: 1 });
        }
        return Promise.resolve(null);
      });

      mockReq.body = {
        email: "existing@example.com",
        username: "newuser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ConflictError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("An account with this email address already exists");
    });

    it("should reject registration with existing username", async () => {
      mockPrisma.user.findUnique.mockImplementation(({ where }) => {
        if (where.username === "existinguser") {
          return Promise.resolve({ id: 1 });
        }
        return Promise.resolve(null);
      });

      mockReq.body = {
        email: "new@example.com",
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

      expect(mockNext).toHaveBeenCalledWith(expect.any(ConflictError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("is already taken");
    });
  });

  describe("Success Cases", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
    });

    it("should successfully register user with default FREE plan", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        isAdmin: false,
        plan: UserPlan.FREE,
        verified: false,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 6 * 365 * 24 * 60 * 60 * 1000),
        partnerLevel: 1,
        totalSales: 0,
        commissionPercentage: 5,
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      mockReq.body = {
        email: "test@example.com",
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

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "User created successfully. Please check your email to verify your account.",
          user: expect.objectContaining({
            email: "test@example.com",
            username: "testuser",
            plan: UserPlan.FREE,
            verified: false,
          }),
        })
      );
    });

    it("should successfully register user with BUSINESS plan", async () => {
      const mockUser = {
        id: 1,
        email: "business@example.com",
        username: "businessuser",
        firstName: "Jane",
        lastName: "Smith",
        isAdmin: false,
        plan: UserPlan.BUSINESS,
        verified: false,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        partnerLevel: 1,
        totalSales: 0,
        commissionPercentage: 5,
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      mockReq.body = {
        email: "business@example.com",
        username: "businessuser",
        firstName: "Jane",
        lastName: "Smith",
        password: "password123",
        plan: UserPlan.BUSINESS,
        trialPeriod: "1y",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            plan: UserPlan.BUSINESS,
          }),
        })
      );

      // User created successfully
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it("should successfully register user with AGENCY plan", async () => {
      const mockUser = {
        id: 1,
        email: "agency@example.com",
        username: "agencyuser",
        firstName: "Agency",
        lastName: "User",
        isAdmin: false,
        plan: UserPlan.AGENCY,
        verified: false,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        partnerLevel: 1,
        totalSales: 0,
        commissionPercentage: 5,
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      mockReq.body = {
        email: "agency@example.com",
        username: "agencyuser",
        firstName: "Agency",
        lastName: "User",
        password: "password123",
        plan: UserPlan.AGENCY,
        trialPeriod: "30d",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            plan: UserPlan.AGENCY,
          }),
        })
      );

      // User created successfully
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it("should set partner fields to default values", async () => {
      const mockUser = {
        id: 1,
        email: "partner@example.com",
        username: "partneruser",
        firstName: "Partner",
        lastName: "User",
        isAdmin: false,
        plan: UserPlan.AGENCY,
        verified: false,
        trialStartDate: new Date(),
        trialEndDate: new Date(),
        partnerLevel: 1,
        totalSales: 0,
        commissionPercentage: 5,
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      mockReq.body = {
        email: "partner@example.com",
        username: "partneruser",
        firstName: "Partner",
        lastName: "User",
        password: "password123",
        plan: UserPlan.AGENCY,
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Partner fields should use database defaults
      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.partnerLevel).toBeUndefined(); // Uses DB default
      expect(createCall.data.totalSales).toBeUndefined(); // Uses DB default
      expect(createCall.data.commissionPercentage).toBeUndefined(); // Uses DB default
    });
  });

  describe("Trial Period Tests", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
    });

    it("should set trial dates with default 6 years when not specified", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        isAdmin: false,
        plan: UserPlan.FREE,
        verified: false,
        trialStartDate: new Date(),
        trialEndDate: new Date(),
        partnerLevel: 1,
        totalSales: 0,
        commissionPercentage: 5,
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      mockReq.body = {
        email: "test@example.com",
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

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.trialStartDate).toBeInstanceOf(Date);
      expect(createCall.data.trialEndDate).toBeInstanceOf(Date);

      // Check that trial period is approximately 6 years
      const startDate = createCall.data.trialStartDate;
      const endDate = createCall.data.trialEndDate;
      const yearsDiff = (endDate - startDate) / (365 * 24 * 60 * 60 * 1000);
      expect(yearsDiff).toBeCloseTo(6, 0);
    });

    it("should set custom trial period when specified", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        isAdmin: false,
        plan: UserPlan.FREE,
        verified: false,
        trialStartDate: new Date(),
        trialEndDate: new Date(),
        partnerLevel: 1,
        totalSales: 0,
        commissionPercentage: 5,
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
        trialPeriod: "3m",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      const startDate = createCall.data.trialStartDate;
      const endDate = createCall.data.trialEndDate;
      const monthsDiff = (endDate - startDate) / (30 * 24 * 60 * 60 * 1000);
      expect(monthsDiff).toBeCloseTo(3, 0);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockRejectedValue(
        new Error("Database connection failed")
      );

      mockReq.body = {
        email: "test@example.com",
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

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("Database connection failed");
    });

    it("should handle missing JWT secret", async () => {
      delete process.env.JWT_SECRET;
      mockPrisma.user.findUnique.mockResolvedValue(null);

      mockReq.body = {
        email: "test@example.com",
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

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("JWT secret not configured");
    });
  });
});
