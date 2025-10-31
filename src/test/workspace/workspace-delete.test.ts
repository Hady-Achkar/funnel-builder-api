import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeleteWorkspaceService } from "../../services/workspace/delete";
import { getPrisma } from "../../lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../errors/http-errors";
import { FunnelStatus, DomainStatus } from "../../generated/prisma-client";

vi.mock("../../lib/prisma");

// Mock the Cloudflare API functions - pure API layer, no environment variables
vi.mock("../../cloudflare", () => ({
  deleteWorkspaceSubdomain: vi.fn().mockResolvedValue({
    success: true,
    deleted: ["mock-dns-record-id"],
  }),
}));

describe("Workspace Deletion Tests", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      workspaceMember: {
        deleteMany: vi.fn(),
      },
      workspaceRolePermTemplate: {
        deleteMany: vi.fn(),
      },
      domain: {
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("DeleteWorkspaceService.deleteBySlug", () => {
    it("should successfully delete a workspace when user is owner and workspace is empty", async () => {
      const userId = 1;
      const slug = "test-workspace";
      const mockWorkspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        owner: { id: userId },
        members: [],
        funnels: [],
        domains: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          workspaceRolePermTemplate: {
            deleteMany: vi.fn().mockResolvedValue({}),
          },
          workspaceMember: {
            deleteMany: vi.fn().mockResolvedValue({}),
          },
          workspace: {
            delete: vi.fn().mockResolvedValue(mockWorkspace),
          },
        });
      });

      const result = await DeleteWorkspaceService.deleteBySlug(userId, slug);

      expect(result).toEqual({
        success: true,
        message: "Workspace has been deleted successfully",
      });

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug },
        include: {
          owner: { select: { id: true } },
          members: true,
          funnels: true,
          domains: true,
        },
      });
    });

    it("should throw NotFoundError when workspace does not exist", async () => {
      const userId = 1;
      const slug = "non-existent";

      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        DeleteWorkspaceService.deleteBySlug(userId, slug)
      ).rejects.toThrow(NotFoundError);

      await expect(
        DeleteWorkspaceService.deleteBySlug(userId, slug)
      ).rejects.toThrow("Workspace not found");
    });

    it("should throw ForbiddenError when user is not the owner", async () => {
      const userId = 1;
      const ownerId = 2;
      const slug = "test-workspace";
      const mockWorkspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        owner: { id: ownerId },
        members: [],
        funnels: [],
        domains: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      await expect(
        DeleteWorkspaceService.deleteBySlug(userId, slug)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        DeleteWorkspaceService.deleteBySlug(userId, slug)
      ).rejects.toThrow("Only workspace owner can delete the workspace");
    });

    it("should throw BadRequestError when workspace has existing funnels", async () => {
      const userId = 1;
      const slug = "test-workspace";
      const mockWorkspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        owner: { id: userId },
        members: [],
        funnels: [
          {
            id: 1,
            name: "Test Funnel",
            status: FunnelStatus.LIVE,
          },
        ],
        domains: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      await expect(
        DeleteWorkspaceService.deleteBySlug(userId, slug)
      ).rejects.toThrow(BadRequestError);

      await expect(
        DeleteWorkspaceService.deleteBySlug(userId, slug)
      ).rejects.toThrow(
        "Cannot delete workspace with existing funnels. Please delete all funnels first."
      );
    });

    it("should throw BadRequestError when workspace has existing domains", async () => {
      const userId = 1;
      const slug = "test-workspace";
      const mockWorkspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        owner: { id: userId },
        members: [],
        funnels: [],
        domains: [
          {
            id: 1,
            hostname: "test.digitalsite.com",
            status: DomainStatus.ACTIVE,
          },
        ],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      await expect(
        DeleteWorkspaceService.deleteBySlug(userId, slug)
      ).rejects.toThrow(BadRequestError);

      await expect(
        DeleteWorkspaceService.deleteBySlug(userId, slug)
      ).rejects.toThrow(
        "Cannot delete workspace with existing domains. Please remove all domains first."
      );
    });

    it("should delete workspace members before deleting workspace", async () => {
      const userId = 1;
      const slug = "test-workspace";
      const mockWorkspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        owner: { id: userId },
        members: [
          { id: 1, userId: 2, workspaceId: 1 },
          { id: 2, userId: 3, workspaceId: 1 },
        ],
        funnels: [],
        domains: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const mockTransaction = {
        workspaceRolePermTemplate: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        workspaceMember: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        workspace: {
          delete: vi.fn().mockResolvedValue(mockWorkspace),
        },
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTransaction);
      });

      await DeleteWorkspaceService.deleteBySlug(userId, slug);

      expect(mockTransaction.workspaceMember.deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspace.id },
      });

      expect(mockTransaction.workspace.delete).toHaveBeenCalledWith({
        where: { id: mockWorkspace.id },
      });
    });

    it("should validate slug parameter", async () => {
      const userId = 1;

      await expect(
        DeleteWorkspaceService.deleteBySlug(userId, "")
      ).rejects.toThrow(BadRequestError);

      await expect(
        DeleteWorkspaceService.deleteBySlug(userId, "")
      ).rejects.toThrow("Workspace slug is required");
    });

    it("should handle transaction failures gracefully", async () => {
      const userId = 1;
      const slug = "test-workspace";
      const mockWorkspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        owner: { id: userId },
        members: [],
        funnels: [],
        domains: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.$transaction.mockRejectedValue(new Error("Database error"));

      await expect(
        DeleteWorkspaceService.deleteBySlug(userId, slug)
      ).rejects.toThrow("Database error");
    });

    it("should delete workspace subdomain record from database after deletion", async () => {
      const userId = 1;
      const slug = "test-workspace";
      const mockWorkspace = {
        id: 1,
        name: "Test Workspace",
        slug: slug,
        owner: { id: userId },
        members: [],
        funnels: [],
        domains: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          workspaceRolePermTemplate: {
            deleteMany: vi.fn().mockResolvedValue({}),
          },
          workspaceMember: {
            deleteMany: vi.fn().mockResolvedValue({}),
          },
          workspace: {
            delete: vi.fn().mockResolvedValue(mockWorkspace),
          },
        });
      });

      mockPrisma.domain.deleteMany.mockResolvedValue({ count: 1 });

      await DeleteWorkspaceService.deleteBySlug(userId, slug);

      expect(mockPrisma.domain.deleteMany).toHaveBeenCalledWith({
        where: {
          hostname: `${slug}.${process.env.WORKSPACE_DOMAIN}`,
          type: "WORKSPACE_SUBDOMAIN",
        },
      });
    });

    it("should not fail workspace deletion if DNS cleanup fails", async () => {
      const userId = 1;
      const slug = "test-workspace";
      const mockWorkspace = {
        id: 1,
        name: "Test Workspace",
        slug: slug,
        owner: { id: userId },
        members: [],
        funnels: [],
        domains: [],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          workspaceRolePermTemplate: {
            deleteMany: vi.fn().mockResolvedValue({}),
          },
          workspaceMember: {
            deleteMany: vi.fn().mockResolvedValue({}),
          },
          workspace: {
            delete: vi.fn().mockResolvedValue(mockWorkspace),
          },
        });
      });

      // Mock DNS deletion failure
      const { deleteWorkspaceSubdomain } = await import("../../cloudflare");
      (deleteWorkspaceSubdomain as any).mockResolvedValueOnce({
        success: false,
        deleted: [],
        error: "DNS record not found",
      });

      // Should not throw even if DNS cleanup fails
      const result = await DeleteWorkspaceService.deleteBySlug(userId, slug);

      expect(result).toEqual({
        success: true,
        message: "Workspace has been deleted successfully",
      });
    });
  });
});
