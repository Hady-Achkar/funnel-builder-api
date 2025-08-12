import { describe, it, expect, vi } from "vitest";
import { FunnelService } from "../../services";
import {
  mockPrisma,
  createMockUser,
  createMockTheme,
  createMockFunnel,
  createMockPage,
  setupFunnelServiceTest,
} from "./test-setup";

describe("FunnelService.createFunnel", () => {
  setupFunnelServiceTest();

  describe("Success Cases", () => {
    it("should create funnel successfully with valid data", async () => {
      const mockUser = createMockUser();
      const mockTheme = createMockTheme();
      const mockFunnel = createMockFunnel();
      const mockPage = createMockPage();

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);
      mockPrisma.funnel.count = vi.fn().mockResolvedValue(0);
      mockPrisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const transactionalPrisma = {
          funnel: {
            create: vi.fn().mockResolvedValue(mockFunnel),
            update: vi
              .fn()
              .mockResolvedValue({
                ...mockFunnel,
                themeId: mockTheme.id,
                theme: mockTheme,
              }),
          },
          theme: { create: vi.fn().mockResolvedValue(mockTheme) },
          page: { create: vi.fn().mockResolvedValue(mockPage) },
        };
        return await callback(transactionalPrisma);
      });

      const result = await FunnelService.createFunnel(1, {
        name: "Test Funnel",
        status: "DRAFT",
      });

      expect(result.message).toContain("created successfully");
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(mockFunnel.id);
      expect(result.data.name).toBe("Test Funnel");
      expect(result.data.status).toBe("DRAFT");
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should create funnel with auto-generated name when none provided", async () => {
      const mockUser = createMockUser();
      const mockTheme = createMockTheme();
      // Create a mock funnel with a date-formatted name to match the expected auto-generated format
      const dateFormattedName =
        new Date()
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, ".") +
        " " +
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      const mockFunnel = createMockFunnel(1, dateFormattedName);
      const mockPage = createMockPage();

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);
      mockPrisma.funnel.count = vi.fn().mockResolvedValue(0);
      mockPrisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const transactionalPrisma = {
          funnel: {
            create: vi.fn().mockResolvedValue(mockFunnel),
            update: vi
              .fn()
              .mockResolvedValue({
                ...mockFunnel,
                themeId: mockTheme.id,
                theme: mockTheme,
              }),
          },
          theme: { create: vi.fn().mockResolvedValue(mockTheme) },
          page: { create: vi.fn().mockResolvedValue(mockPage) },
        };
        return await callback(transactionalPrisma);
      });

      const result = await FunnelService.createFunnel(1, {});

      expect(result.data.name).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/); // Date format
      expect(result.data.status).toBe("DRAFT"); // Default status
    });

    it("should create funnel when under maximum limit", async () => {
      const mockUser = createMockUser(1, 3);
      const mockTheme = createMockTheme();
      const mockFunnel = createMockFunnel();
      const mockPage = createMockPage();

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);
      mockPrisma.funnel.count = vi.fn().mockResolvedValue(1);
      mockPrisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const transactionalPrisma = {
          funnel: {
            create: vi.fn().mockResolvedValue(mockFunnel),
            update: vi
              .fn()
              .mockResolvedValue({
                ...mockFunnel,
                themeId: mockTheme.id,
                theme: mockTheme,
              }),
          },
          theme: { create: vi.fn().mockResolvedValue(mockTheme) },
          page: { create: vi.fn().mockResolvedValue(mockPage) },
        };
        return await callback(transactionalPrisma);
      });

      const result = await FunnelService.createFunnel(1, {
        name: "Test Funnel",
      });

      expect(result.data.id).toBe(mockFunnel.id);
      expect(result.message).toContain("created successfully");
    });

    it("should create funnel when no maximum limit is set", async () => {
      const mockUser = createMockUser(1, null);
      const mockTheme = createMockTheme();
      const mockFunnel = createMockFunnel();
      const mockPage = createMockPage();

      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);
      mockPrisma.funnel.count = vi.fn().mockResolvedValue(10); // High count should not matter
      mockPrisma.$transaction = vi.fn().mockImplementation(async (callback) => {
        const transactionalPrisma = {
          funnel: {
            create: vi.fn().mockResolvedValue(mockFunnel),
            update: vi
              .fn()
              .mockResolvedValue({
                ...mockFunnel,
                themeId: mockTheme.id,
                theme: mockTheme,
              }),
          },
          theme: { create: vi.fn().mockResolvedValue(mockTheme) },
          page: { create: vi.fn().mockResolvedValue(mockPage) },
        };
        return await callback(transactionalPrisma);
      });

      const result = await FunnelService.createFunnel(1, {
        name: "Test Funnel",
      });

      expect(result.data.id).toBe(mockFunnel.id);
      expect(result.message).toContain("created successfully");
    });
  });

  describe("Validation Errors", () => {
    it("should throw error for invalid userId", async () => {
      await expect(
        FunnelService.createFunnel(0, { name: "Test Funnel" })
      ).rejects.toThrow("User ID is required");
    });

    it("should throw error when name is empty string", async () => {
      await expect(
        FunnelService.createFunnel(1, { name: " " }) // Space will be trimmed to empty
      ).rejects.toThrow("Invalid input: Funnel name cannot be empty");
    });

    it("should throw error when name is too long", async () => {
      const longName = "a".repeat(101);

      await expect(
        FunnelService.createFunnel(1, { name: longName })
      ).rejects.toThrow(
        "Invalid input: Funnel name must be less than 100 characters"
      );
    });

    it("should throw error for invalid status", async () => {
      await expect(
        FunnelService.createFunnel(1, {
          name: "Test Funnel",
          status: "INVALID" as any,
        })
      ).rejects.toThrow("Invalid input");
    });
  });

  describe("Business Logic Errors", () => {
    it("should throw error when user is not found", async () => {
      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(null);

      await expect(
        FunnelService.createFunnel(1, { name: "Test Funnel" })
      ).rejects.toThrow("Authentication failed: User account not found");
    });

    it("should throw error when maximum funnel limit is reached", async () => {
      const mockUser = createMockUser(1, 2);
      mockPrisma.user.findUnique = vi.fn().mockResolvedValue(mockUser);
      mockPrisma.funnel.count = vi.fn().mockResolvedValue(2);

      await expect(
        FunnelService.createFunnel(1, { name: "Test Funnel" })
      ).rejects.toThrow(
        "Funnel creation limit reached: You've reached your limit of 2 funnels"
      );
    });
  });
});
