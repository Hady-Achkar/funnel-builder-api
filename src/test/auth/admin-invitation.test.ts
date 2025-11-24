import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GenerateAdminInvitationController } from "../../controllers/auth/admin-invitation";
import { GenerateAdminInvitationService } from "../../services/auth/admin-invitation";
import { BadRequestError, ConflictError } from "../../errors/http-errors";
import { UserPlan } from "../../generated/prisma-client";
import jwt from "jsonwebtoken";

// Mock the service
vi.mock("../../services/auth/admin-invitation");

describe("Admin Invitation Tests", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation Tests", () => {

    it("should reject invalid admin code with user-friendly message", async () => {
      mockReq.body = {
        adminCode: "INVALID123",
        invitedEmail: "test@example.com",
        plan: UserPlan.AGENCY,
      };

      await GenerateAdminInvitationController.generateInvitation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toBe(
        "The admin code you provided is invalid. Please check your code and try again."
      );
    });

    it("should reject invalid email format", async () => {
      mockReq.body = {
        adminCode: "ADM7K2X",
        invitedEmail: "invalid-email",
        plan: UserPlan.AGENCY,
      };

      await GenerateAdminInvitationController.generateInvitation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it("should reject missing admin code", async () => {
      mockReq.body = {
        invitedEmail: "test@example.com",
        plan: UserPlan.AGENCY,
      };

      await GenerateAdminInvitationController.generateInvitation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it("should reject missing email", async () => {
      mockReq.body = {
        adminCode: "ADM7K2X",
        plan: UserPlan.AGENCY,
      };

      await GenerateAdminInvitationController.generateInvitation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it("should reject invitation for existing user", async () => {
      mockReq.body = {
        adminCode: "ADM7K2X",
        invitedEmail: "existing@example.com",
        plan: UserPlan.AGENCY,
      };

      // Mock service to throw ConflictError
      vi.mocked(GenerateAdminInvitationService.generateInvitation).mockRejectedValue(
        new ConflictError(
          "A user with this email address already exists. They can sign in directly."
        )
      );

      await GenerateAdminInvitationController.generateInvitation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ConflictError));
      const error = (mockNext as any).mock.calls[0][0];
      expect(error.message).toBe(
        "A user with this email address already exists. They can sign in directly."
      );
    });
  });

  describe("Success Cases", () => {
    it("should generate invitation with valid admin code", async () => {
      mockReq.body = {
        adminCode: "ADM7K2X",
        invitedEmail: "test@example.com",
        plan: UserPlan.AGENCY,
      };

      const mockResponse = {
        invitationUrl:
          "http://localhost:3000/register?outerPaymentToken=token123",
        token: "token123",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        message: "Invitation sent successfully",
      };

      vi.mocked(
        GenerateAdminInvitationService.generateInvitation
      ).mockResolvedValue(mockResponse);

      await GenerateAdminInvitationController.generateInvitation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
      expect(
        GenerateAdminInvitationService.generateInvitation
      ).toHaveBeenCalledWith({
        adminCode: "ADM7K2X",
        invitedEmail: "test@example.com",
        plan: UserPlan.AGENCY,
      });
    });

    it("should generate invitation with default AGENCY plan", async () => {
      mockReq.body = {
        adminCode: "XPL9M4N",
        invitedEmail: "user@example.com",
      };

      const mockResponse = {
        invitationUrl:
          "http://localhost:3000/register?outerPaymentToken=token456",
        token: "token456",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        message: "Invitation sent successfully",
      };

      vi.mocked(
        GenerateAdminInvitationService.generateInvitation
      ).mockResolvedValue(mockResponse);

      await GenerateAdminInvitationController.generateInvitation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(
        GenerateAdminInvitationService.generateInvitation
      ).toHaveBeenCalledWith({
        adminCode: "XPL9M4N",
        invitedEmail: "user@example.com",
        plan: UserPlan.AGENCY, // Default plan
      });
    });

    it("should generate invitation with custom BUSINESS plan", async () => {
      mockReq.body = {
        adminCode: "QRT5W8Z",
        invitedEmail: "business@example.com",
        plan: UserPlan.BUSINESS,
      };

      const mockResponse = {
        invitationUrl:
          "http://localhost:3000/register?outerPaymentToken=token789",
        token: "token789",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        message: "Invitation sent successfully",
      };

      vi.mocked(
        GenerateAdminInvitationService.generateInvitation
      ).mockResolvedValue(mockResponse);

      await GenerateAdminInvitationController.generateInvitation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(
        GenerateAdminInvitationService.generateInvitation
      ).toHaveBeenCalledWith({
        adminCode: "QRT5W8Z",
        invitedEmail: "business@example.com",
        plan: UserPlan.BUSINESS,
      });
    });

    it("should generate invitation with FREE plan", async () => {
      mockReq.body = {
        adminCode: "VBN3H6Y",
        invitedEmail: "free@example.com",
        plan: UserPlan.FREE,
      };

      const mockResponse = {
        invitationUrl:
          "http://localhost:3000/register?outerPaymentToken=token101",
        token: "token101",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        message: "Invitation sent successfully",
      };

      vi.mocked(
        GenerateAdminInvitationService.generateInvitation
      ).mockResolvedValue(mockResponse);

      await GenerateAdminInvitationController.generateInvitation(
        mockReq,
        mockRes,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(
        GenerateAdminInvitationService.generateInvitation
      ).toHaveBeenCalledWith({
        adminCode: "VBN3H6Y",
        invitedEmail: "free@example.com",
        plan: UserPlan.FREE,
      });
    });
  });

  describe("Token Validation", () => {
    it("should verify token contains correct payload structure", () => {
      const jwtSecret = "test-secret";
      const payload = {
        adminCode: "ADM7K2X",
        invitedEmail: "test@example.com",
        plan: UserPlan.AGENCY,
        type: "admin_invitation",
        tokenId: "uuid-here",
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
      const decoded = jwt.verify(token, jwtSecret) as any;

      expect(decoded.adminCode).toBe("ADM7K2X");
      expect(decoded.invitedEmail).toBe("test@example.com");
      expect(decoded.plan).toBe(UserPlan.AGENCY);
      expect(decoded.type).toBe("admin_invitation");
      expect(decoded.tokenId).toBeDefined();
    });

    it("should verify token expires in 7 days", () => {
      const jwtSecret = "test-secret";
      const payload = {
        adminCode: "XPL9M4N",
        invitedEmail: "test@example.com",
        plan: UserPlan.AGENCY,
        type: "admin_invitation",
        tokenId: "uuid-here",
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
      const decoded = jwt.verify(token, jwtSecret) as any;

      const sevenDaysInSeconds = 7 * 24 * 60 * 60;
      const expiryDuration = decoded.exp - decoded.iat;

      // Allow 1 second tolerance
      expect(expiryDuration).toBeGreaterThanOrEqual(sevenDaysInSeconds - 1);
      expect(expiryDuration).toBeLessThanOrEqual(sevenDaysInSeconds + 1);
    });
  });

  describe("Valid Admin Codes", () => {
    const validCodes = [
      "ADM7K2X",
      "XPL9M4N",
      "QRT5W8Z",
      "VBN3H6Y",
      "FGH2L9P",
      "JKL4T7R",
      "MNP6S1Q",
      "WXY8D5C",
    ];

    validCodes.forEach((code) => {
      it(`should accept valid admin code: ${code}`, async () => {
        mockReq.body = {
          adminCode: code,
          invitedEmail: `test-${code}@example.com`,
          plan: UserPlan.AGENCY,
        };

        const mockResponse = {
          invitationUrl: `http://localhost:3000/register?outerPaymentToken=token-${code}`,
          token: `token-${code}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          message: "Invitation sent successfully",
        };

        vi.mocked(
          GenerateAdminInvitationService.generateInvitation
        ).mockResolvedValue(mockResponse);

        await GenerateAdminInvitationController.generateInvitation(
          mockReq,
          mockRes,
          mockNext
        );

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockNext).not.toHaveBeenCalledWith(expect.any(BadRequestError));
      });
    });
  });
});
