import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GetUserWorkspacesSummaryService } from "../../services/workspace/get-user-summary";
import { GetUserWorkspacesSummaryController } from "../../controllers/workspace/get-user-summary";
import { getPrisma } from "../../lib/prisma";
import { WorkspaceRole, MembershipStatus } from "../../generated/prisma-client";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";

vi.mock("../../lib/prisma");

describe("Get User Workspaces Summary Tests", () => {
  let mockPrisma: any;
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findMany: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GetUserWorkspacesSummaryService", () => {
    describe("Success Cases", () => {
      it("should return workspaces summary for user as owner and member", async () => {
        const workspacesData = [
          {
            id: 1,
            name: "Owned Workspace",
            slug: "owned-workspace",
            image: "https://example.com/image1.png",
            ownerId: userId,
            members: [],
          },
          {
            id: 2,
            name: "Member Workspace",
            slug: "member-workspace",
            image: null,
            ownerId: 999,
            members: [
              {
                userId,
                role: WorkspaceRole.EDITOR,
                status: MembershipStatus.ACTIVE,
              },
            ],
          },
        ];

        mockPrisma.workspace.findMany.mockResolvedValue(workspacesData);

        const result = await GetUserWorkspacesSummaryService.getUserWorkspacesSummary(userId);

        expect(result).toEqual([
          {
            id: 1,
            name: "Owned Workspace",
            slug: "owned-workspace",
            image: "https://example.com/image1.png",
            role: WorkspaceRole.OWNER,
          },
          {
            id: 2,
            name: "Member Workspace",
            slug: "member-workspace",
            image: null,
            role: WorkspaceRole.EDITOR,
          },
        ]);

        expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith({
          where: {
            OR: [
              { ownerId: userId },
              {
                members: {
                  some: {
                    userId: userId,
                    status: MembershipStatus.ACTIVE,
                  },
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            ownerId: true,
            members: {
              where: {
                userId: userId,
              },
              select: {
                role: true,
                status: true,
              },
            },
          },
        });
      });

      it("should exclude workspaces where user has pending status", async () => {
        const workspacesData = [
          {
            id: 1,
            name: "Owned Workspace",
            slug: "owned-workspace",
            image: null,
            ownerId: userId,
            members: [],
          },
          {
            id: 2,
            name: "Active Member Workspace",
            slug: "active-member-workspace",
            image: "https://example.com/image2.png",
            ownerId: 999,
            members: [
              {
                userId,
                role: WorkspaceRole.VIEWER,
                status: MembershipStatus.ACTIVE,
              },
            ],
          },
          // This workspace should be excluded by the query since user is pending
        ];

        mockPrisma.workspace.findMany.mockResolvedValue(workspacesData);

        const result = await GetUserWorkspacesSummaryService.getUserWorkspacesSummary(userId);

        expect(result).toEqual([
          {
            id: 1,
            name: "Owned Workspace",
            slug: "owned-workspace",
            image: null,
            role: WorkspaceRole.OWNER,
          },
          {
            id: 2,
            name: "Active Member Workspace",
            slug: "active-member-workspace",
            image: "https://example.com/image2.png",
            role: WorkspaceRole.VIEWER,
          },
        ]);
      });

      it("should return empty array when user has no workspaces", async () => {
        mockPrisma.workspace.findMany.mockResolvedValue([]);

        const result = await GetUserWorkspacesSummaryService.getUserWorkspacesSummary(userId);

        expect(result).toEqual([]);
      });

      it("should handle workspaces with different roles", async () => {
        const workspacesData = [
          {
            id: 1,
            name: "Admin Workspace",
            slug: "admin-workspace",
            image: "https://example.com/admin.png",
            ownerId: 999,
            members: [
              {
                userId,
                role: WorkspaceRole.ADMIN,
                status: MembershipStatus.ACTIVE,
              },
            ],
          },
          {
            id: 2,
            name: "Editor Workspace",
            slug: "editor-workspace",
            image: null,
            ownerId: 888,
            members: [
              {
                userId,
                role: WorkspaceRole.EDITOR,
                status: MembershipStatus.ACTIVE,
              },
            ],
          },
          {
            id: 3,
            name: "Viewer Workspace",
            slug: "viewer-workspace",
            image: "https://example.com/viewer.png",
            ownerId: 777,
            members: [
              {
                userId,
                role: WorkspaceRole.VIEWER,
                status: MembershipStatus.ACTIVE,
              },
            ],
          },
        ];

        mockPrisma.workspace.findMany.mockResolvedValue(workspacesData);

        const result = await GetUserWorkspacesSummaryService.getUserWorkspacesSummary(userId);

        expect(result).toEqual([
          {
            id: 1,
            name: "Admin Workspace",
            slug: "admin-workspace",
            image: "https://example.com/admin.png",
            role: WorkspaceRole.ADMIN,
          },
          {
            id: 2,
            name: "Editor Workspace",
            slug: "editor-workspace",
            image: null,
            role: WorkspaceRole.EDITOR,
          },
          {
            id: 3,
            name: "Viewer Workspace",
            slug: "viewer-workspace",
            image: "https://example.com/viewer.png",
            role: WorkspaceRole.VIEWER,
          },
        ]);
      });
    });
  });

  describe("GetUserWorkspacesSummaryController", () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        userId,
      };
      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it("should return 200 with workspaces data on success", async () => {
      const workspacesData = [
        {
          id: 1,
          name: "Test Workspace",
          slug: "test-workspace",
          image: "https://example.com/test.png",
          ownerId: userId,
          members: [],
        },
      ];

      mockPrisma.workspace.findMany.mockResolvedValue(workspacesData);

      await GetUserWorkspacesSummaryController.getUserWorkspacesSummary(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([
        {
          id: 1,
          name: "Test Workspace",
          slug: "test-workspace",
          image: "https://example.com/test.png",
          role: WorkspaceRole.OWNER,
        },
      ]);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error when service throws", async () => {
      const error = new Error("Database error");
      mockPrisma.workspace.findMany.mockRejectedValue(error);

      await GetUserWorkspacesSummaryController.getUserWorkspacesSummary(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});