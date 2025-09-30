import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GetWorkspaceFunnelsSummaryService } from "../../services/funnel/get-workspace-summary";
import { GetWorkspaceFunnelsSummaryController } from "../../controllers/funnel/get-workspace-summary";
import { getPrisma } from "../../lib/prisma";
import { NotFoundError, ForbiddenError } from "../../errors/http-errors";
import { WorkspaceRole } from "../../generated/prisma-client";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";

vi.mock("../../lib/prisma");

describe("Get Workspace Funnels Summary Tests", () => {
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
      funnel: {
        findMany: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GetWorkspaceFunnelsSummaryService", () => {
    describe("Success Cases", () => {
      it("should return funnels with only id and name for workspace owner", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: userId,
        };

        const funnelsData = [
          {
            id: 1,
            name: "Sales Funnel",
          },
          {
            id: 2,
            name: "Lead Gen Funnel",
          },
        ];

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

        const result = await GetWorkspaceFunnelsSummaryService.getWorkspaceFunnelsSummary(
          userId,
          { workspaceSlug }
        );

        expect(result).toEqual({
          funnels: [
            { id: 1, name: "Sales Funnel" },
            { id: 2, name: "Lead Gen Funnel" },
          ],
        });

        expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
          where: { slug: workspaceSlug },
        });

        expect(mockPrisma.workspaceMember.findUnique).not.toHaveBeenCalled();

        expect(mockPrisma.funnel.findMany).toHaveBeenCalledWith({
          where: { workspaceId: 1 },
          select: {
            id: true,
            name: true,
          },
          orderBy: { createdAt: "desc" },
        });
      });

      it("should return funnels for workspace admin", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: 999, // Different owner
        };

        const memberData = {
          userId,
          workspaceId: 1,
          role: WorkspaceRole.ADMIN,
        };

        const funnelsData = [
          {
            id: 1,
            name: "Sales Funnel",
          },
        ];

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberData);
        mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

        const result = await GetWorkspaceFunnelsSummaryService.getWorkspaceFunnelsSummary(
          userId,
          { workspaceSlug }
        );

        expect(result).toEqual({
          funnels: [{ id: 1, name: "Sales Funnel" }],
        });
      });

      it("should return funnels for workspace viewer (all roles can view)", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: 999, // Different owner
        };

        const memberData = {
          userId,
          workspaceId: 1,
          role: WorkspaceRole.VIEWER,
        };

        const funnelsData = [
          {
            id: 1,
            name: "Sales Funnel",
          },
        ];

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberData);
        mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

        const result = await GetWorkspaceFunnelsSummaryService.getWorkspaceFunnelsSummary(
          userId,
          { workspaceSlug }
        );

        expect(result).toEqual({
          funnels: [{ id: 1, name: "Sales Funnel" }],
        });
      });

      it("should return empty array when no funnels exist", async () => {
        const workspaceData = {
          id: 1,
          slug: workspaceSlug,
          ownerId: userId,
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
        mockPrisma.funnel.findMany.mockResolvedValue([]);

        const result = await GetWorkspaceFunnelsSummaryService.getWorkspaceFunnelsSummary(
          userId,
          { workspaceSlug }
        );

        expect(result).toEqual({
          funnels: [],
        });
      });
    });

    describe("Error Cases", () => {
      it("should throw NotFoundError when workspace does not exist", async () => {
        mockPrisma.workspace.findUnique.mockResolvedValue(null);

        await expect(
          GetWorkspaceFunnelsSummaryService.getWorkspaceFunnelsSummary(userId, {
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
          GetWorkspaceFunnelsSummaryService.getWorkspaceFunnelsSummary(userId, {
            workspaceSlug,
          })
        ).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe("GetWorkspaceFunnelsSummaryController", () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        userId,
        params: { workspaceSlug },
      };
      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it("should return 200 with funnels data on success", async () => {
      const workspaceData = {
        id: 1,
        slug: workspaceSlug,
        ownerId: userId,
      };

      const funnelsData = [
        {
          id: 1,
          name: "Sales Funnel",
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      await GetWorkspaceFunnelsSummaryController.getWorkspaceFunnelsSummary(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        funnels: [{ id: 1, name: "Sales Funnel" }],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error when service throws", async () => {
      const error = new NotFoundError("Workspace not found");
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await GetWorkspaceFunnelsSummaryController.getWorkspaceFunnelsSummary(
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