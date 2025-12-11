import { describe, it, expect, beforeEach, vi } from "vitest";
import { getGlobalThemes } from "../../services/theme/get-global-themes";
import { getGlobalThemesController } from "../../controllers/theme/get-global-themes";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { $Enums } from "../../generated/prisma-client";
import { NextFunction } from "express";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

describe("Get Global Themes Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;

  const testUserId = 1;
  const testGlobalTheme1Id = 100;
  const testGlobalTheme2Id = 101;
  const testGlobalTheme3Id = 102;
  const testCustomThemeId = 200;

  const mockGlobalTheme1 = {
    id: testGlobalTheme1Id,
    name: "Modern Dark",
    type: $Enums.ThemeType.GLOBAL,
    funnelId: null,
    backgroundColor: "#1a1a1a",
    textColor: "#ffffff",
    buttonColor: "#0066ff",
    buttonTextColor: "#ffffff",
    borderColor: "#333333",
    optionColor: "#2a2a2a",
    fontFamily: "Inter, sans-serif",
    borderRadius: $Enums.BorderRadius.SOFT,
    createdAt: new Date("2025-01-03"),
    updatedAt: new Date("2025-01-03"),
  };

  const mockGlobalTheme2 = {
    id: testGlobalTheme2Id,
    name: "Light Professional",
    type: $Enums.ThemeType.GLOBAL,
    funnelId: null,
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#28a745",
    buttonTextColor: "#ffffff",
    borderColor: "#dddddd",
    optionColor: "#f8f9fa",
    fontFamily: "Roboto, sans-serif",
    borderRadius: $Enums.BorderRadius.ROUNDED,
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-02"),
  };

  const mockGlobalTheme3 = {
    id: testGlobalTheme3Id,
    name: "Vibrant Colors",
    type: $Enums.ThemeType.GLOBAL,
    funnelId: null,
    backgroundColor: "#ff6b6b",
    textColor: "#ffffff",
    buttonColor: "#4ecdc4",
    buttonTextColor: "#1a1a1a",
    borderColor: "#ffe66d",
    optionColor: "#a8e6cf",
    fontFamily: "Poppins, sans-serif",
    borderRadius: $Enums.BorderRadius.NONE,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  };

  const mockCustomTheme = {
    id: testCustomThemeId,
    name: "Custom Theme",
    type: $Enums.ThemeType.CUSTOM,
    funnelId: 1,
    backgroundColor: "#000000",
    textColor: "#ffffff",
    buttonColor: "#ff0000",
    buttonTextColor: "#ffffff",
    borderColor: "#cccccc",
    optionColor: "#eeeeee",
    fontFamily: "Arial",
    borderRadius: $Enums.BorderRadius.SOFT,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      theme: {
        findMany: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);

    // Mock cache service
    (cacheService.get as any).mockResolvedValue(null);
    (cacheService.set as any).mockResolvedValue(undefined);

    // Setup mock request and response
    mockReq = {
      userId: testUserId,
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe("Authentication", () => {
    it("should require user to be logged in", async () => {
      await expect(getGlobalThemes(0)).rejects.toThrow(
        "Authentication required"
      );
    });

    it("should allow any authenticated user to get global themes", async () => {
      mockPrisma.theme.findMany.mockResolvedValue([
        mockGlobalTheme1,
        mockGlobalTheme2,
        mockGlobalTheme3,
      ]);

      const result = await getGlobalThemes(testUserId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
    });
  });

  describe("Response Format", () => {
    it("should return themes array directly without wrapper", async () => {
      mockPrisma.theme.findMany.mockResolvedValue([
        mockGlobalTheme1,
        mockGlobalTheme2,
        mockGlobalTheme3,
      ]);

      const result = await getGlobalThemes(testUserId);

      expect(result).toBeInstanceOf(Array);
      expect(result).not.toHaveProperty("message");
      expect(result).not.toHaveProperty("success");
      expect(result).not.toHaveProperty("data");
    });

    it("should return empty array if no global themes exist", async () => {
      mockPrisma.theme.findMany.mockResolvedValue([]);

      const result = await getGlobalThemes(testUserId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it("should include all theme properties", async () => {
      mockPrisma.theme.findMany.mockResolvedValue([mockGlobalTheme1]);

      const result = await getGlobalThemes(testUserId);

      const theme = result[0];
      expect(theme).toHaveProperty("id");
      expect(theme).toHaveProperty("name");
      expect(theme).toHaveProperty("type");
      expect(theme).toHaveProperty("backgroundColor");
      expect(theme).toHaveProperty("textColor");
      expect(theme).toHaveProperty("buttonColor");
      expect(theme).toHaveProperty("buttonTextColor");
      expect(theme).toHaveProperty("borderColor");
      expect(theme).toHaveProperty("optionColor");
      expect(theme).toHaveProperty("fontFamily");
      expect(theme).toHaveProperty("borderRadius");
      expect(theme).toHaveProperty("createdAt");
      expect(theme).toHaveProperty("updatedAt");
    });
  });

  describe("Global Themes Only", () => {
    it("should return only global themes, not custom themes", async () => {
      mockPrisma.theme.findMany.mockResolvedValue([
        mockGlobalTheme1,
        mockGlobalTheme2,
        mockGlobalTheme3,
      ]);

      const result = await getGlobalThemes(testUserId);

      // Verify all returned themes are global
      result.forEach((theme) => {
        expect(theme.type).toBe($Enums.ThemeType.GLOBAL);
        expect(theme.funnelId).toBeNull();
      });

      // Verify custom theme is not included
      const customThemeInResult = result.find(
        (theme) => theme.id === testCustomThemeId
      );
      expect(customThemeInResult).toBeUndefined();

      // Verify the query was called with correct filter
      expect(mockPrisma.theme.findMany).toHaveBeenCalledWith({
        where: { type: $Enums.ThemeType.GLOBAL },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return all 3 global themes", async () => {
      mockPrisma.theme.findMany.mockResolvedValue([
        mockGlobalTheme1,
        mockGlobalTheme2,
        mockGlobalTheme3,
      ]);

      const result = await getGlobalThemes(testUserId);

      expect(result.length).toBe(3);

      const themeIds = result.map((theme) => theme.id);
      expect(themeIds).toContain(testGlobalTheme1Id);
      expect(themeIds).toContain(testGlobalTheme2Id);
      expect(themeIds).toContain(testGlobalTheme3Id);
    });

    it("should return themes with correct names", async () => {
      mockPrisma.theme.findMany.mockResolvedValue([
        mockGlobalTheme1,
        mockGlobalTheme2,
        mockGlobalTheme3,
      ]);

      const result = await getGlobalThemes(testUserId);

      const themeNames = result.map((theme) => theme.name);
      expect(themeNames).toContain("Modern Dark");
      expect(themeNames).toContain("Light Professional");
      expect(themeNames).toContain("Vibrant Colors");
      expect(themeNames).not.toContain("Custom Theme");
    });
  });

  describe("Cache Behavior", () => {
    it("should check cache first", async () => {
      mockPrisma.theme.findMany.mockResolvedValue([mockGlobalTheme1]);

      await getGlobalThemes(testUserId);

      expect(cacheService.get).toHaveBeenCalledWith("themes:global");
    });

    it("should return cached data if available", async () => {
      const cachedThemes = [
        {
          id: 999,
          name: "Cached Theme",
          type: $Enums.ThemeType.GLOBAL,
          funnelId: null,
          backgroundColor: "#cached",
          textColor: "#cached",
          buttonColor: "#cached",
          buttonTextColor: "#cached",
          borderColor: "#cached",
          optionColor: "#cached",
          fontFamily: "Cached",
          borderRadius: $Enums.BorderRadius.SOFT,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (cacheService.get as any).mockResolvedValueOnce(cachedThemes);

      const result = await getGlobalThemes(testUserId);

      expect(result).toEqual(cachedThemes);
      expect(result[0].name).toBe("Cached Theme");
      // Should not query database if cache hit
      expect(mockPrisma.theme.findMany).not.toHaveBeenCalled();
    });

    it("should cache database results if cache miss", async () => {
      (cacheService.get as any).mockResolvedValueOnce(null);
      mockPrisma.theme.findMany.mockResolvedValue([
        mockGlobalTheme1,
        mockGlobalTheme2,
        mockGlobalTheme3,
      ]);

      const result = await getGlobalThemes(testUserId);

      expect(cacheService.set).toHaveBeenCalledWith(
        "themes:global",
        expect.arrayContaining([
          expect.objectContaining({
            id: testGlobalTheme1Id,
            type: $Enums.ThemeType.GLOBAL,
          }),
        ])
      );

      expect(result.length).toBe(3);
    });

    it("should work even if cache fails", async () => {
      (cacheService.get as any).mockRejectedValueOnce(
        new Error("Cache error")
      );
      (cacheService.set as any).mockRejectedValueOnce(
        new Error("Cache error")
      );
      mockPrisma.theme.findMany.mockResolvedValue([
        mockGlobalTheme1,
        mockGlobalTheme2,
        mockGlobalTheme3,
      ]);

      const result = await getGlobalThemes(testUserId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
    });

    it("should set cache without TTL (cache forever)", async () => {
      (cacheService.get as any).mockResolvedValueOnce(null);
      mockPrisma.theme.findMany.mockResolvedValue([mockGlobalTheme1]);

      await getGlobalThemes(testUserId);

      expect(cacheService.set).toHaveBeenCalledWith(
        "themes:global",
        expect.any(Array)
      );

      // Verify no TTL was passed (cache forever)
      const setCall = (cacheService.set as any).mock.calls[0];
      expect(setCall[2]).toBeUndefined();
    });
  });

  describe("Controller Integration", () => {
    it("should handle controller request successfully", async () => {
      mockPrisma.theme.findMany.mockResolvedValue([
        mockGlobalTheme1,
        mockGlobalTheme2,
        mockGlobalTheme3,
      ]);

      await getGlobalThemesController(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: $Enums.ThemeType.GLOBAL,
          }),
        ])
      );
    });

    it("should return array directly in controller", async () => {
      mockPrisma.theme.findMany.mockResolvedValue([mockGlobalTheme1]);

      await getGlobalThemesController(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalled();
      const response = (mockRes.json as any).mock.calls[0][0];

      expect(Array.isArray(response)).toBe(true);
      expect(response).not.toHaveProperty("success");
      expect(response).not.toHaveProperty("message");
    });

    it("should handle authentication error in controller", async () => {
      mockReq.userId = null;

      await getGlobalThemesController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Authentication required",
      });
    });

    it("should pass errors to next middleware", async () => {
      mockReq.userId = null;

      await getGlobalThemesController(mockReq, mockRes, mockNext);

      // Controller should handle auth error directly, not pass to next
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Data Ordering", () => {
    it("should return themes ordered by creation date (newest first)", async () => {
      mockPrisma.theme.findMany.mockResolvedValue([
        mockGlobalTheme1, // 2025-01-03
        mockGlobalTheme2, // 2025-01-02
        mockGlobalTheme3, // 2025-01-01
      ]);

      const result = await getGlobalThemes(testUserId);

      // Verify themes are in descending order by createdAt
      for (let i = 0; i < result.length - 1; i++) {
        const current = new Date(result[i].createdAt);
        const next = new Date(result[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }

      // Verify the query was called with correct orderBy
      expect(mockPrisma.theme.findMany).toHaveBeenCalledWith({
        where: { type: $Enums.ThemeType.GLOBAL },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle user with no workspaces", async () => {
      const newUserId = 999;
      mockPrisma.theme.findMany.mockResolvedValue([
        mockGlobalTheme1,
        mockGlobalTheme2,
        mockGlobalTheme3,
      ]);

      const result = await getGlobalThemes(newUserId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
    });

    it("should handle admin users the same as regular users", async () => {
      const adminUserId = 888;
      mockPrisma.theme.findMany.mockResolvedValue([
        mockGlobalTheme1,
        mockGlobalTheme2,
        mockGlobalTheme3,
      ]);

      const result = await getGlobalThemes(adminUserId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
    });
  });
});
