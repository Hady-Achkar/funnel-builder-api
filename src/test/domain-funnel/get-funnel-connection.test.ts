import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GetFunnelConnectionService } from "../../services/domain-funnel/get-funnel-connection";
import { getPrisma } from "../../lib/prisma";
import { NotFoundError, ForbiddenError } from "../../errors/http-errors";

vi.mock("../../lib/prisma");

describe("Get Funnel Connection Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const funnelId = 123;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
      funnelDomain: {
        findFirst: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Success Cases", () => {
    it("should return connected domain for funnel when user is workspace owner", async () => {
      const funnelData = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId: 1,
        workspace: {
          id: 1,
          ownerId: userId,
        },
      };

      const connectionData = {
        domain: {
          id: 456,
          hostname: "example.com",
        },
        isActive: true,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelData);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(connectionData);

      const result = await GetFunnelConnectionService.getFunnelConnection(userId, { funnelId });

      expect(result).toEqual({
        funnel: {
          id: funnelId,
          name: "Test Funnel",
        },
        domain: {
          id: 456,
          hostname: "example.com",
        },
        isActive: true,
      });

      expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith({
        where: { id: funnelId },
        select: {
          id: true,
          name: true,
          workspaceId: true,
          workspace: {
            select: {
              id: true,
              ownerId: true,
            },
          },
        },
      });

      expect(mockPrisma.funnelDomain.findFirst).toHaveBeenCalledWith({
        where: { funnelId },
        select: {
          domain: {
            select: {
              id: true,
              hostname: true,
            },
          },
          isActive: true,
        },
      });
    });

    it("should return null domain when funnel has no connection", async () => {
      const funnelData = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId: 1,
        workspace: {
          id: 1,
          ownerId: userId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelData);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);

      const result = await GetFunnelConnectionService.getFunnelConnection(userId, { funnelId });

      expect(result).toEqual({
        funnel: {
          id: funnelId,
          name: "Test Funnel",
        },
        domain: null,
        isActive: false,
      });
    });

    it("should allow workspace member with VIEW permission to see connection", async () => {
      const funnelData = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId: 1,
        workspace: {
          id: 1,
          ownerId: 999, // Different owner
        },
      };

      const memberData = {
        role: "VIEWER",
      };

      const connectionData = {
        domain: {
          id: 456,
          hostname: "example.com",
        },
        isActive: true,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelData);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberData);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(connectionData);

      const result = await GetFunnelConnectionService.getFunnelConnection(userId, { funnelId });

      expect(result.domain).toBeDefined();
      expect(result.domain?.hostname).toBe("example.com");
    });
  });

  describe("Error Cases", () => {
    it("should throw NotFoundError when funnel doesn't exist", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(
        GetFunnelConnectionService.getFunnelConnection(userId, { funnelId })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when user has no access to workspace", async () => {
      const funnelData = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId: 1,
        workspace: {
          id: 1,
          ownerId: 999, // Different owner
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelData);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        GetFunnelConnectionService.getFunnelConnection(userId, { funnelId })
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError when user is not a workspace member", async () => {
      const funnelData = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId: 1,
        workspace: {
          id: 1,
          ownerId: 999, // Different owner
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelData);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        GetFunnelConnectionService.getFunnelConnection(userId, { funnelId })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});