import { describe, it, expect, beforeEach, vi } from "vitest";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { getAllWorkspaces } from "../../services/workspace/get-all";
import { getAllWorkspacesController } from "../../controllers/workspace/get-all";
import { getPrisma } from "../../lib/prisma";
import {
  WorkspaceRole,
  WorkspacePermission,
  MembershipStatus,
} from "../../generated/prisma-client";

// Mock dependencies
vi.mock("../../lib/prisma");

describe("Get All Workspaces Tests", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findMany: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("getAllWorkspaces Service", () => {
    describe("Search Functionality", () => {
      it("should search workspaces by name (case-insensitive)", async () => {
        const userId = 1;

        const mockWorkspaces = [
          {
            id: 1,
            name: "Marketing Workspace",
            slug: "marketing-workspace",
            description: "Marketing team workspace",
            image: null,
            ownerId: 1,
            createdAt: new Date("2024-01-01"),
            members: [],
            owner: {
              id: 1,
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              username: "johndoe",
            },
            _count: {
              funnels: 5,
              members: 1,
              domains: 3,
            },
          },
        ];

        mockPrisma.workspace.findMany.mockResolvedValue(mockWorkspaces);

        const result = await getAllWorkspaces(userId, {
          search: "marketing",
        });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Marketing Workspace");
        expect(result.length).toBe(1);
      });

      it("should search workspaces by slug (case-insensitive)", async () => {
        const userId = 1;

        const mockWorkspaces = [
          {
            id: 1,
            name: "Test Workspace",
            slug: "test-workspace",
            description: null,
            image: null,
            ownerId: 1,
            createdAt: new Date("2024-01-01"),
            members: [],
            owner: {
              id: 1,
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              username: "johndoe",
            },
            _count: {
              funnels: 2,
              members: 1,
              domains: 1,
            },
          },
        ];

        mockPrisma.workspace.findMany.mockResolvedValue(mockWorkspaces);

        const result = await getAllWorkspaces(userId, {
          search: "TEST",
        });

        expect(result).toHaveLength(1);
        expect(result[0].slug).toBe("test-workspace");
      });

      it("should return empty array when search yields no results", async () => {
        const userId = 1;
        mockPrisma.workspace.findMany.mockResolvedValue([]);

        const result = await getAllWorkspaces(userId, {
          search: "nonexistent",
        });

        expect(result).toHaveLength(0);
        expect(result.length).toBe(0);
      });
    });

    describe("Successful Scenarios", () => {
      it("should return workspaces from database", async () => {
        const userId = 1;

        const mockWorkspaces = [
          {
            id: 1,
            name: "Workspace One",
            slug: "workspace-one",
            description: "First workspace",
            image: "https://example.com/workspace1.jpg",
            ownerId: 1,
            createdAt: new Date("2024-01-01"),
            members: [
              {
                userId: 2,
                role: WorkspaceRole.EDITOR,
                permissions: [WorkspacePermission.EDIT_FUNNELS],
                status: MembershipStatus.ACTIVE,
                user: {
                  id: 2,
                  firstName: "Jane",
                  lastName: "Smith",
                  email: "jane@example.com",
                  username: "janesmith",
                },
              },
            ],
            owner: {
              id: 1,
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              username: "johndoe",
            },
            _count: {
              funnels: 5,
              members: 2,
              domains: 3,
            },
          },
          {
            id: 2,
            name: "Workspace Two",
            slug: "workspace-two",
            description: null,
            image: null,
            ownerId: 2,
            createdAt: new Date("2024-01-15"),
            members: [
              {
                userId: 1,
                role: WorkspaceRole.ADMIN,
                permissions: [
                  WorkspacePermission.MANAGE_WORKSPACE,
                  WorkspacePermission.MANAGE_MEMBERS,
                ],
                status: MembershipStatus.ACTIVE,
                user: {
                  id: 1,
                  firstName: "John",
                  lastName: "Doe",
                  email: "john@example.com",
                  username: "johndoe",
                },
              },
            ],
            owner: {
              id: 2,
              firstName: "Jane",
              lastName: "Smith",
              email: "jane@example.com",
              username: "janesmith",
            },
            _count: {
              funnels: 2,
              members: 2,
              domains: 1,
            },
          },
        ];

        mockPrisma.workspace.findMany.mockResolvedValue(mockWorkspaces);

        const result = await getAllWorkspaces(userId, {});

        // Verify database query
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
            description: true,
            image: true,
            ownerId: true,
            createdAt: true,
            members: {
              select: {
                userId: true,
                role: true,
                permissions: true,
                status: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    username: true,
                  },
                },
              },
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
              },
            },
            _count: {
              select: {
                funnels: true,
                members: true,
                domains: true,
              },
            },
          },
        });

        // Verify response structure
        expect(result).toHaveLength(2);
        expect(result.length).toBe(2);

        // First workspace (user is owner)
        expect(result[0]).toEqual({
          id: 1,
          name: "Workspace One",
          slug: "workspace-one",
          description: "First workspace",
          image: "https://example.com/workspace1.jpg",
          role: WorkspaceRole.OWNER,
          permissions: Object.values(WorkspacePermission),
          owner: {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            username: "johndoe",
          },
          members: [
            {
              id: 1,
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              username: "johndoe",
              role: WorkspaceRole.OWNER,
              permissions: Object.values(WorkspacePermission),
              status: MembershipStatus.ACTIVE,
            },
            {
              id: 2,
              firstName: "Jane",
              lastName: "Smith",
              email: "jane@example.com",
              username: "janesmith",
              role: WorkspaceRole.EDITOR,
              permissions: [WorkspacePermission.EDIT_FUNNELS],
              status: MembershipStatus.ACTIVE,
            },
          ],
          memberCount: 2,
          funnelCount: 5,
          domainCount: 3,
          createdAt: new Date("2024-01-01"),
        });

        // Second workspace (user is member)
        expect(result[1]).toEqual({
          id: 2,
          name: "Workspace Two",
          slug: "workspace-two",
          description: null,
          image: null,
          role: WorkspaceRole.ADMIN,
          permissions: [
            WorkspacePermission.MANAGE_WORKSPACE,
            WorkspacePermission.MANAGE_MEMBERS,
          ],
          owner: {
            id: 2,
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
            username: "janesmith",
          },
          members: [
            {
              id: 2,
              firstName: "Jane",
              lastName: "Smith",
              email: "jane@example.com",
              username: "janesmith",
              role: WorkspaceRole.OWNER,
              permissions: Object.values(WorkspacePermission),
              status: MembershipStatus.ACTIVE,
            },
            {
              id: 1,
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              username: "johndoe",
              role: WorkspaceRole.ADMIN,
              permissions: [
                WorkspacePermission.MANAGE_WORKSPACE,
                WorkspacePermission.MANAGE_MEMBERS,
              ],
              status: MembershipStatus.ACTIVE,
            },
          ],
          memberCount: 2,
          funnelCount: 2,
          domainCount: 1,
          createdAt: new Date("2024-01-15"),
        });
      });

      it("should handle workspaces with null image field", async () => {
        const userId = 1;

        const mockWorkspace = {
          id: 1,
          name: "No Image Workspace",
          slug: "no-image",
          description: "Workspace without image",
          image: null,
          ownerId: 1,
          createdAt: new Date("2024-01-01"),
          members: [],
          owner: {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            username: "johndoe",
          },
          _count: {
            funnels: 0,
            members: 1,
            domains: 0,
          },
        };

        mockPrisma.workspace.findMany.mockResolvedValue([mockWorkspace]);

        const result = await getAllWorkspaces(userId);

        expect(result[0].image).toBeNull();
        expect(result[0]).toHaveProperty("image");
      });

      it("should return empty array when user has no workspaces", async () => {
        const userId = 1;

        mockPrisma.workspace.findMany.mockResolvedValue([]);

        const result = await getAllWorkspaces(userId);

        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });
    });

    describe("Error Scenarios", () => {
      it("should throw error when userId is not provided", async () => {
        await expect(getAllWorkspaces(null as any)).rejects.toThrow(
          "User ID is required"
        );

        expect(mockPrisma.workspace.findMany).not.toHaveBeenCalled();
      });
    });
  });

  describe("getAllWorkspacesController", () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        userId: 1,
        query: {},
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it("should return 200 with workspaces data", async () => {
      mockPrisma.workspace.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Test Workspace",
          slug: "test-workspace",
          description: null,
          image: "https://example.com/test.jpg",
          ownerId: 1,
          createdAt: new Date("2024-01-01"),
          members: [],
          owner: {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            username: "johndoe",
          },
          _count: {
            funnels: 0,
            members: 1,
            domains: 0,
          },
        },
      ]);

      await getAllWorkspacesController(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.any(Array));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when userId is missing", async () => {
      mockReq.userId = undefined;

      await getAllWorkspacesController(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Please log in to view workspaces",
        })
      );
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should pass service errors to next middleware", async () => {
      const error = new Error("Database connection failed");
      mockPrisma.workspace.findMany.mockRejectedValue(error);

      await getAllWorkspacesController(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
