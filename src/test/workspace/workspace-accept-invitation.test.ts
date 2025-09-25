import { describe, it, expect, beforeEach, vi } from "vitest";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { AcceptInvitationController } from "../../controllers/workspace/accept-invitation";

describe("Workspace Accept Invitation Controller Tests", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
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
    it("should reject missing token", async () => {
      mockReq.body = {};

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid input: expected string, received undefined" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject empty token", async () => {
      mockReq.body = { token: "" };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Token is required" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("Authentication and Authorization Errors", () => {
    it("should reject non-authenticated users (missing userId)", async () => {
      mockReq.userId = undefined;
      mockReq.body = { token: "valid-jwt-token" };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it("should reject non-registered users", async () => {
      const { AcceptInvitationService } = await import("../../services/workspace/accept-invitation");
      const { NotFoundError } = await import("../../errors");

      const serviceSpy = vi.spyOn(AcceptInvitationService.prototype, 'acceptInvitation').mockRejectedValue(
        new NotFoundError("User not found")
      );

      mockReq.body = { token: "valid-jwt-token" };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User not found" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });

    it("should reject users with email different from token email", async () => {
      const { AcceptInvitationService } = await import("../../services/workspace/accept-invitation");
      const { ForbiddenError } = await import("../../errors");

      const serviceSpy = vi.spyOn(AcceptInvitationService.prototype, 'acceptInvitation').mockRejectedValue(
        new ForbiddenError("This invitation is not for your email address")
      );

      mockReq.body = { token: "valid-jwt-token" };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "This invitation is not for your email address" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });
  });

  describe("Business Rule Violations", () => {
    it("should reject when workspace member limit is reached", async () => {
      const { AcceptInvitationService } = await import("../../services/workspace/accept-invitation");
      const { BadRequestError } = await import("../../errors");

      const serviceSpy = vi.spyOn(AcceptInvitationService.prototype, 'acceptInvitation').mockRejectedValue(
        new BadRequestError("Cannot accept invitation. Workspace member limit reached.")
      );

      mockReq.body = { token: "valid-jwt-token" };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Cannot accept invitation. Workspace member limit reached." })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });

    it("should reject invalid or expired tokens", async () => {
      const { AcceptInvitationService } = await import("../../services/workspace/accept-invitation");
      const { BadRequestError } = await import("../../errors");

      const serviceSpy = vi.spyOn(AcceptInvitationService.prototype, 'acceptInvitation').mockRejectedValue(
        new BadRequestError("Invalid or expired invitation token")
      );

      mockReq.body = { token: "invalid-token" };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid or expired invitation token" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });

    it("should reject invalid token types", async () => {
      const { AcceptInvitationService } = await import("../../services/workspace/accept-invitation");
      const { BadRequestError } = await import("../../errors");

      const serviceSpy = vi.spyOn(AcceptInvitationService.prototype, 'acceptInvitation').mockRejectedValue(
        new BadRequestError("Invalid invitation token type")
      );

      mockReq.body = { token: "wrong-type-token" };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid invitation token type" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });
  });
});