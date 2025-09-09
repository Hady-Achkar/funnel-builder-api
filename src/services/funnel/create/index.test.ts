import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFunnel } from "./index";
import { getPrisma } from "../../../lib/prisma";
import { hasPermissionToCreateFunnel } from "../../../helpers/funnel/create";
import {
  generateSlug,
  generateDateSlug,
  generateUniqueSlug,
} from "../../../helpers/funnel/shared";
import {
  createFunnelPayloadFactory,
  createFunnelSettingsPayloadFactory,
  createHomePagePayloadFactory,
  updateFunnelWithThemePayloadFactory,
} from "../../../factories/funnel/create";

// Mock dependencies
vi.mock("../../../lib/prisma");
vi.mock("../../../helpers/funnel/create");
vi.mock("../../../helpers/funnel/shared");
vi.mock("../../../factories/funnel/create");

const mockPrisma = {
  workspace: {
    findUniqueOrThrow: vi.fn(),
  },
  funnel: {
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  workspaceMember: {
    findUnique: vi.fn(),
  },
  theme: {
    create: vi.fn(),
  },
  funnelSettings: {
    create: vi.fn(),
  },
  page: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

const mockGetPrisma = vi.mocked(getPrisma);
const mockHasPermissionToCreateFunnel = vi.mocked(hasPermissionToCreateFunnel);
const mockGenerateSlug = vi.mocked(generateSlug);
const mockGenerateDateSlug = vi.mocked(generateDateSlug);
const mockGenerateUniqueSlug = vi.mocked(generateUniqueSlug);
const mockCreateFunnelPayloadFactory = vi.mocked(createFunnelPayloadFactory);
const mockCreateFunnelSettingsPayloadFactory = vi.mocked(createFunnelSettingsPayloadFactory);
const mockCreateHomePagePayloadFactory = vi.mocked(createHomePagePayloadFactory);
const mockUpdateFunnelWithThemePayloadFactory = vi.mocked(updateFunnelWithThemePayloadFactory);

describe("createFunnel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPrisma.mockReturnValue(mockPrisma as any);
    
    // Mock console methods to avoid test output noise
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockWorkspace = {
    id: 8,
    name: "Test Workspace",
    ownerId: 1,
    allocatedFunnels: 10,
    owner: {
      id: 1,
      maximumFunnels: 50,
    },
  };

  const mockCreateFunnelRequest = {
    name: "Test Funnel",
    workspaceSlug: "test-workspace",
    status: "DRAFT" as const,
  };

  describe("validation", () => {
    it("should throw error when userId is not provided", async () => {
      await expect(createFunnel(0, mockCreateFunnelRequest)).rejects.toThrow(
        "User ID is required"
      );
    });

    it("should throw error when workspaceSlug is not provided", async () => {
      const requestWithoutSlug = { ...mockCreateFunnelRequest, workspaceSlug: "" };

      await expect(createFunnel(1, requestWithoutSlug)).rejects.toThrow(
        "Please select a workspace to create the funnel in"
      );
    });
  });

  describe("workspace validation", () => {
    it("should fetch workspace successfully", async () => {
      mockPrisma.workspace.findUniqueOrThrow.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockGenerateSlug.mockReturnValue("test-funnel");
      mockGenerateUniqueSlug.mockResolvedValue("test-funnel");
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      const mockFunnelPayload = { name: "Test Funnel" };
      const mockSettingsPayload = { funnelId: 123 };
      const mockHomePagePayload = { funnelId: 123 };
      const mockThemePayload = { themeId: 456 };

      mockCreateFunnelPayloadFactory.mockReturnValue(mockFunnelPayload as any);
      mockCreateFunnelSettingsPayloadFactory.mockReturnValue(mockSettingsPayload as any);
      mockCreateHomePagePayloadFactory.mockReturnValue(mockHomePagePayload as any);
      mockUpdateFunnelWithThemePayloadFactory.mockReturnValue(mockThemePayload as any);

      const mockFunnel = { id: 123, name: "Test Funnel" };
      const mockTheme = { id: 456 };
      const mockHomePage = { id: 789, name: "Home" };

      mockPrisma.funnel.create.mockResolvedValue(mockFunnel);
      mockPrisma.theme.create.mockResolvedValue(mockTheme);
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        theme: mockTheme,
        pages: [],
      });
      mockPrisma.page.create.mockResolvedValue(mockHomePage);

      await createFunnel(1, mockCreateFunnelRequest);

      expect(mockPrisma.workspace.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { slug: "test-workspace" },
        select: {
          id: true,
          name: true,
          ownerId: true,
          allocatedFunnels: true,
          owner: {
            select: {
              id: true,
              maximumFunnels: true,
            },
          },
        },
      });
    });

    it("should throw error when workspace has reached maximum funnels", async () => {
      mockPrisma.workspace.findUniqueOrThrow.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(10);

      await expect(createFunnel(1, mockCreateFunnelRequest)).rejects.toThrow(
        "This workspace has reached its maximum number of funnels."
      );
    });
  });

  describe("permission validation", () => {
    beforeEach(() => {
      mockPrisma.workspace.findUniqueOrThrow.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
    });

    it("should allow workspace owner to create funnel", async () => {
      mockGenerateSlug.mockReturnValue("test-funnel");
      mockGenerateUniqueSlug.mockResolvedValue("test-funnel");
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      const mockFunnelPayload = { name: "Test Funnel" };
      const mockSettingsPayload = { funnelId: 123 };
      const mockHomePagePayload = { funnelId: 123 };
      const mockThemePayload = { themeId: 456 };

      mockCreateFunnelPayloadFactory.mockReturnValue(mockFunnelPayload as any);
      mockCreateFunnelSettingsPayloadFactory.mockReturnValue(mockSettingsPayload as any);
      mockCreateHomePagePayloadFactory.mockReturnValue(mockHomePagePayload as any);
      mockUpdateFunnelWithThemePayloadFactory.mockReturnValue(mockThemePayload as any);

      const mockFunnel = { id: 123, name: "Test Funnel" };
      const mockTheme = { id: 456 };
      const mockHomePage = { id: 789, name: "Home" };

      mockPrisma.funnel.create.mockResolvedValue(mockFunnel);
      mockPrisma.theme.create.mockResolvedValue(mockTheme);
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        theme: mockTheme,
        pages: [],
      });
      mockPrisma.page.create.mockResolvedValue(mockHomePage);

      const result = await createFunnel(1, mockCreateFunnelRequest);

      expect(result).toEqual({
        message: "Funnel created successfully!",
        funnelId: 123,
        workspaceId: 8,
      });
      expect(mockPrisma.workspaceMember.findUnique).not.toHaveBeenCalled();
    });

    it("should check member permissions for non-owners", async () => {
      const nonOwnerWorkspace = { ...mockWorkspace, ownerId: 999 };
      mockPrisma.workspace.findUniqueOrThrow.mockResolvedValue(nonOwnerWorkspace);

      const mockMember = {
        role: "ADMIN",
        permissions: ["CREATE_FUNNEL"],
      };
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockHasPermissionToCreateFunnel.mockReturnValue(true);
      mockGenerateSlug.mockReturnValue("test-funnel");
      mockGenerateUniqueSlug.mockResolvedValue("test-funnel");
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      const mockFunnelPayload = { name: "Test Funnel" };
      const mockSettingsPayload = { funnelId: 123 };
      const mockHomePagePayload = { funnelId: 123 };
      const mockThemePayload = { themeId: 456 };

      mockCreateFunnelPayloadFactory.mockReturnValue(mockFunnelPayload as any);
      mockCreateFunnelSettingsPayloadFactory.mockReturnValue(mockSettingsPayload as any);
      mockCreateHomePagePayloadFactory.mockReturnValue(mockHomePagePayload as any);
      mockUpdateFunnelWithThemePayloadFactory.mockReturnValue(mockThemePayload as any);

      const mockFunnel = { id: 123, name: "Test Funnel" };
      const mockTheme = { id: 456 };
      const mockHomePage = { id: 789, name: "Home" };

      mockPrisma.funnel.create.mockResolvedValue(mockFunnel);
      mockPrisma.theme.create.mockResolvedValue(mockTheme);
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        theme: mockTheme,
        pages: [],
      });
      mockPrisma.page.create.mockResolvedValue(mockHomePage);

      await createFunnel(1, mockCreateFunnelRequest);

      expect(mockPrisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 1,
            workspaceId: 8,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });
      expect(mockHasPermissionToCreateFunnel).toHaveBeenCalledWith(
        "ADMIN",
        ["CREATE_FUNNEL"]
      );
    });

    it("should throw error when user is not a workspace member", async () => {
      const nonOwnerWorkspace = { ...mockWorkspace, ownerId: 999 };
      mockPrisma.workspace.findUniqueOrThrow.mockResolvedValue(nonOwnerWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(createFunnel(1, mockCreateFunnelRequest)).rejects.toThrow(
        'You don\'t have access to the "Test Workspace" workspace. Please ask the workspace owner to invite you.'
      );
    });

    it("should throw error when user lacks create funnel permission", async () => {
      const nonOwnerWorkspace = { ...mockWorkspace, ownerId: 999 };
      mockPrisma.workspace.findUniqueOrThrow.mockResolvedValue(nonOwnerWorkspace);

      const mockMember = {
        role: "VIEWER",
        permissions: [],
      };
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockHasPermissionToCreateFunnel.mockReturnValue(false);

      await expect(createFunnel(1, mockCreateFunnelRequest)).rejects.toThrow(
        "You don't have permission to create funnels in this workspace. Please contact your workspace admin."
      );
    });
  });

  describe("slug generation", () => {
    beforeEach(() => {
      mockPrisma.workspace.findUniqueOrThrow.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });

      const mockFunnelPayload = { name: "Test Funnel" };
      const mockSettingsPayload = { funnelId: 123 };
      const mockHomePagePayload = { funnelId: 123 };
      const mockThemePayload = { themeId: 456 };

      mockCreateFunnelPayloadFactory.mockReturnValue(mockFunnelPayload as any);
      mockCreateFunnelSettingsPayloadFactory.mockReturnValue(mockSettingsPayload as any);
      mockCreateHomePagePayloadFactory.mockReturnValue(mockHomePagePayload as any);
      mockUpdateFunnelWithThemePayloadFactory.mockReturnValue(mockThemePayload as any);

      const mockFunnel = { id: 123, name: "Test Funnel" };
      const mockTheme = { id: 456 };
      const mockHomePage = { id: 789, name: "Home" };

      mockPrisma.funnel.create.mockResolvedValue(mockFunnel);
      mockPrisma.theme.create.mockResolvedValue(mockTheme);
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        theme: mockTheme,
        pages: [],
      });
      mockPrisma.page.create.mockResolvedValue(mockHomePage);
    });

    it("should use provided slug when available", async () => {
      const requestWithSlug = { ...mockCreateFunnelRequest, slug: "custom-slug" };
      mockGenerateUniqueSlug.mockResolvedValue("custom-slug-unique");

      await createFunnel(1, requestWithSlug);

      expect(mockGenerateUniqueSlug).toHaveBeenCalledWith("custom-slug", 8);
      expect(mockGenerateSlug).not.toHaveBeenCalled();
    });

    it("should generate date-based slug for auto-generated names", async () => {
      // Use actual current date format that matches the format function
      const currentDate = new Date();
      const autoGeneratedName = require("date-fns").format(currentDate, "dd.MM.yyyy HH:mm");
      
      const autoGeneratedRequest = {
        ...mockCreateFunnelRequest,
        name: autoGeneratedName,
      };
      mockGenerateDateSlug.mockReturnValue("20250909-1430");
      mockGenerateUniqueSlug.mockResolvedValue("20250909-1430-unique");

      await createFunnel(1, autoGeneratedRequest);

      expect(mockGenerateDateSlug).toHaveBeenCalledWith(expect.any(Date));
      expect(mockGenerateUniqueSlug).toHaveBeenCalledWith("20250909-1430", 8);
    });

    it("should generate slug from name for regular names", async () => {
      mockGenerateSlug.mockReturnValue("test-funnel");
      mockGenerateUniqueSlug.mockResolvedValue("test-funnel-unique");

      await createFunnel(1, mockCreateFunnelRequest);

      expect(mockGenerateSlug).toHaveBeenCalledWith("Test Funnel");
      expect(mockGenerateUniqueSlug).toHaveBeenCalledWith("test-funnel", 8);
    });

    it("should handle slug generation errors with invalid characters", async () => {
      const invalidRequest = { ...mockCreateFunnelRequest, name: "Test#$%Funnel" };
      const slugError = new Error("Name contains invalid characters for slug generation");
      mockGenerateSlug.mockImplementation(() => {
        throw slugError;
      });

      await expect(createFunnel(1, invalidRequest)).rejects.toThrow(
        "Funnel name contains invalid characters. Please use letters, numbers, spaces, and hyphens only."
      );
    });

    it("should rethrow non-invalid-characters slug errors", async () => {
      const genericError = new Error("Database connection failed");
      mockGenerateSlug.mockImplementation(() => {
        throw genericError;
      });

      await expect(createFunnel(1, mockCreateFunnelRequest)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("database transaction", () => {
    beforeEach(() => {
      mockPrisma.workspace.findUniqueOrThrow.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockGenerateSlug.mockReturnValue("test-funnel");
      mockGenerateUniqueSlug.mockResolvedValue("test-funnel");
    });

    it("should create funnel with all related entities in transaction", async () => {
      const mockFunnelPayload = { name: "Test Funnel", slug: "test-funnel" };
      const mockSettingsPayload = { funnelId: 123 };
      const mockHomePagePayload = { name: "Home", funnelId: 123 };
      const mockThemePayload = { themeId: 456 };

      mockCreateFunnelPayloadFactory.mockReturnValue(mockFunnelPayload as any);
      mockCreateFunnelSettingsPayloadFactory.mockReturnValue(mockSettingsPayload as any);
      mockCreateHomePagePayloadFactory.mockReturnValue(mockHomePagePayload as any);
      mockUpdateFunnelWithThemePayloadFactory.mockReturnValue(mockThemePayload as any);

      const mockFunnel = { id: 123, name: "Test Funnel" };
      const mockTheme = { id: 456 };
      const mockHomePage = { id: 789, name: "Home" };
      const mockFunnelWithTheme = {
        ...mockFunnel,
        theme: mockTheme,
        pages: [],
      };

      mockPrisma.funnel.create.mockResolvedValue(mockFunnel);
      mockPrisma.theme.create.mockResolvedValue(mockTheme);
      mockPrisma.funnel.update.mockResolvedValue(mockFunnelWithTheme);
      mockPrisma.page.create.mockResolvedValue(mockHomePage);

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const result = await callback(mockPrisma);
        return result;
      });

      const result = await createFunnel(1, mockCreateFunnelRequest);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockCreateFunnelPayloadFactory).toHaveBeenCalledWith(
        "Test Funnel",
        "test-funnel",
        "DRAFT",
        8,
        1
      );
      expect(mockPrisma.funnel.create).toHaveBeenCalledWith({
        data: mockFunnelPayload,
      });
      expect(mockPrisma.theme.create).toHaveBeenCalledWith({ data: {} });
      expect(mockCreateFunnelSettingsPayloadFactory).toHaveBeenCalledWith(123);
      expect(mockPrisma.funnelSettings.create).toHaveBeenCalledWith({
        data: mockSettingsPayload,
      });
      expect(mockUpdateFunnelWithThemePayloadFactory).toHaveBeenCalledWith(456);
      expect(mockPrisma.funnel.update).toHaveBeenCalledWith({
        where: { id: 123 },
        data: mockThemePayload,
        include: {
          theme: true,
          pages: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              order: true,
              linkingId: true,
              seoTitle: true,
              seoDescription: true,
              seoKeywords: true,
            },
          },
        },
      });
      expect(mockCreateHomePagePayloadFactory).toHaveBeenCalledWith(123);
      expect(mockPrisma.page.create).toHaveBeenCalledWith({
        data: mockHomePagePayload,
      });

      expect(result).toEqual({
        message: "Funnel created successfully!",
        funnelId: 123,
        workspaceId: 8,
      });
    });

    it("should rollback transaction on database errors", async () => {
      const databaseError = new Error("Database constraint violation");
      mockPrisma.funnel.create.mockRejectedValue(databaseError);
      mockPrisma.$transaction.mockRejectedValue(databaseError);

      await expect(createFunnel(1, mockCreateFunnelRequest)).rejects.toThrow(
        "Database constraint violation"
      );
    });
  });

  describe("response format", () => {
    it("should return correct response format with workspaceId for cache invalidation", async () => {
      mockPrisma.workspace.findUniqueOrThrow.mockResolvedValue(mockWorkspace);
      mockPrisma.funnel.count.mockResolvedValue(0);
      mockGenerateSlug.mockReturnValue("test-funnel");
      mockGenerateUniqueSlug.mockResolvedValue("test-funnel");

      const mockFunnelPayload = { name: "Test Funnel" };
      const mockSettingsPayload = { funnelId: 123 };
      const mockHomePagePayload = { funnelId: 123 };
      const mockThemePayload = { themeId: 456 };

      mockCreateFunnelPayloadFactory.mockReturnValue(mockFunnelPayload as any);
      mockCreateFunnelSettingsPayloadFactory.mockReturnValue(mockSettingsPayload as any);
      mockCreateHomePagePayloadFactory.mockReturnValue(mockHomePagePayload as any);
      mockUpdateFunnelWithThemePayloadFactory.mockReturnValue(mockThemePayload as any);

      const mockFunnel = { id: 123, name: "Test Funnel" };
      const mockTheme = { id: 456 };
      const mockHomePage = { id: 789, name: "Home" };

      mockPrisma.funnel.create.mockResolvedValue(mockFunnel);
      mockPrisma.theme.create.mockResolvedValue(mockTheme);
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        theme: mockTheme,
        pages: [],
      });
      mockPrisma.page.create.mockResolvedValue(mockHomePage);

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return {
          funnel: {
            ...mockFunnel,
            theme: mockTheme,
            pages: [mockHomePage],
          },
          homePage: mockHomePage,
        };
      });

      const result = await createFunnel(1, mockCreateFunnelRequest);

      expect(result).toEqual({
        message: "Funnel created successfully!",
        funnelId: 123,
        workspaceId: 8,
      });
    });
  });
});