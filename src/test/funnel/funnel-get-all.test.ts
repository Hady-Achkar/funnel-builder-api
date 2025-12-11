import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getAllFunnels } from "../../services/funnel/getAll";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { $Enums } from "../../generated/prisma-client";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

describe("Get All Funnels Tests", () => {
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
    (cacheService.get as any).mockResolvedValue(null);
    (cacheService.set as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Query Parameter Handling", () => {
    it("should handle undefined query parameters", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue([]);

      const result = await getAllFunnels(workspaceSlug, userId, {});

      expect(result.funnels).toHaveLength(0);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it("should handle empty query object", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue([]);

      const result = await getAllFunnels(workspaceSlug, userId);

      expect(result.funnels).toHaveLength(0);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it("should parse and validate query parameters", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue([]);

      const result = await getAllFunnels(workspaceSlug, userId, {
        page: "2" as any,
        limit: "20" as any,
        sortBy: "name",
        sortOrder: "asc",
        status: $Enums.FunnelStatus.LIVE
      });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(20);
    });

    it("should use default values for invalid query parameters", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue([]);

      const result = await getAllFunnels(workspaceSlug, userId, {
        page: undefined,
        limit: undefined,
      });

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe("Workspace Validation", () => {
    it("should throw error if workspace does not exist", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        getAllFunnels("non-existent", userId, {})
      ).rejects.toThrow("The workspace does not exist");
    });

    it("should throw error if user is not workspace member", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: 999 };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        getAllFunnels(workspaceSlug, userId, {})
      ).rejects.toThrow("Failed to get funnels");
    });
  });

  describe("Permissions", () => {
    it("should allow workspace owner to view all funnels", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = [
        {
          id: 1,
          name: "Funnel 1",
          slug: "funnel-1",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 2,
          name: "Funnel 2",
          slug: "funnel-2",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: 999,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {});

      expect(result.funnels).toHaveLength(2);
    });

    it.skip("should filter funnels for members based on permissions", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: 999 };
      const memberData = {
        role: $Enums.WorkspaceRole.VIEWER,
        permissions: []
      };
      const funnelsData = [
        {
          id: 1,
          name: "Own Funnel",
          slug: "own-funnel",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 2,
          name: "Other's Funnel",
          slug: "others-funnel",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: 999,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {});

      expect(result.funnels).toHaveLength(1);
      expect(result.funnels[0].name).toBe("Own Funnel");
    });

    it("should show all funnels for admin members", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: 999 };
      const memberData = {
        role: $Enums.WorkspaceRole.ADMIN,
        permissions: []
      };
      const funnelsData = [
        {
          id: 1,
          name: "Funnel 1",
          slug: "funnel-1",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 2,
          name: "Funnel 2",
          slug: "funnel-2",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: 999,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(memberData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {});

      expect(result.funnels).toHaveLength(2);
    });
  });

  describe("Pagination", () => {
    it("should paginate results correctly", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Funnel ${i + 1}`,
        slug: `funnel-${i + 1}`,
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId: 1,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: null
      }));

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {
        page: 2,
        limit: 10
      });

      expect(result.funnels).toHaveLength(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it("should handle last page correctly", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Funnel ${i + 1}`,
        slug: `funnel-${i + 1}`,
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId: 1,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: null
      }));

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {
        page: 3,
        limit: 10
      });

      expect(result.funnels).toHaveLength(5);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });

  describe("Sorting", () => {
    it("should sort by creation date descending by default", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const now = new Date();
      const funnelsData = [
        {
          id: 1,
          name: "Old Funnel",
          slug: "old-funnel",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(now.getTime() - 86400000),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 2,
          name: "New Funnel",
          slug: "new-funnel",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: userId,
          createdAt: now,
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {});

      expect(result.funnels[0].name).toBe("New Funnel");
      expect(result.funnels[1].name).toBe("Old Funnel");
    });

    it("should sort by name when specified", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = [
        {
          id: 1,
          name: "Zebra Funnel",
          slug: "zebra-funnel",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 2,
          name: "Alpha Funnel",
          slug: "alpha-funnel",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {
        sortBy: "name",
        sortOrder: "asc"
      });

      expect(result.funnels[0].name).toBe("Alpha Funnel");
      expect(result.funnels[1].name).toBe("Zebra Funnel");
    });
  });

  describe("Status Filtering", () => {
    it("should filter by status when provided", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = [
        {
          id: 1,
          name: "Draft Funnel",
          slug: "draft-funnel",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 2,
          name: "Live Funnel",
          slug: "live-funnel",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {
        status: $Enums.FunnelStatus.LIVE
      });

      expect(result.funnels).toHaveLength(1);
      expect(result.funnels[0].name).toBe("Live Funnel");
    });
  });

  describe("Search Functionality", () => {
    it("should search funnels by name (case-insensitive)", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = [
        {
          id: 1,
          name: "Marketing Funnel",
          slug: "marketing-funnel",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 2,
          name: "Sales Funnel",
          slug: "sales-funnel",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 3,
          name: "Product Launch",
          slug: "product-launch",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {
        search: "marketing"
      });

      expect(result.funnels).toHaveLength(1);
      expect(result.funnels[0].name).toBe("Marketing Funnel");
    });

    it("should search funnels by slug (case-insensitive)", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = [
        {
          id: 1,
          name: "Marketing Funnel",
          slug: "marketing-funnel",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 2,
          name: "Sales Funnel",
          slug: "sales-funnel-2024",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {
        search: "2024"
      });

      expect(result.funnels).toHaveLength(1);
      expect(result.funnels[0].slug).toBe("sales-funnel-2024");
    });

    it("should handle search with mixed case", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = [
        {
          id: 1,
          name: "Product Launch Funnel",
          slug: "product-launch",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {
        search: "PRODUCT"
      });

      expect(result.funnels).toHaveLength(1);
      expect(result.funnels[0].name).toBe("Product Launch Funnel");
    });

    it("should return empty array when no matches found", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = [
        {
          id: 1,
          name: "Marketing Funnel",
          slug: "marketing-funnel",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {
        search: "nonexistent"
      });

      expect(result.funnels).toHaveLength(0);
    });
  });

  describe("Creator Filtering", () => {
    it("should filter funnels by creator", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = [
        {
          id: 1,
          name: "Funnel by User 1",
          slug: "funnel-user-1",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 2,
          name: "Funnel by User 2",
          slug: "funnel-user-2",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 3,
          name: "Another Funnel by User 1",
          slug: "another-funnel-user-1",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {
        createdBy: 1
      });

      expect(result.funnels).toHaveLength(2);
      expect(result.funnels.every(f => f.createdBy === 1)).toBe(true);
    });

    it("should return empty array when creator has no funnels", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = [
        {
          id: 1,
          name: "Funnel by User 1",
          slug: "funnel-user-1",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {
        createdBy: 999
      });

      expect(result.funnels).toHaveLength(0);
    });
  });

  describe("Combined Filters", () => {
    it("should combine search, status, and creator filters", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = [
        {
          id: 1,
          name: "Marketing Funnel",
          slug: "marketing-funnel",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 2,
          name: "Marketing Campaign",
          slug: "marketing-campaign",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        },
        {
          id: 3,
          name: "Marketing Launch",
          slug: "marketing-launch",
          status: $Enums.FunnelStatus.LIVE,
          workspaceId: 1,
          createdBy: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      const result = await getAllFunnels(workspaceSlug, userId, {
        search: "marketing",
        status: $Enums.FunnelStatus.LIVE,
        createdBy: 1
      });

      expect(result.funnels).toHaveLength(1);
      expect(result.funnels[0].id).toBe(1);
    });
  });

  describe("Caching", () => {
    it.skip("should return cached data if available", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);

      const cachedData = {
        funnels: [
          {
            id: 1,
            name: "Cached Funnel",
            slug: "cached-funnel",
            status: $Enums.FunnelStatus.DRAFT,
            workspaceId: 1,
            createdBy: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            settings: null
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      (cacheService.get as any).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getAllFunnels(workspaceSlug, userId, {});

      expect(result.funnels).toHaveLength(1);
      expect(result.funnels[0].name).toBe("Cached Funnel");
    });

    it("should cache data after fetching from database", async () => {
      const workspaceData = { id: 1, name: "Test Workspace", ownerId: userId };
      const funnelsData = [
        {
          id: 1,
          name: "Funnel to Cache",
          slug: "funnel-to-cache",
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: 1,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: null
        }
      ];

      mockPrisma.workspace.findUnique.mockResolvedValue(workspaceData);
      mockPrisma.funnel.findMany.mockResolvedValue(funnelsData);

      await getAllFunnels(workspaceSlug, userId, {});

      expect(cacheService.set).toHaveBeenCalled();
    });
  });
});