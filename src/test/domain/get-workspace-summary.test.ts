import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GetWorkspaceDomainsSummaryService } from "../../services/domain/get-workspace-summary";
import { GetWorkspaceDomainsSummaryController } from "../../controllers/domain/get-workspace-summary";
import { getPrisma } from "../../lib/prisma";
import { NotFoundError, ForbiddenError } from "../../errors/http-errors";
import {
  WorkspaceRole,
  WorkspacePermission,
} from "../../generated/prisma-client";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";

vi.mock("../../lib/prisma");

describe("Get Workspace Domains Summary Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const workspaceSlug = "test-workspace";

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
      domain: {
        findMany: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GetWorkspaceDomainsSummaryService", () => {
    describe("Success Cases", () => {
      it("should return domains with only id and hostname for workspace owner", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: userId,
        };

        const domainsData = [
          {
            id: 1,
            hostname: "example.com",
          },
          {
            id: 2,
            hostname: "test.com",
          },
        ];

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.domain.findMany.mockResolvedValue(domainsData);

        const result =
          await GetWorkspaceDomainsSummaryService.getWorkspaceDomainsSummary(
            userId,
            { workspaceSlug }
          );

        expect(result).toEqual([
          { id: 1, hostname: "example.com" },
          { id: 2, hostname: "test.com" },
        ]);

        expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
          where: { slug: workspaceSlug },
        });

        expect(mockPrisma.workspaceMember.findUnique).not.toHaveBeenCalled();

        expect(mockPrisma.domain.findMany).toHaveBeenCalledWith({
          where: { workspaceId: 1 },
          select: {
            id: true,
            hostname: true,
          },
          orderBy: { createdAt: "desc" },
        });
      });

      it("should return domains for workspace admin", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: 999, // Different owner
        };

        const memberData = {
          userId,
          workspaceId: 1,
          role: WorkspaceRole.ADMIN,
          permissions: [],
        };

        const domainsData = [
          {
            id: 1,
            hostname: "example.com",
          },
        ];

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberData);
        mockPrisma.domain.findMany.mockResolvedValue(domainsData);

        const result =
          await GetWorkspaceDomainsSummaryService.getWorkspaceDomainsSummary(
            userId,
            { workspaceSlug }
          );

        expect(result).toEqual([{ id: 1, hostname: "example.com" }]);
      });

      it("should return domains for user with MANAGE_DOMAINS permission", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: 999, // Different owner
        };

        const memberData = {
          userId,
          workspaceId: 1,
          role: WorkspaceRole.EDITOR,
          permissions: [WorkspacePermission.MANAGE_DOMAINS],
        };

        const domainsData = [
          {
            id: 1,
            hostname: "example.com",
          },
        ];

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberData);
        mockPrisma.domain.findMany.mockResolvedValue(domainsData);

        const result =
          await GetWorkspaceDomainsSummaryService.getWorkspaceDomainsSummary(
            userId,
            { workspaceSlug }
          );

        expect(result).toEqual([{ id: 1, hostname: "example.com" }]);
      });

      it("should return empty array when no domains exist", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: userId,
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.domain.findMany.mockResolvedValue([]);

        const result =
          await GetWorkspaceDomainsSummaryService.getWorkspaceDomainsSummary(
            userId,
            { workspaceSlug }
          );

        expect(result).toEqual([]);
      });

      it("should filter domains by search query (case-insensitive)", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: userId,
        };

        const domainsData = [
          {
            id: 1,
            hostname: "example.com",
          },
        ];

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.domain.findMany.mockResolvedValue(domainsData);

        const result =
          await GetWorkspaceDomainsSummaryService.getWorkspaceDomainsSummary(
            userId,
            { workspaceSlug, search: "example" }
          );

        expect(result).toEqual([{ id: 1, hostname: "example.com" }]);

        expect(mockPrisma.domain.findMany).toHaveBeenCalledWith({
          where: {
            workspaceId: 1,
            hostname: {
              contains: "example",
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            hostname: true,
          },
          orderBy: { createdAt: "desc" },
        });
      });

      it("should return empty array when search matches no domains", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: userId,
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.domain.findMany.mockResolvedValue([]);

        const result =
          await GetWorkspaceDomainsSummaryService.getWorkspaceDomainsSummary(
            userId,
            { workspaceSlug, search: "nonexistent" }
          );

        expect(result).toEqual([]);
      });
    });

    describe("Error Cases", () => {
      it("should throw NotFoundError when workspace does not exist", async () => {
        mockPrisma.workspace.findUnique.mockResolvedValue(null);

        await expect(
          GetWorkspaceDomainsSummaryService.getWorkspaceDomainsSummary(userId, {
            workspaceSlug,
          })
        ).rejects.toThrow(NotFoundError);

        expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
          where: { slug: workspaceSlug },
        });
      });

      it("should throw ForbiddenError when user is not a workspace member", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: 999, // Different owner
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

        await expect(
          GetWorkspaceDomainsSummaryService.getWorkspaceDomainsSummary(userId, {
            workspaceSlug,
          })
        ).rejects.toThrow(ForbiddenError);
      });

      it("should throw ForbiddenError when user lacks MANAGE_DOMAINS permission", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: 999, // Different owner
        };

        const memberData = {
          userId,
          workspaceId: 1,
          role: WorkspaceRole.VIEWER,
          permissions: [], // No MANAGE_DOMAINS permission
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberData);

        await expect(
          GetWorkspaceDomainsSummaryService.getWorkspaceDomainsSummary(userId, {
            workspaceSlug,
          })
        ).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe("GetWorkspaceDomainsSummaryController", () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        userId,
        params: { workspaceSlug },
        query: {},
      };
      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it("should return 200 with domains data on success", async () => {
      const workspaceData = {
        id: 1,
        slug: workspaceSlug,
        ownerId: userId,
      };

      const domainsData = [
        {
          id: 1,
          hostname: "example.com",
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.domain.findMany.mockResolvedValue(domainsData);

      await GetWorkspaceDomainsSummaryController.getWorkspaceDomainsSummary(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([{ id: 1, hostname: "example.com" }]);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error when service throws", async () => {
      const error = new NotFoundError("Workspace not found");
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await GetWorkspaceDomainsSummaryController.getWorkspaceDomainsSummary(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
