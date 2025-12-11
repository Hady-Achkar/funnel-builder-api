import { describe, it, expect, beforeEach, vi } from "vitest";
import { configureWorkspace } from "../../services/workspace/configure";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../errors/http-errors";
import { WorkspaceRole, WorkspacePermission } from "../../generated/prisma-client";

// Mock the prisma client
vi.mock("../../lib/prisma");

describe("Workspace Configuration Tests", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("Role management without allocations", () => {
    it("should allow owner to change member roles", async () => {
      const requesterId = 1;
      const memberId = 2;
      const workspaceId = 1;

      const configData = {
        workspaceSlug: "test-workspace",
        memberId,
        newRole: WorkspaceRole.ADMIN,
      };

      // Mock workspace
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Test Workspace",
        ownerId: requesterId,
      });

      // Mock target member
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 10,
        userId: memberId,
        role: WorkspaceRole.VIEWER,
        permissions: [],
        joinedAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: memberId,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      });

      // Mock update
      mockPrisma.workspaceMember.update.mockResolvedValue({
        id: 10,
        role: WorkspaceRole.ADMIN,
      });

      const result = await configureWorkspace(requesterId, configData);

      expect(result.message).toBe("Workspace configuration updated successfully");
      expect(mockPrisma.workspaceMember.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { role: WorkspaceRole.ADMIN },
      });
    });

    it("should prevent non-owners from changing owner role", async () => {
      const requesterId = 2;
      const ownerId = 1;
      const workspaceId = 1;

      const configData = {
        workspaceSlug: "test-workspace",
        memberId: ownerId,
        newRole: WorkspaceRole.EDITOR,
      };

      // Mock workspace
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Test Workspace",
        ownerId: ownerId,
      });

      // Mock requester as ADMIN
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId_workspaceId: {
          userId: requesterId,
          workspaceId,
        },
        role: WorkspaceRole.ADMIN,
        permissions: [WorkspacePermission.MANAGE_MEMBERS],
      });

      await expect(
        configureWorkspace(requesterId, configData)
      ).rejects.toThrow(NotFoundError);
    });

    it("should not include allocation fields in configuration", async () => {
      const requesterId = 1;
      const memberId = 2;
      const workspaceId = 1;

      const configData = {
        workspaceSlug: "test-workspace",
        memberId,
        addPermissions: [WorkspacePermission.CREATE_FUNNELS],
        // No allocations field
      };

      // Mock workspace without allocation fields
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Test Workspace",
        ownerId: requesterId,
        // No allocation fields
      });

      // Mock target member
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 10,
        userId: memberId,
        role: WorkspaceRole.VIEWER,
        permissions: [],
        joinedAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: memberId,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      });

      // Mock update
      mockPrisma.workspaceMember.update.mockResolvedValue({
        id: 10,
        permissions: [WorkspacePermission.CREATE_FUNNELS],
      });

      const result = await configureWorkspace(requesterId, configData);

      expect(result.message).toBe("Workspace configuration updated successfully");

      // Verify workspace query doesn't request allocation fields
      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: "test-workspace" },
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      });
    });
  });

  describe("Permission management", () => {
    it("should allow adding permissions to members", async () => {
      const requesterId = 1;
      const memberId = 2;
      const workspaceId = 1;

      const configData = {
        workspaceSlug: "test-workspace",
        memberId,
        addPermissions: [
          WorkspacePermission.CREATE_FUNNELS,
          WorkspacePermission.EDIT_FUNNELS,
        ],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Test Workspace",
        ownerId: requesterId,
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 10,
        userId: memberId,
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.VIEW_ANALYTICS],
        joinedAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: memberId,
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
        },
      });

      mockPrisma.workspaceMember.update.mockResolvedValue({});

      await configureWorkspace(requesterId, configData);

      expect(mockPrisma.workspaceMember.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          permissions: [
            WorkspacePermission.VIEW_ANALYTICS,
            WorkspacePermission.CREATE_FUNNELS,
            WorkspacePermission.EDIT_FUNNELS,
          ],
        },
      });
    });

    it("should allow removing permissions from members", async () => {
      const requesterId = 1;
      const memberId = 2;
      const workspaceId = 1;

      const configData = {
        workspaceSlug: "test-workspace",
        memberId,
        removePermissions: [WorkspacePermission.DELETE_FUNNELS],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Test Workspace",
        ownerId: requesterId,
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 10,
        userId: memberId,
        role: WorkspaceRole.EDITOR,
        permissions: [
          WorkspacePermission.CREATE_FUNNELS,
          WorkspacePermission.EDIT_FUNNELS,
          WorkspacePermission.DELETE_FUNNELS,
        ],
        joinedAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: memberId,
          firstName: "Bob",
          lastName: "Johnson",
          email: "bob@example.com",
        },
      });

      mockPrisma.workspaceMember.update.mockResolvedValue({});

      await configureWorkspace(requesterId, configData);

      expect(mockPrisma.workspaceMember.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          permissions: [
            WorkspacePermission.CREATE_FUNNELS,
            WorkspacePermission.EDIT_FUNNELS,
          ],
        },
      });
    });
  });

  describe("Role hierarchy validation", () => {
    it("should prevent EDITOR from modifying ADMIN role", async () => {
      const requesterId = 2;
      const adminId = 3;
      const workspaceId = 1;

      const configData = {
        workspaceSlug: "test-workspace",
        memberId: adminId,
        newRole: WorkspaceRole.VIEWER,
      };

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Test Workspace",
        ownerId: 999, // Different owner
      });

      // Requester is EDITOR
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId_workspaceId: {
          userId: requesterId,
          workspaceId,
        },
        role: WorkspaceRole.EDITOR,
        permissions: [],
      });

      // Target is ADMIN
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 20,
        userId: adminId,
        role: WorkspaceRole.ADMIN,
        permissions: [],
        joinedAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: adminId,
          firstName: "Admin",
          lastName: "User",
          email: "admin@example.com",
        },
      });

      await expect(
        configureWorkspace(requesterId, configData)
      ).rejects.toThrow(ForbiddenError);
    });

    it("should allow ADMIN to modify EDITOR role", async () => {
      const requesterId = 2;
      const editorId = 3;
      const workspaceId = 1;

      const configData = {
        workspaceSlug: "test-workspace",
        memberId: editorId,
        newRole: WorkspaceRole.VIEWER,
      };

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Test Workspace",
        ownerId: 999,
      });

      // Requester is ADMIN
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId_workspaceId: {
          userId: requesterId,
          workspaceId,
        },
        role: WorkspaceRole.ADMIN,
        permissions: [WorkspacePermission.MANAGE_MEMBERS],
      });

      // Target is EDITOR
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 30,
        userId: editorId,
        role: WorkspaceRole.EDITOR,
        permissions: [],
        joinedAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: editorId,
          firstName: "Editor",
          lastName: "User",
          email: "editor@example.com",
        },
      });

      mockPrisma.workspaceMember.update.mockResolvedValue({});

      await configureWorkspace(requesterId, configData);

      expect(mockPrisma.workspaceMember.update).toHaveBeenCalledWith({
        where: { id: 30 },
        data: { role: WorkspaceRole.VIEWER },
      });
    });
  });
});