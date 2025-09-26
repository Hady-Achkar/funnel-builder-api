import { describe, it, expect, beforeEach, vi } from "vitest";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { LeaveWorkspaceController } from "../../controllers/workspace/leave";
import { LeaveWorkspaceService } from "../../services/workspace/leave";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/http-errors";

// Mock the service
vi.mock("../../services/workspace/leave");

describe("Workspace Leave Tests", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockLeaveWorkspaceService: any;

  beforeEach(() => {
    mockReq = {
      userId: undefined,
      params: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    mockLeaveWorkspaceService = LeaveWorkspaceService as any;
    vi.clearAllMocks();
  });

  describe("Authentication Tests", () => {
    it("should require authenticated user", async () => {
      mockReq.userId = undefined;
      mockReq.params = { slug: "test-workspace" };

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
        })
      );
      expect(mockLeaveWorkspaceService.leave).not.toHaveBeenCalled();
    });

    it("should use workspace slug from request params", async () => {
      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };

      mockLeaveWorkspaceService.leave.mockResolvedValue({
        success: true,
        message: "Successfully left workspace",
      });

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockLeaveWorkspaceService.leave).toHaveBeenCalledWith(
        1,
        "test-workspace"
      );
    });
  });

  describe("Successful Leave Cases", () => {
    it("should successfully allow member to leave workspace", async () => {
      mockReq.userId = 2;
      mockReq.params = { slug: "test-workspace" };

      mockLeaveWorkspaceService.leave.mockResolvedValue({
        success: true,
        message: "Successfully left workspace",
      });

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockLeaveWorkspaceService.leave).toHaveBeenCalledWith(
        2,
        "test-workspace"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Successfully left workspace",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call service with correct parameters", async () => {
      const userId = 5;
      const slug = "my-company-workspace";

      mockReq.userId = userId;
      mockReq.params = { slug };

      mockLeaveWorkspaceService.leave.mockResolvedValue({
        success: true,
        message: "Successfully left workspace",
      });

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockLeaveWorkspaceService.leave).toHaveBeenCalledWith(
        userId,
        slug
      );
      expect(mockLeaveWorkspaceService.leave).toHaveBeenCalledTimes(1);
    });
  });

  describe("Workspace Not Found Tests", () => {
    it("should handle workspace not found error", async () => {
      mockReq.userId = 1;
      mockReq.params = { slug: "non-existent-workspace" };

      mockLeaveWorkspaceService.leave.mockRejectedValue(
        new NotFoundError("Workspace not found")
      );

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Workspace not found",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should handle invalid/empty slug", async () => {
      mockReq.userId = 1;
      mockReq.params = { slug: "" };

      mockLeaveWorkspaceService.leave.mockRejectedValue(
        new BadRequestError("Workspace slug is required")
      );

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Workspace slug is required",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("Authorization Tests", () => {
    it("should prevent non-members from leaving workspace", async () => {
      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };

      mockLeaveWorkspaceService.leave.mockRejectedValue(
        new ForbiddenError("You are not a member of this workspace")
      );

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You are not a member of this workspace",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should prevent workspace owner from leaving their own workspace", async () => {
      mockReq.userId = 1;
      mockReq.params = { slug: "owned-workspace" };

      mockLeaveWorkspaceService.leave.mockRejectedValue(
        new ForbiddenError("Workspace owner cannot leave their own workspace")
      );

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Workspace owner cannot leave their own workspace",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle service errors gracefully", async () => {
      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };

      mockLeaveWorkspaceService.leave.mockRejectedValue(
        new Error("Database connection failed")
      );

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Database connection failed",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should handle missing slug parameter", async () => {
      mockReq.userId = 1;
      mockReq.params = {}; // No slug provided

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid input: expected string, received undefined",
        })
      );
      expect(mockLeaveWorkspaceService.leave).not.toHaveBeenCalled();
    });
  });

  describe("Service Interaction", () => {
    it("should only call service with userId and slug parameters", async () => {
      mockReq.userId = 3;
      mockReq.params = { slug: "test-workspace", otherparam: "ignored" };

      mockLeaveWorkspaceService.leave.mockResolvedValue({
        success: true,
        message: "Successfully left workspace",
      });

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockLeaveWorkspaceService.leave).toHaveBeenCalledWith(
        3,
        "test-workspace"
      );
      expect(mockLeaveWorkspaceService.leave).toHaveBeenCalledTimes(1);
    });

    it("should pass through service response directly", async () => {
      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };

      const serviceResponse = {
        success: true,
        message: "Custom success message from service",
        data: { workspaceId: 123 },
      };

      mockLeaveWorkspaceService.leave.mockResolvedValue(serviceResponse);

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(serviceResponse);
    });
  });

  describe("Member Role Scenarios", () => {
    it("should allow ADMIN to leave workspace", async () => {
      mockReq.userId = 2;
      mockReq.params = { slug: "test-workspace" };

      mockLeaveWorkspaceService.leave.mockResolvedValue({
        success: true,
        message: "Admin successfully left workspace",
      });

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockLeaveWorkspaceService.leave).toHaveBeenCalledWith(
        2,
        "test-workspace"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should allow EDITOR to leave workspace", async () => {
      mockReq.userId = 3;
      mockReq.params = { slug: "test-workspace" };

      mockLeaveWorkspaceService.leave.mockResolvedValue({
        success: true,
        message: "Editor successfully left workspace",
      });

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockLeaveWorkspaceService.leave).toHaveBeenCalledWith(
        3,
        "test-workspace"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should allow VIEWER to leave workspace", async () => {
      mockReq.userId = 4;
      mockReq.params = { slug: "test-workspace" };

      mockLeaveWorkspaceService.leave.mockResolvedValue({
        success: true,
        message: "Viewer successfully left workspace",
      });

      await LeaveWorkspaceController.leave(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockLeaveWorkspaceService.leave).toHaveBeenCalledWith(
        4,
        "test-workspace"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
