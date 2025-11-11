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

        const result = await GetUserWorkspacesSummaryService.getUserWorkspacesSummary(userId, {});

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
            AND: [
              {
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

        const result = await GetUserWorkspacesSummaryService.getUserWorkspacesSummary(userId, {});

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

        const result = await GetUserWorkspacesSummaryService.getUserWorkspacesSummary(userId, {});

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

        const result = await GetUserWorkspacesSummaryService.getUserWorkspacesSummary(userId, {});

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
        query: {},
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

  describe("Search Functionality", () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        userId,
        query: {},
      };
      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it("should search by workspace name", async () => {
      mockRequest.query = { search: "Marketing" };

      const workspacesData = [
        {
          id: 1,
          name: "Marketing Team",
          slug: "marketing-team",
          image: "https://example.com/marketing.png",
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

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({
                    name: expect.objectContaining({
                      contains: "Marketing",
                      mode: "insensitive",
                    }),
                  }),
                ]),
              }),
            ]),
          }),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([
        {
          id: 1,
          name: "Marketing Team",
          slug: "marketing-team",
          image: "https://example.com/marketing.png",
          role: WorkspaceRole.OWNER,
        },
      ]);
    });

    it("should search by workspace slug", async () => {
      mockRequest.query = { search: "dev-team" };

      const workspacesData = [
        {
          id: 2,
          name: "Development",
          slug: "dev-team",
          image: "https://example.com/dev.png",
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

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({
                    slug: expect.objectContaining({
                      contains: "dev-team",
                      mode: "insensitive",
                    }),
                  }),
                ]),
              }),
            ]),
          }),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should search case-insensitively", async () => {
      mockRequest.query = { search: "SALES" };

      const workspacesData = [
        {
          id: 3,
          name: "sales team",
          slug: "sales-team",
          image: "https://example.com/sales.png",
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

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({
                    name: expect.objectContaining({
                      contains: "SALES",
                      mode: "insensitive",
                    }),
                  }),
                ]),
              }),
            ]),
          }),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([
        {
          id: 3,
          name: "sales team",
          slug: "sales-team",
          image: "https://example.com/sales.png",
          role: WorkspaceRole.OWNER,
        },
      ]);
    });

    it("should return empty array when search finds no matches", async () => {
      mockRequest.query = { search: "nonexistent" };

      mockPrisma.workspace.findMany.mockResolvedValue([]);

      await GetUserWorkspacesSummaryController.getUserWorkspacesSummary(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it("should return all workspaces when no search provided", async () => {
      mockRequest.query = {};

      const workspacesData = [
        {
          id: 1,
          name: "Workspace 1",
          slug: "workspace-1",
          image: "https://example.com/1.png",
          ownerId: userId,
          members: [],
        },
        {
          id: 2,
          name: "Workspace 2",
          slug: "workspace-2",
          image: "https://example.com/2.png",
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

      // Verify search is not in the where clause
      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.not.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({
                    name: expect.anything(),
                  }),
                ]),
              }),
            ]),
          }),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([
        {
          id: 1,
          name: "Workspace 1",
          slug: "workspace-1",
          image: "https://example.com/1.png",
          role: WorkspaceRole.OWNER,
        },
        {
          id: 2,
          name: "Workspace 2",
          slug: "workspace-2",
          image: "https://example.com/2.png",
          role: WorkspaceRole.OWNER,
        },
      ]);
    });
  });
});