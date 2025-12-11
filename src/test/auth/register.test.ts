import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { RegisterController } from "../../controllers/auth/register";
import { RegisterService } from "../../services/auth/register";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError, ConflictError } from "../../errors";
import { UserPlan, RegistrationSource } from "../../generated/prisma-client";
import jwt from "jsonwebtoken";

// Mock dependencies
vi.mock("../../lib/prisma");
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));

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
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      workspaceMember: {
        findFirst: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      workspace: {
        findUnique: vi.fn(),
      },
      affiliateLink: {
        findUnique: vi.fn(),
      },
      addOn: {
        findMany: vi.fn(),
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

    it("should successfully register user with default NO_PLAN", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        isAdmin: false,
        plan: UserPlan.NO_PLAN,
        verified: false,
        registrationSource: RegistrationSource.DIRECT,
        referralLinkUsedId: null,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
            plan: UserPlan.NO_PLAN,
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


  describe("Affiliate Token Tests", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
    });

    it("should successfully register user with valid affiliate token", async () => {
      const mockAffiliateLink = {
        id: 5,
        token: "abc123xyz",
      };

      const mockUser = {
        id: 1,
        email: "affiliate@example.com",
        username: "affiliateuser",
        firstName: "Bob",
        lastName: "Wilson",
        isAdmin: false,
        plan: UserPlan.NO_PLAN,
        verified: false,
        registrationSource: RegistrationSource.AFFILIATE,
        referralLinkUsedId: null, // Will be set after payment
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        partnerLevel: 1,
        totalSales: 0,
        commissionPercentage: 5,
      };

      mockPrisma.affiliateLink.findUnique.mockResolvedValue(mockAffiliateLink);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      mockReq.body = {
        email: "affiliate@example.com",
        username: "affiliateuser",
        firstName: "Bob",
        lastName: "Wilson",
        password: "password123",
        affiliateToken: "abc123xyz",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockPrisma.affiliateLink.findUnique).toHaveBeenCalledWith({
        where: { token: "abc123xyz" },
        select: { id: true, token: true },
      });

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: "affiliate@example.com",
            plan: UserPlan.NO_PLAN,
          }),
        })
      );

      // Verify user was created with AFFILIATE source but NO referralLinkUsedId (set after payment)
      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.referralLinkUsedId).toBeUndefined(); // Not set until payment
      expect(createCall.data.registrationSource).toBe(RegistrationSource.AFFILIATE);
    });

    it("should reject registration with invalid affiliate token", async () => {
      mockPrisma.affiliateLink.findUnique.mockResolvedValue(null);

      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
        affiliateToken: "invalid-token",
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("affiliate link");
    });
  });

  describe("Registration Source Tests", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
    });

    it("should set DIRECT source for regular registration", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        isAdmin: false,
        plan: UserPlan.NO_PLAN,
        verified: false,
        registrationSource: RegistrationSource.DIRECT,
        referralLinkUsedId: null,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
      expect(createCall.data.registrationSource).toBe(RegistrationSource.DIRECT);
    });
  });

  describe("Trial Period Tests", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
    });

    it("should set trial dates for NO_PLAN users with 1 year default", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        isAdmin: false,
        plan: UserPlan.NO_PLAN,
        verified: false,
        registrationSource: RegistrationSource.DIRECT,
        referralLinkUsedId: null,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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

      // Check that trial period is approximately 1 year
      const startDate = createCall.data.trialStartDate;
      const endDate = createCall.data.trialEndDate;
      const yearsDiff = (endDate - startDate) / (365 * 24 * 60 * 60 * 1000);
      expect(yearsDiff).toBeCloseTo(1, 0);
    });

    it("should set trial dates for BUSINESS plan users", async () => {
      const mockUser = {
        id: 1,
        email: "business@example.com",
        username: "businessuser",
        firstName: "Jane",
        lastName: "Smith",
        isAdmin: false,
        plan: UserPlan.BUSINESS,
        verified: false,
        registrationSource: RegistrationSource.DIRECT,
        referralLinkUsedId: null,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.trialStartDate).toBeInstanceOf(Date);
      expect(createCall.data.trialEndDate).toBeInstanceOf(Date);
    });

    it("should set custom trial period when specified", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        username: "testuser",
        firstName: "John",
        lastName: "Doe",
        isAdmin: false,
        plan: UserPlan.NO_PLAN,
        verified: false,
        registrationSource: RegistrationSource.DIRECT,
        referralLinkUsedId: null,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000),
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

  describe("Workspace Member Limit Tests", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
    });

    it("should reject workspace direct link registration if member limit reached", async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        {
          workspaceId: 1,
          workspaceSlug: "test",
          role: "EDITOR",
          type: "workspace_direct_link",
          linkId: "abc123",
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Mock workspace with FREE plan (max 1 member) and already 1 active member
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        planType: UserPlan.FREE,
        _count: {
          members: 1 // Already at limit
        }
      });

      // Mock add-ons query
      mockPrisma.addOn.findMany.mockResolvedValue([]);

      mockReq.body = {
        email: "newmember@example.com",
        username: "newmember",
        firstName: "New",
        lastName: "Member",
        password: "password123",
        workspaceInvitationToken: token,
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toContain("maximum member limit");
    });

    it("should allow workspace direct link registration if under member limit", async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        {
          workspaceId: 1,
          workspaceSlug: "test",
          role: "EDITOR",
          type: "workspace_direct_link",
          linkId: "abc123",
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Mock workspace with BUSINESS plan (max 2 members) and only 1 active member
      // Need to mock twice - once for controller check, once for service
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        name: "Test Workspace",
        slug: "test",
        planType: UserPlan.BUSINESS,
        _count: {
          members: 1 // Under limit
        }
      });

      // Mock add-ons query
      mockPrisma.addOn.findMany.mockResolvedValue([]);

      // Mock workspace member creation
      mockPrisma.workspaceMember.create = vi.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        workspaceId: 1,
        role: "EDITOR",
        permissions: [],
        status: "ACTIVE",
        joinedAt: new Date(),
      });

      const mockUser = {
        id: 1,
        email: "newmember@example.com",
        username: "newmember",
        firstName: "New",
        lastName: "Member",
        isAdmin: false,
        plan: UserPlan.WORKSPACE_MEMBER,
        verified: false,
        registrationSource: RegistrationSource.WORKSPACE_INVITE,
        referralLinkUsedId: null,
        trialStartDate: null,
        trialEndDate: null,
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      mockReq.body = {
        email: "newmember@example.com",
        username: "newmember",
        firstName: "New",
        lastName: "Member",
        password: "password123",
        workspaceInvitationToken: token,
      };

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
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

  describe("Admin Invitation Token Tests", () => {
    beforeEach(() => {
      process.env.JWT_SECRET = "test-jwt-secret";

      // Spy on RegisterService.register to verify it's called correctly
      vi.spyOn(RegisterService, "register").mockResolvedValue({
        message: "User registered successfully",
        user: {
          id: 1,
          email: "test@example.com",
          username: "testuser",
          firstName: "John",
          lastName: "Doe",
          isAdmin: false,
          plan: UserPlan.AGENCY,
          verified: false,
        },
        workspace: {
          id: 1,
          name: "testuser's workspace",
          slug: "testuser-workspace",
          role: "OWNER" as const,
          permissions: [] as any[],
        },
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should register user with valid admin invitation token", async () => {
      const token = jwt.sign(
        {
          adminCode: "ADM7K2X",
          invitedEmail: "john.doe@example.com",
          plan: "AGENCY",
          type: "admin_invitation",
          tokenId: "uuid-123",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      mockReq.body = {
        email: "john.doe@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
        outerPaymentToken: token,
      };

      mockPrisma.user.findFirst.mockResolvedValue(null); // No existing user with token
      mockPrisma.user.findUnique.mockResolvedValue(null); // No duplicate email/username

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(RegisterService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "john.doe@example.com",
          plan: "AGENCY", // Plan from token
        }),
        "OUTER_PAYMENT",
        "ADM7K2X" // addedBy from token
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should reject expired admin invitation token", async () => {
      const token = jwt.sign(
        {
          adminCode: "ADM7K2X",
          invitedEmail: "john.doe@example.com",
          plan: "AGENCY",
          type: "admin_invitation",
          tokenId: "uuid-123",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "0s" } // Expired immediately
      );

      // Wait to ensure token expires
      await new Promise((resolve) => setTimeout(resolve, 100));

      mockReq.body = {
        email: "john.doe@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        password: "password123",
        outerPaymentToken: token,
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "This invitation link has expired. Please request a new invitation from your administrator.",
        })
      );
    });

    it("should reject already used admin invitation token", async () => {
      const token = jwt.sign(
        {
          adminCode: "XPL9M4N",
          invitedEmail: "user@example.com",
          plan: "BUSINESS",
          type: "admin_invitation",
          tokenId: "uuid-456",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      mockReq.body = {
        email: "user@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        password: "password123",
        outerPaymentToken: token,
      };

      // Token already used by another user
      mockPrisma.user.findFirst.mockResolvedValue({ id: 999 } as any);

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "This invitation link has already been used. Each invitation can only be used once.",
        })
      );
    });

    it("should reject token with email mismatch", async () => {
      const token = jwt.sign(
        {
          adminCode: "QRT5W8Z",
          invitedEmail: "invited@example.com",
          plan: "AGENCY",
          type: "admin_invitation",
          tokenId: "uuid-789",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      mockReq.body = {
        email: "different@example.com", // Different email
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        password: "password123",
        outerPaymentToken: token,
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "This invitation was sent to a different email address. Please use the email address from your invitation.",
        })
      );
    });

    it("should reject token with invalid admin code", async () => {
      const token = jwt.sign(
        {
          adminCode: "INVALID",
          invitedEmail: "user@example.com",
          plan: "AGENCY",
          type: "admin_invitation",
          tokenId: "uuid-101",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      mockReq.body = {
        email: "user@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        password: "password123",
        outerPaymentToken: token,
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "This invitation link is invalid. Please check your email or contact support.",
        })
      );
    });

    it("should handle BUSINESS plan from admin invitation", async () => {
      const token = jwt.sign(
        {
          adminCode: "VBN3H6Y",
          invitedEmail: "business@example.com",
          plan: "BUSINESS",
          type: "admin_invitation",
          tokenId: "uuid-202",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      mockReq.body = {
        email: "business@example.com",
        username: "businessuser",
        firstName: "Business",
        lastName: "User",
        password: "password123",
        outerPaymentToken: token,
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(RegisterService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: "BUSINESS",
        }),
        "OUTER_PAYMENT",
        "VBN3H6Y"
      );
    });

    it("should handle FREE plan from admin invitation", async () => {
      const token = jwt.sign(
        {
          adminCode: "FGH2L9P",
          invitedEmail: "free@example.com",
          plan: "FREE",
          type: "admin_invitation",
          tokenId: "uuid-303",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      mockReq.body = {
        email: "free@example.com",
        username: "freeuser",
        firstName: "Free",
        lastName: "User",
        password: "password123",
        outerPaymentToken: token,
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(RegisterService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: "FREE",
        }),
        "OUTER_PAYMENT",
        "FGH2L9P"
      );
    });

    it("should verify addedBy is stored correctly", async () => {
      const adminCode = "JKL4T7R";
      const token = jwt.sign(
        {
          adminCode,
          invitedEmail: "test@example.com",
          plan: "AGENCY",
          type: "admin_invitation",
          tokenId: "uuid-404",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      mockReq.body = {
        email: "test@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        password: "password123",
        outerPaymentToken: token,
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await RegisterController.register(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(RegisterService.register).toHaveBeenCalledWith(
        expect.anything(),
        "OUTER_PAYMENT",
        adminCode // Verify adminCode is passed as addedBy
      );
    });
  });
});
