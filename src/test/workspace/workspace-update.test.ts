import { describe, it, expect, beforeEach, vi } from "vitest";
import { UpdateWorkspaceService } from "../../services/workspace/update";
import { UpdateWorkspaceController } from "../../controllers/workspace/update";
import { getPrisma } from "../../lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  HttpError,
} from "../../errors/http-errors";
import { WorkspaceRole, WorkspacePermission } from "../../generated/prisma-client";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";

// Mock the prisma client
vi.mock("../../lib/prisma");

describe("Workspace Update Tests", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      workspaceRolePermTemplate: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("UpdateWorkspaceService", () => {
    describe("General Settings Update", () => {
      it("should allow owner to update workspace name", async () => {
        const requesterId = 1;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          general: {
            name: "New Workspace Name",
          },
        };

        const existingWorkspace = {
          id: 1,
          name: "Old Name",
          slug: workspaceSlug,
          description: null,
          image: null,
          ownerId: requesterId,
          owner: { id: requesterId },
          members: [],
          _count: { funnels: 0, domains: 0 },
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const txMock = {
            workspace: {
              findFirst: vi.fn().mockResolvedValue(null),
              update: vi.fn().mockResolvedValue({
                ...existingWorkspace,
                name: updateData.general.name,
              }),
              findUnique: vi.fn().mockResolvedValue({
                ...existingWorkspace,
                name: updateData.general.name,
                owner: {
                  id: requesterId,
                  firstName: "John",
                  lastName: "Doe",
                  email: "john@example.com",
                  username: "johndoe",
                },
                members: [],
                _count: { funnels: 0, domains: 0 },
              }),
            },
          };
          return callback(txMock);
        });

        const result = await UpdateWorkspaceService.update(requesterId, updateData);

        expect(result.message).toBe("Workspace updated successfully");
        expect(result.workspace.name).toBe("New Workspace Name");
        expect(result.changes.general.updated).toBe(true);
        expect(result.changes.general.fields).toContain("name");
      });

      it("should reject duplicate workspace names", async () => {
        const requesterId = 1;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          general: {
            name: "Existing Name",
          },
        };

        const existingWorkspace = {
          id: 1,
          name: "Old Name",
          slug: workspaceSlug,
          ownerId: requesterId,
          owner: { id: requesterId },
          members: [],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const txMock = {
            workspace: {
              findFirst: vi.fn().mockResolvedValue({
                id: 2,
                name: "Existing Name",
              }),
            },
          };
          return callback(txMock);
        });

        await expect(
          UpdateWorkspaceService.update(requesterId, updateData)
        ).rejects.toThrow(ConflictError);
      });

      it("should allow admin member to update workspace settings", async () => {
        const requesterId = 2;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          general: {
            description: "Updated description",
            image: "https://example.com/image.png",
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: 1,
          owner: { id: 1 },
          members: [
            {
              id: 1,
              userId: requesterId,
              role: WorkspaceRole.ADMIN,
              permissions: [WorkspacePermission.MANAGE_WORKSPACE],
              user: { id: requesterId },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const txMock = {
            workspace: {
              update: vi.fn().mockResolvedValue({
                ...existingWorkspace,
                description: updateData.general.description,
                image: updateData.general.image,
              }),
              findUnique: vi.fn().mockResolvedValue({
                ...existingWorkspace,
                description: updateData.general.description,
                image: updateData.general.image,
                owner: {
                  id: 1,
                  firstName: "Owner",
                  lastName: "User",
                  email: "owner@example.com",
                  username: "owner",
                },
                members: existingWorkspace.members.map(m => ({
                  ...m,
                  user: {
                    id: m.userId,
                    firstName: "Admin",
                    lastName: "User",
                    email: "admin@example.com",
                    username: "admin",
                  },
                })),
                _count: { funnels: 0, domains: 0 },
              }),
            },
          };
          return callback(txMock);
        });

        const result = await UpdateWorkspaceService.update(requesterId, updateData);

        expect(result.message).toBe("Workspace updated successfully");
        expect(result.workspace.description).toBe("Updated description");
        expect(result.workspace.image).toBe("https://example.com/image.png");
        expect(result.changes.general.updated).toBe(true);
        expect(result.changes.general.fields).toContain("description");
        expect(result.changes.general.fields).toContain("image");
      });

      it("should reject updates from members without MANAGE_WORKSPACE permission", async () => {
        const requesterId = 2;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          general: {
            name: "New Name",
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: 1,
          owner: { id: 1 },
          members: [
            {
              id: 1,
              userId: requesterId,
              role: WorkspaceRole.EDITOR,
              permissions: [WorkspacePermission.EDIT_FUNNELS],
              user: { id: requesterId },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          throw new ForbiddenError(
            "You don't have permission to update workspace settings"
          );
        });

        await expect(
          UpdateWorkspaceService.update(requesterId, updateData)
        ).rejects.toThrow(ForbiddenError);
      });
    });

    describe("Member Management", () => {
      it("should allow owner to add new members", async () => {
        const requesterId = 1;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          members: {
            add: [
              {
                email: "newmember@example.com",
                role: WorkspaceRole.EDITOR,
              },
            ],
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: requesterId,
          owner: { id: requesterId },
          members: [],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const txMock = {
            user: {
              findUnique: vi.fn().mockResolvedValue({
                id: 10,
                email: "newmember@example.com",
              }),
            },
            workspaceMember: {
              findUnique: vi.fn().mockResolvedValue(null),
              create: vi.fn().mockResolvedValue({
                id: 2,
                userId: 10,
                workspaceId: 1,
                role: WorkspaceRole.EDITOR,
                permissions: [
                  WorkspacePermission.CREATE_FUNNELS,
                  WorkspacePermission.EDIT_FUNNELS,
                  WorkspacePermission.EDIT_PAGES,
                  WorkspacePermission.VIEW_ANALYTICS,
                ],
              }),
            },
            workspaceRolePermTemplate: {
              findUnique: vi.fn().mockResolvedValue(null),
            },
            workspace: {
              findUnique: vi.fn().mockResolvedValue({
                ...existingWorkspace,
                owner: {
                  id: requesterId,
                  firstName: "Owner",
                  lastName: "User",
                  email: "owner@example.com",
                  username: "owner",
                },
                members: [
                  {
                    id: 2,
                    userId: 10,
                    role: WorkspaceRole.EDITOR,
                    permissions: [
                      WorkspacePermission.CREATE_FUNNELS,
                      WorkspacePermission.EDIT_FUNNELS,
                      WorkspacePermission.EDIT_PAGES,
                      WorkspacePermission.VIEW_ANALYTICS,
                    ],
                    user: {
                      id: 10,
                      firstName: "New",
                      lastName: "Member",
                      email: "newmember@example.com",
                      username: "newmember",
                    },
                  },
                ],
                _count: { funnels: 0, domains: 0 },
              }),
            },
          };
          return callback(txMock);
        });

        const result = await UpdateWorkspaceService.update(requesterId, updateData);

        expect(result.message).toBe("Workspace updated successfully");
        expect(result.workspace.members).toHaveLength(1);
        expect(result.changes.members.added).toContain("newmember@example.com");
      });

      it("should reject adding non-existent users", async () => {
        const requesterId = 1;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          members: {
            add: [
              {
                email: "nonexistent@example.com",
                role: WorkspaceRole.EDITOR,
              },
            ],
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: requesterId,
          owner: { id: requesterId },
          members: [],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const txMock = {
            user: {
              findUnique: vi.fn().mockResolvedValue(null),
            },
          };
          return callback(txMock);
        });

        await expect(
          UpdateWorkspaceService.update(requesterId, updateData)
        ).rejects.toThrow(NotFoundError);
      });

      it("should reject adding duplicate members", async () => {
        const requesterId = 1;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          members: {
            add: [
              {
                email: "existing@example.com",
                role: WorkspaceRole.EDITOR,
              },
            ],
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: requesterId,
          owner: { id: requesterId },
          members: [
            {
              id: 2,
              userId: 10,
              workspaceId: 1,
              role: WorkspaceRole.VIEWER,
              permissions: [],
              user: {
                id: 10,
                email: "existing@example.com",
              },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const txMock = {
            user: {
              findUnique: vi.fn().mockResolvedValue({
                id: 10,
                email: "existing@example.com",
              }),
            },
            workspaceMember: {
              findUnique: vi.fn().mockResolvedValue({
                id: 2,
                userId: 10,
                workspaceId: 1,
              }),
            },
          };
          return callback(txMock);
        });

        await expect(
          UpdateWorkspaceService.update(requesterId, updateData)
        ).rejects.toThrow(ConflictError);
      });

      it("should allow updating member roles and permissions", async () => {
        const requesterId = 1;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          members: {
            update: [
              {
                memberId: 2,
                role: WorkspaceRole.ADMIN,
                permissions: [
                  WorkspacePermission.MANAGE_WORKSPACE,
                  WorkspacePermission.MANAGE_MEMBERS,
                ],
              },
            ],
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: requesterId,
          owner: { id: requesterId },
          members: [
            {
              id: 2,
              userId: 10,
              role: WorkspaceRole.EDITOR,
              permissions: [WorkspacePermission.EDIT_FUNNELS],
              user: {
                id: 10,
                email: "member@example.com",
              },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const txMock = {
            workspaceMember: {
              update: vi.fn().mockResolvedValue({
                id: 2,
                userId: 10,
                role: WorkspaceRole.ADMIN,
                permissions: [
                  WorkspacePermission.MANAGE_WORKSPACE,
                  WorkspacePermission.MANAGE_MEMBERS,
                ],
              }),
            },
            workspaceRolePermTemplate: {
              findUnique: vi.fn().mockResolvedValue(null),
            },
            workspace: {
              findUnique: vi.fn().mockResolvedValue({
                ...existingWorkspace,
                owner: {
                  id: requesterId,
                  firstName: "Owner",
                  lastName: "User",
                  email: "owner@example.com",
                  username: "owner",
                },
                members: [
                  {
                    id: 2,
                    userId: 10,
                    role: WorkspaceRole.ADMIN,
                    permissions: [
                      WorkspacePermission.MANAGE_WORKSPACE,
                      WorkspacePermission.MANAGE_MEMBERS,
                    ],
                    user: {
                      id: 10,
                      firstName: "Member",
                      lastName: "User",
                      email: "member@example.com",
                      username: "member",
                    },
                  },
                ],
                _count: { funnels: 0, domains: 0 },
              }),
            },
          };
          return callback(txMock);
        });

        const result = await UpdateWorkspaceService.update(requesterId, updateData);

        expect(result.message).toBe("Workspace updated successfully");
        expect(result.workspace.members[0].role).toBe(WorkspaceRole.ADMIN);
        expect(result.changes.members.updated).toContain("member@example.com");
        expect(result.changes.permissions.updated).toBe(true);
      });

      it("should prevent changing owner's role", async () => {
        const requesterId = 1;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          members: {
            update: [
              {
                memberId: 1,
                role: WorkspaceRole.EDITOR,
              },
            ],
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: requesterId,
          owner: { id: requesterId },
          members: [
            {
              id: 1,
              userId: requesterId,
              role: WorkspaceRole.ADMIN,
              permissions: [],
              user: { id: requesterId },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          throw new BadRequestError("Cannot change the owner's role");
        });

        await expect(
          UpdateWorkspaceService.update(requesterId, updateData)
        ).rejects.toThrow(BadRequestError);
      });

      it("should prevent admins from promoting members to same level", async () => {
        const requesterId = 2; // Admin user
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          members: {
            update: [
              {
                memberId: 3,
                role: WorkspaceRole.ADMIN,
              },
            ],
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: 1,
          owner: { id: 1 },
          members: [
            {
              id: 2,
              userId: requesterId,
              role: WorkspaceRole.ADMIN,
              permissions: [WorkspacePermission.MANAGE_MEMBERS],
              user: { id: requesterId },
            },
            {
              id: 3,
              userId: 3,
              role: WorkspaceRole.EDITOR,
              permissions: [],
              user: { id: 3 },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          throw new ForbiddenError(
            "Cannot promote member to same or higher level than yourself"
          );
        });

        await expect(
          UpdateWorkspaceService.update(requesterId, updateData)
        ).rejects.toThrow(ForbiddenError);
      });

      it("should allow removing members", async () => {
        const requesterId = 1;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          members: {
            remove: [2],
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: requesterId,
          owner: { id: requesterId },
          members: [
            {
              id: 2,
              userId: 10,
              role: WorkspaceRole.EDITOR,
              permissions: [],
              user: {
                id: 10,
                email: "member@example.com",
              },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const txMock = {
            workspaceMember: {
              delete: vi.fn().mockResolvedValue({}),
            },
            workspace: {
              findUnique: vi.fn().mockResolvedValue({
                ...existingWorkspace,
                owner: {
                  id: requesterId,
                  firstName: "Owner",
                  lastName: "User",
                  email: "owner@example.com",
                  username: "owner",
                },
                members: [],
                _count: { funnels: 0, domains: 0 },
              }),
            },
          };
          return callback(txMock);
        });

        const result = await UpdateWorkspaceService.update(requesterId, updateData);

        expect(result.message).toBe("Workspace updated successfully");
        expect(result.workspace.members).toHaveLength(0);
        expect(result.changes.members.removed).toContain("member@example.com");
      });

      it("should prevent removing the workspace owner", async () => {
        const requesterId = 1;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          members: {
            remove: [1],
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: requesterId,
          owner: { id: requesterId },
          members: [
            {
              id: 1,
              userId: requesterId,
              role: WorkspaceRole.ADMIN,
              permissions: [],
              user: { id: requesterId },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          throw new BadRequestError("Cannot remove the workspace owner");
        });

        await expect(
          UpdateWorkspaceService.update(requesterId, updateData)
        ).rejects.toThrow(BadRequestError);
      });

      it("should prevent members from removing themselves", async () => {
        const requesterId = 2;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          members: {
            remove: [2],
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: 1,
          owner: { id: 1 },
          members: [
            {
              id: 2,
              userId: requesterId,
              role: WorkspaceRole.ADMIN,
              permissions: [WorkspacePermission.MANAGE_MEMBERS],
              user: { id: requesterId },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          throw new BadRequestError("Cannot remove yourself from the workspace");
        });

        await expect(
          UpdateWorkspaceService.update(requesterId, updateData)
        ).rejects.toThrow(BadRequestError);
      });
    });

    describe("Role Permission Templates", () => {
      it("should update permissions for all members with specified role", async () => {
        const requesterId = 1;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          rolePermissions: {
            role: WorkspaceRole.EDITOR,
            permissions: [
              WorkspacePermission.CREATE_FUNNELS,
              WorkspacePermission.EDIT_FUNNELS,
              WorkspacePermission.DELETE_FUNNELS,
            ],
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: requesterId,
          owner: { id: requesterId },
          members: [
            {
              id: 2,
              userId: 10,
              role: WorkspaceRole.EDITOR,
              permissions: [WorkspacePermission.EDIT_FUNNELS],
              user: { id: 10 },
            },
            {
              id: 3,
              userId: 11,
              role: WorkspaceRole.EDITOR,
              permissions: [WorkspacePermission.EDIT_FUNNELS],
              user: { id: 11 },
            },
            {
              id: 4,
              userId: 12,
              role: WorkspaceRole.VIEWER,
              permissions: [],
              user: { id: 12 },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const txMock = {
            workspaceMember: {
              update: vi.fn().mockResolvedValue({}),
            },
            workspaceRolePermTemplate: {
              upsert: vi.fn().mockResolvedValue({}),
            },
            workspace: {
              findUnique: vi.fn().mockResolvedValue({
                ...existingWorkspace,
                owner: {
                  id: requesterId,
                  firstName: "Owner",
                  lastName: "User",
                  email: "owner@example.com",
                  username: "owner",
                },
                members: [
                  {
                    id: 2,
                    userId: 10,
                    role: WorkspaceRole.EDITOR,
                    permissions: updateData.rolePermissions!.permissions,
                    user: {
                      id: 10,
                      firstName: "Editor1",
                      lastName: "User",
                      email: "editor1@example.com",
                      username: "editor1",
                    },
                  },
                  {
                    id: 3,
                    userId: 11,
                    role: WorkspaceRole.EDITOR,
                    permissions: updateData.rolePermissions!.permissions,
                    user: {
                      id: 11,
                      firstName: "Editor2",
                      lastName: "User",
                      email: "editor2@example.com",
                      username: "editor2",
                    },
                  },
                  {
                    id: 4,
                    userId: 12,
                    role: WorkspaceRole.VIEWER,
                    permissions: [],
                    user: {
                      id: 12,
                      firstName: "Viewer",
                      lastName: "User",
                      email: "viewer@example.com",
                      username: "viewer",
                    },
                  },
                ],
                _count: { funnels: 0, domains: 0 },
              }),
            },
          };
          return callback(txMock);
        });

        const result = await UpdateWorkspaceService.update(requesterId, updateData);

        expect(result.message).toBe("Workspace updated successfully");
        expect(result.changes.permissions.updated).toBe(true);
        expect(result.changes.permissions.affectedMembers).toContain(10);
        expect(result.changes.permissions.affectedMembers).toContain(11);
        expect(result.changes.permissions.affectedMembers).not.toContain(12);
      });
    });

    describe("Comprehensive Updates", () => {
      it("should handle multiple update operations in single request", async () => {
        const requesterId = 1;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          general: {
            name: "Updated Name",
            description: "Updated description",
          },
          members: {
            add: [
              {
                email: "newuser@example.com",
                role: WorkspaceRole.EDITOR,
              },
            ],
            update: [
              {
                memberId: 2,
                role: WorkspaceRole.ADMIN,
              },
            ],
            remove: [3],
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          name: "Old Name",
          description: "Old description",
          image: null,
          ownerId: requesterId,
          owner: { id: requesterId },
          members: [
            {
              id: 2,
              userId: 10,
              role: WorkspaceRole.EDITOR,
              permissions: [],
              user: {
                id: 10,
                email: "existing@example.com",
              },
            },
            {
              id: 3,
              userId: 11,
              role: WorkspaceRole.VIEWER,
              permissions: [],
              user: {
                id: 11,
                email: "toremove@example.com",
              },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          const txMock = {
            workspace: {
              findFirst: vi.fn().mockResolvedValue(null),
              update: vi.fn().mockResolvedValue({}),
              findUnique: vi.fn().mockResolvedValue({
                id: 1,
                slug: workspaceSlug,
                name: "Updated Name",
                description: "Updated description",
                image: null,
                ownerId: requesterId,
                owner: {
                  id: requesterId,
                  firstName: "Owner",
                  lastName: "User",
                  email: "owner@example.com",
                  username: "owner",
                },
                members: [
                  {
                    id: 2,
                    userId: 10,
                    role: WorkspaceRole.ADMIN,
                    permissions: [
                      WorkspacePermission.MANAGE_WORKSPACE,
                      WorkspacePermission.MANAGE_MEMBERS,
                    ],
                    user: {
                      id: 10,
                      firstName: "Existing",
                      lastName: "User",
                      email: "existing@example.com",
                      username: "existing",
                    },
                  },
                  {
                    id: 4,
                    userId: 12,
                    role: WorkspaceRole.EDITOR,
                    permissions: [
                      WorkspacePermission.CREATE_FUNNELS,
                      WorkspacePermission.EDIT_FUNNELS,
                    ],
                    user: {
                      id: 12,
                      firstName: "New",
                      lastName: "User",
                      email: "newuser@example.com",
                      username: "newuser",
                    },
                  },
                ],
                _count: { funnels: 0, domains: 0 },
              }),
            },
            user: {
              findUnique: vi.fn().mockResolvedValue({
                id: 12,
                email: "newuser@example.com",
              }),
            },
            workspaceMember: {
              findUnique: vi.fn().mockResolvedValue(null),
              create: vi.fn().mockResolvedValue({}),
              update: vi.fn().mockResolvedValue({}),
              delete: vi.fn().mockResolvedValue({}),
            },
            workspaceRolePermTemplate: {
              findUnique: vi.fn().mockResolvedValue(null),
            },
          };
          return callback(txMock);
        });

        const result = await UpdateWorkspaceService.update(requesterId, updateData);

        expect(result.message).toBe("Workspace updated successfully");
        expect(result.workspace.name).toBe("Updated Name");
        expect(result.workspace.description).toBe("Updated description");
        expect(result.changes.general.updated).toBe(true);
        expect(result.changes.members.added).toContain("newuser@example.com");
        expect(result.changes.members.updated).toContain("existing@example.com");
        expect(result.changes.members.removed).toContain("toremove@example.com");
      });
    });

    describe("Error Handling", () => {
      it("should throw NotFoundError for non-existent workspace", async () => {
        const requesterId = 1;
        const updateData = {
          workspaceSlug: "non-existent",
          general: {
            name: "New Name",
          },
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(null);

        await expect(
          UpdateWorkspaceService.update(requesterId, updateData)
        ).rejects.toThrow(NotFoundError);
      });

      it("should throw ForbiddenError for non-members", async () => {
        const requesterId = 999;
        const workspaceSlug = "test-workspace";
        const updateData = {
          workspaceSlug,
          general: {
            name: "New Name",
          },
        };

        const existingWorkspace = {
          id: 1,
          slug: workspaceSlug,
          ownerId: 1,
          owner: { id: 1 },
          members: [],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(existingWorkspace);

        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
          throw new ForbiddenError("You don't have access to this workspace");
        });

        await expect(
          UpdateWorkspaceService.update(requesterId, updateData)
        ).rejects.toThrow(ForbiddenError);
      });

      it("should handle validation errors properly", async () => {
        const requesterId = 1;
        const updateData = {
          workspaceSlug: "test-workspace",
          general: {
            name: "A", // Too short
          },
        };

        await expect(
          UpdateWorkspaceService.update(requesterId, updateData)
        ).rejects.toThrow(BadRequestError);
      });
    });
  });

  describe("UpdateWorkspaceController", () => {
    it("should return 200 on successful update", async () => {
      const mockReq = {
        userId: 1,
        params: { slug: "test-workspace" },
        body: {
          general: {
            name: "Updated Name",
          },
        },
      } as unknown as AuthRequest;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as unknown as NextFunction;

      const mockResult = {
        message: "Workspace updated successfully",
        workspace: {
          id: 1,
          name: "Updated Name",
          slug: "test-workspace",
        },
        changes: {
          general: {
            updated: true,
            fields: ["name"],
          },
        },
      };

      vi.spyOn(UpdateWorkspaceService, "update").mockResolvedValue(
        mockResult as any
      );

      await UpdateWorkspaceController.update(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it("should return proper error status for HttpErrors", async () => {
      const mockReq = {
        userId: 1,
        params: { slug: "test-workspace" },
        body: {
          general: {
            name: "Updated Name",
          },
        },
      } as unknown as AuthRequest;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as unknown as NextFunction;

      vi.spyOn(UpdateWorkspaceService, "update").mockRejectedValue(
        new ForbiddenError("You don't have permission")
      );

      await UpdateWorkspaceController.update(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "You don't have permission",
      });
    });

    it("should call next for non-HttpErrors", async () => {
      const mockReq = {
        userId: 1,
        params: { slug: "test-workspace" },
        body: {},
      } as unknown as AuthRequest;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as unknown as NextFunction;

      const genericError = new Error("Database error");
      vi.spyOn(UpdateWorkspaceService, "update").mockRejectedValue(genericError);

      await UpdateWorkspaceController.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(genericError);
    });
  });
});