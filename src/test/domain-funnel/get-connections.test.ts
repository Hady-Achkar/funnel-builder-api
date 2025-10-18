import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GetConnectionsService } from "../../services/domain-funnel/get-connections";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../errors/http-errors";

vi.mock("../../lib/prisma");
vi.mock("../../utils/workspace-utils/workspace-permission-manager", () => ({
  PermissionManager: {
    requirePermission: vi.fn(),
  },
  PermissionAction: {
    VIEW_WORKSPACE: "VIEW_WORKSPACE",
  },
}));

import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager";

describe("Get Connections Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const workspaceId = 1;
  const workspaceSlug = "test-workspace";

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
      },
      funnelDomain: {
        findMany: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
    (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error for missing workspace slug", async () => {
      await expect(
        GetConnectionsService.getConnections(userId, {})
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for empty workspace slug", async () => {
      await expect(
        GetConnectionsService.getConnections(userId, { workspaceSlug: "" })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid workspace slug type", async () => {
      await expect(
        GetConnectionsService.getConnections(userId, { workspaceSlug: 123 })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Workspace Existence", () => {
    it("should throw NotFoundError if workspace not found", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        GetConnectionsService.getConnections(userId, { workspaceSlug })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError with correct message", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        GetConnectionsService.getConnections(userId, { workspaceSlug })
      ).rejects.toThrow("Workspace not found");
    });

    it("should query workspace by slug", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        slug: workspaceSlug,
      });
      mockPrisma.funnelDomain.findMany.mockResolvedValue([]);

      await GetConnectionsService.getConnections(userId, { workspaceSlug });

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: workspaceSlug },
      });
    });
  });

  describe("Permission Checks", () => {
    const workspace = {
      id: workspaceId,
      slug: workspaceSlug,
    };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnelDomain.findMany.mockResolvedValue([]);
    });

    it("should check VIEW_WORKSPACE permission", async () => {
      await GetConnectionsService.getConnections(userId, { workspaceSlug });

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "VIEW_WORKSPACE",
      });
    });

    it("should throw error if user lacks VIEW_WORKSPACE permission", async () => {
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have permission to view workspace")
      );

      await expect(
        GetConnectionsService.getConnections(userId, { workspaceSlug })
      ).rejects.toThrow("You don't have permission to view workspace");
    });

    it("should allow workspace members to view connections", async () => {
      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(result.connections).toEqual([]);
    });

    it("should deny non-members from viewing connections", async () => {
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have access to this workspace")
      );

      await expect(
        GetConnectionsService.getConnections(userId, { workspaceSlug })
      ).rejects.toThrow("You don't have access to this workspace");
    });
  });

  describe("Connections Retrieval", () => {
    const workspace = {
      id: workspaceId,
      slug: workspaceSlug,
    };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
    });

    it("should return empty array if no connections exist", async () => {
      mockPrisma.funnelDomain.findMany.mockResolvedValue([]);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(result.connections).toEqual([]);
    });

    it("should return connections for workspace", async () => {
      const mockConnections = [
        {
          funnel: {
            id: 1,
            name: "Funnel 1",
          },
          domain: {
            id: 1,
            hostname: "example1.com",
          },
        },
        {
          funnel: {
            id: 2,
            name: "Funnel 2",
          },
          domain: {
            id: 2,
            hostname: "example2.com",
          },
        },
      ];

      mockPrisma.funnelDomain.findMany.mockResolvedValue(mockConnections);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(result.connections).toHaveLength(2);
      expect(result.connections[0]).toEqual({
        funnelId: 1,
        funnelName: "Funnel 1",
        domainId: 1,
        domainName: "example1.com",
      });
      expect(result.connections[1]).toEqual({
        funnelId: 2,
        funnelName: "Funnel 2",
        domainId: 2,
        domainName: "example2.com",
      });
    });

    it("should query connections by workspace ID", async () => {
      mockPrisma.funnelDomain.findMany.mockResolvedValue([]);

      await GetConnectionsService.getConnections(userId, { workspaceSlug });

      expect(mockPrisma.funnelDomain.findMany).toHaveBeenCalledWith({
        where: {
          funnel: {
            workspaceId,
          },
        },
        select: {
          funnel: {
            select: {
              id: true,
              name: true,
            },
          },
          domain: {
            select: {
              id: true,
              hostname: true,
            },
          },
        },
      });
    });

    it("should select only necessary fields", async () => {
      mockPrisma.funnelDomain.findMany.mockResolvedValue([]);

      await GetConnectionsService.getConnections(userId, { workspaceSlug });

      const call = mockPrisma.funnelDomain.findMany.mock.calls[0][0];
      expect(call.select.funnel.select).toEqual({
        id: true,
        name: true,
      });
      expect(call.select.domain.select).toEqual({
        id: true,
        hostname: true,
      });
    });

    it("should handle single connection", async () => {
      const mockConnections = [
        {
          funnel: {
            id: 1,
            name: "Single Funnel",
          },
          domain: {
            id: 1,
            hostname: "single.com",
          },
        },
      ];

      mockPrisma.funnelDomain.findMany.mockResolvedValue(mockConnections);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(result.connections).toHaveLength(1);
      expect(result.connections[0].funnelName).toBe("Single Funnel");
    });

    it("should handle multiple connections", async () => {
      const mockConnections = Array.from({ length: 10 }, (_, i) => ({
        funnel: {
          id: i + 1,
          name: `Funnel ${i + 1}`,
        },
        domain: {
          id: i + 1,
          hostname: `example${i + 1}.com`,
        },
      }));

      mockPrisma.funnelDomain.findMany.mockResolvedValue(mockConnections);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(result.connections).toHaveLength(10);
    });

    it("should map connection data correctly", async () => {
      const mockConnections = [
        {
          funnel: {
            id: 42,
            name: "Test Funnel Name",
          },
          domain: {
            id: 99,
            hostname: "test-domain.com",
          },
        },
      ];

      mockPrisma.funnelDomain.findMany.mockResolvedValue(mockConnections);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(result.connections[0]).toEqual({
        funnelId: 42,
        funnelName: "Test Funnel Name",
        domainId: 99,
        domainName: "test-domain.com",
      });
    });
  });

  describe("Response Format", () => {
    const workspace = {
      id: workspaceId,
      slug: workspaceSlug,
    };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
    });

    it("should return valid response structure", async () => {
      mockPrisma.funnelDomain.findMany.mockResolvedValue([]);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(result).toHaveProperty("connections");
      expect(Array.isArray(result.connections)).toBe(true);
    });

    it("should include all required fields in connection objects", async () => {
      const mockConnections = [
        {
          funnel: {
            id: 1,
            name: "Funnel 1",
          },
          domain: {
            id: 1,
            hostname: "example.com",
          },
        },
      ];

      mockPrisma.funnelDomain.findMany.mockResolvedValue(mockConnections);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(result.connections[0]).toHaveProperty("funnelId");
      expect(result.connections[0]).toHaveProperty("funnelName");
      expect(result.connections[0]).toHaveProperty("domainId");
      expect(result.connections[0]).toHaveProperty("domainName");
    });

    it("should not include sensitive data in response", async () => {
      mockPrisma.funnelDomain.findMany.mockResolvedValue([]);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(result).not.toHaveProperty("userId");
      expect(result).not.toHaveProperty("workspaceId");
      expect(result).not.toHaveProperty("password");
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockPrisma.workspace.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        GetConnectionsService.getConnections(userId, { workspaceSlug })
      ).rejects.toThrow("Database connection failed");
    });

    it("should throw BadRequestError for Zod validation errors", async () => {
      try {
        await GetConnectionsService.getConnections(userId, {
          workspaceSlug: 123,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
      }
    });

    it("should include validation message in BadRequestError", async () => {
      try {
        await GetConnectionsService.getConnections(userId, {
          workspaceSlug: "",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        if (error instanceof BadRequestError) {
          expect(error.message).toBeTruthy();
        }
      }
    });

    it("should handle errors when fetching connections", async () => {
      const workspace = {
        id: workspaceId,
        slug: workspaceSlug,
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnelDomain.findMany.mockRejectedValue(
        new Error("Failed to fetch connections")
      );

      await expect(
        GetConnectionsService.getConnections(userId, { workspaceSlug })
      ).rejects.toThrow("Failed to fetch connections");
    });
  });

  describe("Edge Cases", () => {
    const workspace = {
      id: workspaceId,
      slug: workspaceSlug,
    };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
    });

    it("should handle workspace with special characters in slug", async () => {
      const specialSlug = "test-workspace-123_abc";
      const specialWorkspace = {
        id: workspaceId,
        slug: specialSlug,
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(specialWorkspace);
      mockPrisma.funnelDomain.findMany.mockResolvedValue([]);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug: specialSlug,
      });

      expect(result.connections).toEqual([]);
    });

    it("should handle connections with long funnel names", async () => {
      const longName = "A".repeat(200);
      const mockConnections = [
        {
          funnel: {
            id: 1,
            name: longName,
          },
          domain: {
            id: 1,
            hostname: "example.com",
          },
        },
      ];

      mockPrisma.funnelDomain.findMany.mockResolvedValue(mockConnections);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(result.connections[0].funnelName).toBe(longName);
    });

    it("should handle connections with long domain names", async () => {
      const longDomain = "very-long-subdomain-name.example.com";
      const mockConnections = [
        {
          funnel: {
            id: 1,
            name: "Funnel",
          },
          domain: {
            id: 1,
            hostname: longDomain,
          },
        },
      ];

      mockPrisma.funnelDomain.findMany.mockResolvedValue(mockConnections);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(result.connections[0].domainName).toBe(longDomain);
    });

    it("should handle concurrent requests for same workspace", async () => {
      mockPrisma.funnelDomain.findMany.mockResolvedValue([]);

      const results = await Promise.all([
        GetConnectionsService.getConnections(userId, { workspaceSlug }),
        GetConnectionsService.getConnections(userId, { workspaceSlug }),
        GetConnectionsService.getConnections(userId, { workspaceSlug }),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.connections).toEqual([]);
      });
    });

    it("should handle different workspaces correctly", async () => {
      const workspace1 = { id: 1, slug: "workspace-1" };
      const workspace2 = { id: 2, slug: "workspace-2" };

      mockPrisma.workspace.findUnique
        .mockResolvedValueOnce(workspace1)
        .mockResolvedValueOnce(workspace2);

      mockPrisma.funnelDomain.findMany
        .mockResolvedValueOnce([
          {
            funnel: { id: 1, name: "Funnel 1" },
            domain: { id: 1, hostname: "workspace1.com" },
          },
        ])
        .mockResolvedValueOnce([
          {
            funnel: { id: 2, name: "Funnel 2" },
            domain: { id: 2, hostname: "workspace2.com" },
          },
        ]);

      const result1 = await GetConnectionsService.getConnections(userId, {
        workspaceSlug: "workspace-1",
      });
      const result2 = await GetConnectionsService.getConnections(userId, {
        workspaceSlug: "workspace-2",
      });

      expect(result1.connections[0].domainName).toBe("workspace1.com");
      expect(result2.connections[0].domainName).toBe("workspace2.com");
    });
  });

  describe("Integration Tests", () => {
    it("should complete full workflow for workspace with connections", async () => {
      const workspace = {
        id: workspaceId,
        slug: workspaceSlug,
      };

      const mockConnections = [
        {
          funnel: {
            id: 1,
            name: "Landing Page",
          },
          domain: {
            id: 1,
            hostname: "landing.example.com",
          },
        },
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnelDomain.findMany.mockResolvedValue(mockConnections);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: workspaceSlug },
      });
      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "VIEW_WORKSPACE",
      });
      expect(mockPrisma.funnelDomain.findMany).toHaveBeenCalled();
      expect(result.connections).toHaveLength(1);
    });

    it("should complete full workflow for workspace without connections", async () => {
      const workspace = {
        id: workspaceId,
        slug: workspaceSlug,
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.funnelDomain.findMany.mockResolvedValue([]);

      const result = await GetConnectionsService.getConnections(userId, {
        workspaceSlug,
      });

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalled();
      expect(PermissionManager.requirePermission).toHaveBeenCalled();
      expect(mockPrisma.funnelDomain.findMany).toHaveBeenCalled();
      expect(result.connections).toEqual([]);
    });
  });
});
