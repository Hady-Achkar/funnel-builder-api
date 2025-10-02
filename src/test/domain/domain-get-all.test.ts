import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GetAllDomainsService } from "../../services/domain/get-all-domains/get-all-domains.service";
import { getPrisma } from "../../lib/prisma";
import { $Enums } from "../../generated/prisma-client";

vi.mock("../../lib/prisma");

describe("Get All Domains Tests", () => {
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
        count: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockWorkspace = {
    id: 1,
    slug: workspaceSlug,
    name: "Test Workspace",
    ownerId: userId,
  };

  const mockMember = {
    id: 1,
    userId,
    workspaceId: 1,
    role: "OWNER",
    status: "ACTIVE",
  };

  const mockDomains = [
    {
      id: 1,
      hostname: "example.com",
      type: $Enums.DomainType.CUSTOM_DOMAIN,
      status: $Enums.DomainStatus.ACTIVE,
      workspaceId: 1,
      createdAt: new Date("2024-01-01"),
    },
    {
      id: 2,
      hostname: "test.example.com",
      type: $Enums.DomainType.SUBDOMAIN,
      status: $Enums.DomainStatus.ACTIVE,
      workspaceId: 1,
      createdAt: new Date("2024-01-02"),
    },
    {
      id: 3,
      hostname: "marketing.example.com",
      type: $Enums.DomainType.SUBDOMAIN,
      status: $Enums.DomainStatus.PENDING,
      workspaceId: 1,
      createdAt: new Date("2024-01-03"),
    },
  ];

  describe("Search Functionality", () => {
    it("should search domains by hostname (case-insensitive)", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const searchedDomains = mockDomains.filter(d =>
        d.hostname.toLowerCase().includes("marketing")
      );

      mockPrisma.domain.findMany.mockResolvedValue(searchedDomains);
      mockPrisma.domain.count.mockResolvedValue(searchedDomains.length);

      const result = await GetAllDomainsService.getAllDomains(userId, {
        workspaceSlug,
        search: "marketing",
      });

      expect(result.domains).toHaveLength(1);
      expect(result.domains[0].hostname).toBe("marketing.example.com");
      expect(result.pagination.total).toBe(1);
    });

    it("should search domains with mixed case", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const searchedDomains = mockDomains.filter(d =>
        d.hostname.toLowerCase().includes("example")
      );

      mockPrisma.domain.findMany.mockResolvedValue(searchedDomains);
      mockPrisma.domain.count.mockResolvedValue(searchedDomains.length);

      const result = await GetAllDomainsService.getAllDomains(userId, {
        workspaceSlug,
        search: "EXAMPLE",
      });

      expect(result.domains).toHaveLength(3);
      expect(result.domains.every(d => d.hostname.toLowerCase().includes("example"))).toBe(true);
    });

    it("should return empty array when search yields no results", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.findMany.mockResolvedValue([]);
      mockPrisma.domain.count.mockResolvedValue(0);

      const result = await GetAllDomainsService.getAllDomains(userId, {
        workspaceSlug,
        search: "nonexistent",
      });

      expect(result.domains).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should search domains by partial hostname", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const searchedDomains = mockDomains.filter(d =>
        d.hostname.toLowerCase().includes("test")
      );

      mockPrisma.domain.findMany.mockResolvedValue(searchedDomains);
      mockPrisma.domain.count.mockResolvedValue(searchedDomains.length);

      const result = await GetAllDomainsService.getAllDomains(userId, {
        workspaceSlug,
        search: "test",
      });

      expect(result.domains).toHaveLength(1);
      expect(result.domains[0].hostname).toBe("test.example.com");
    });
  });

  describe("Combined Filters and Search", () => {
    it("should combine search with status filter", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const filteredDomains = mockDomains.filter(d =>
        d.hostname.toLowerCase().includes("example") &&
        d.status === $Enums.DomainStatus.ACTIVE
      );

      mockPrisma.domain.findMany.mockResolvedValue(filteredDomains);
      mockPrisma.domain.count.mockResolvedValue(filteredDomains.length);

      const result = await GetAllDomainsService.getAllDomains(userId, {
        workspaceSlug,
        search: "example",
        filters: {
          status: $Enums.DomainStatus.ACTIVE,
        },
      });

      expect(result.domains).toHaveLength(2);
      expect(result.domains.every(d => d.status === $Enums.DomainStatus.ACTIVE)).toBe(true);
    });

    it("should combine search with type filter", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const filteredDomains = mockDomains.filter(d =>
        d.hostname.toLowerCase().includes("example") &&
        d.type === $Enums.DomainType.SUBDOMAIN
      );

      mockPrisma.domain.findMany.mockResolvedValue(filteredDomains);
      mockPrisma.domain.count.mockResolvedValue(filteredDomains.length);

      const result = await GetAllDomainsService.getAllDomains(userId, {
        workspaceSlug,
        search: "example",
        filters: {
          type: $Enums.DomainType.SUBDOMAIN,
        },
      });

      expect(result.domains).toHaveLength(2);
      expect(result.domains.every(d => d.type === $Enums.DomainType.SUBDOMAIN)).toBe(true);
    });

    it("should combine search with multiple filters", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const filteredDomains = mockDomains.filter(d =>
        d.hostname.toLowerCase().includes("marketing") &&
        d.status === $Enums.DomainStatus.PENDING &&
        d.type === $Enums.DomainType.SUBDOMAIN
      );

      mockPrisma.domain.findMany.mockResolvedValue(filteredDomains);
      mockPrisma.domain.count.mockResolvedValue(filteredDomains.length);

      const result = await GetAllDomainsService.getAllDomains(userId, {
        workspaceSlug,
        search: "marketing",
        filters: {
          status: $Enums.DomainStatus.PENDING,
          type: $Enums.DomainType.SUBDOMAIN,
        },
      });

      expect(result.domains).toHaveLength(1);
      expect(result.domains[0].hostname).toBe("marketing.example.com");
      expect(result.domains[0].status).toBe($Enums.DomainStatus.PENDING);
      expect(result.domains[0].type).toBe($Enums.DomainType.SUBDOMAIN);
    });
  });

  describe("Pagination with Search", () => {
    it("should paginate search results correctly", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const searchedDomains = mockDomains.filter(d =>
        d.hostname.toLowerCase().includes("example")
      ).slice(0, 2);

      mockPrisma.domain.findMany.mockResolvedValue(searchedDomains);
      mockPrisma.domain.count.mockResolvedValue(3);

      const result = await GetAllDomainsService.getAllDomains(userId, {
        workspaceSlug,
        search: "example",
        page: 1,
        limit: 2,
      });

      expect(result.domains).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
    });
  });

  describe("Basic Functionality", () => {
    it("should return all domains when no search or filters provided", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.findMany.mockResolvedValue(mockDomains);
      mockPrisma.domain.count.mockResolvedValue(mockDomains.length);

      const result = await GetAllDomainsService.getAllDomains(userId, {
        workspaceSlug,
      });

      expect(result.domains).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it("should throw error if workspace does not exist", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        GetAllDomainsService.getAllDomains(userId, {
          workspaceSlug,
        })
      ).rejects.toThrow("Workspace not found");
    });

    it("should handle default pagination values", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.findMany.mockResolvedValue(mockDomains);
      mockPrisma.domain.count.mockResolvedValue(mockDomains.length);

      const result = await GetAllDomainsService.getAllDomains(userId, {
        workspaceSlug,
      });

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });
});
