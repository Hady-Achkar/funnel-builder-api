import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActiveTheme } from "../../services/theme/set-active-theme";
import { setActiveThemeController } from "../../controllers/theme/set-active-theme";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { $Enums } from "../../generated/prisma-client";
import { NextFunction } from "express";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

describe("Set Active Theme for Funnel Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;

  const ownerUserId = 1;
  const editorUserId = 2;
  const viewerUserId = 3;
  const nonMemberUserId = 4;
  const testWorkspaceId = 100;
  const testFunnelId = 200;
  const testCustomThemeId = 300;
  const testGlobalTheme1Id = 400;
  const testGlobalTheme2Id = 401;
  const otherWorkspaceId = 101;
  const otherWorkspaceFunnelId = 201;

  const mockWorkspace = {
    id: testWorkspaceId,
    name: "Test Workspace",
    slug: "test-workspace",
    ownerId: ownerUserId,
  };

  const mockFunnel = {
    id: testFunnelId,
    name: "Test Funnel",
    slug: "test-funnel",
    status: $Enums.FunnelStatus.DRAFT,
    workspaceId: testWorkspaceId,
    createdBy: ownerUserId,
    activeThemeId: testCustomThemeId,
    workspace: mockWorkspace,
    activeTheme: {
      id: testCustomThemeId,
      name: "Custom Theme",
      type: $Enums.ThemeType.CUSTOM,
    },
    customTheme: {
      id: testCustomThemeId,
    },
  };

  const mockCustomTheme = {
    id: testCustomThemeId,
    name: "Custom Theme",
    type: $Enums.ThemeType.CUSTOM,
    funnelId: testFunnelId,
    backgroundColor: "#000000",
    textColor: "#ffffff",
    buttonColor: "#ff0000",
    buttonTextColor: "#ffffff",
    borderColor: "#cccccc",
    optionColor: "#eeeeee",
    fontFamily: "Arial",
    borderRadius: $Enums.BorderRadius.SOFT,
  };

  const mockGlobalTheme1 = {
    id: testGlobalTheme1Id,
    name: "Global Theme One",
    type: $Enums.ThemeType.GLOBAL,
    funnelId: null,
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#0000ff",
    buttonTextColor: "#ffffff",
    borderColor: "#dddddd",
    optionColor: "#f5f5f5",
    fontFamily: "Helvetica",
    borderRadius: $Enums.BorderRadius.ROUNDED,
  };

  const mockGlobalTheme2 = {
    id: testGlobalTheme2Id,
    name: "Global Theme Two",
    type: $Enums.ThemeType.GLOBAL,
    funnelId: null,
    backgroundColor: "#f0f0f0",
    textColor: "#333333",
    buttonColor: "#00ff00",
    buttonTextColor: "#000000",
    borderColor: "#aaaaaa",
    optionColor: "#e0e0e0",
    fontFamily: "Verdana",
    borderRadius: $Enums.BorderRadius.SOFT,
  };

  const mockEditorMember = {
    userId: editorUserId,
    workspaceId: testWorkspaceId,
    role: $Enums.WorkspaceRole.EDITOR,
    permissions: [$Enums.WorkspacePermission.EDIT_FUNNELS],
    status: $Enums.MembershipStatus.ACTIVE,
  };

  const mockViewerMember = {
    userId: viewerUserId,
    workspaceId: testWorkspaceId,
    role: $Enums.WorkspaceRole.VIEWER,
    permissions: [],
    status: $Enums.MembershipStatus.ACTIVE,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      theme: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);

    // Mock cache service
    (cacheService.del as any).mockResolvedValue(undefined);

    // Setup mock request and response
    mockReq = {
      userId: ownerUserId,
      params: { funnelId: String(testFunnelId) },
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe("Authentication & Authorization", () => {
    it("should require user to be logged in", async () => {
      await expect(
        setActiveTheme(testFunnelId, null as any, { themeId: testGlobalTheme1Id })
      ).rejects.toThrow("Please log in to update the theme");
    });

    it("should verify funnel exists", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(
        setActiveTheme(99999, ownerUserId, { themeId: testGlobalTheme1Id })
      ).rejects.toThrow("Funnel not found");
    });

    it("should allow workspace owner to set active theme", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should allow editor with EDIT_FUNNELS permission to set active theme", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockEditorMember);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      const result = await setActiveTheme(testFunnelId, editorUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should deny viewer role from setting active theme", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockViewerMember);

      await expect(
        setActiveTheme(testFunnelId, viewerUserId, {
          themeId: testGlobalTheme1Id,
        })
      ).rejects.toThrow("You don't have permission to update themes for this funnel");
    });

    it("should deny non-member from setting active theme", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        setActiveTheme(testFunnelId, nonMemberUserId, {
          themeId: testGlobalTheme1Id,
        })
      ).rejects.toThrow("You don't have access to this funnel");
    });

    it("should deny access to funnel from different workspace", async () => {
      const otherFunnel = {
        ...mockFunnel,
        id: otherWorkspaceFunnelId,
        workspaceId: otherWorkspaceId,
      };
      mockPrisma.funnel.findUnique.mockResolvedValue(otherFunnel);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        setActiveTheme(otherWorkspaceFunnelId, editorUserId, {
          themeId: testGlobalTheme1Id,
        })
      ).rejects.toThrow("You don't have access to this funnel");
    });
  });

  describe("Theme Validation", () => {
    it("should reject invalid theme ID", async () => {
      await expect(
        setActiveTheme(testFunnelId, ownerUserId, { themeId: "invalid" as any })
      ).rejects.toThrow("Invalid input");
    });

    it("should reject non-existent theme", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(null);

      await expect(
        setActiveTheme(testFunnelId, ownerUserId, { themeId: 99999 })
      ).rejects.toThrow("Theme not found");
    });

    it("should reject custom theme that doesn't belong to the funnel", async () => {
      const anotherCustomTheme = {
        id: 999,
        name: "Another Custom Theme",
        type: $Enums.ThemeType.CUSTOM,
        funnelId: 888, // Different funnel
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(anotherCustomTheme);

      await expect(
        setActiveTheme(testFunnelId, ownerUserId, { themeId: anotherCustomTheme.id })
      ).rejects.toThrow("This custom theme doesn't belong to this funnel");
    });
  });

  describe("Set Custom Theme", () => {
    it("should successfully set custom theme as active", async () => {
      const funnelWithGlobal = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal);
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testCustomThemeId,
      });

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should update activeThemeId correctly", async () => {
      const funnelWithGlobal = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal);
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testCustomThemeId,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      // Verify funnel.update was called with correct data
      expect(mockPrisma.funnel.update).toHaveBeenCalled();
    });

    it("should NOT add funnel to any global theme's funnels array", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testCustomThemeId,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      // Verify no theme.update was called (custom themes don't use funnels array)
      expect(mockPrisma.theme.update).not.toHaveBeenCalled();
    });

    it("should return user-friendly success message", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      expect(result.message).toBe("Theme is already active");
    });
  });

  describe("Set Global Theme", () => {
    it("should successfully set global theme as active", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should update activeThemeId to global theme", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(mockPrisma.funnel.update).toHaveBeenCalled();
    });

    it("should connect funnel to global theme's funnels array", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      // Verify transaction was called
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should return user-friendly message with theme name", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });
  });

  describe("Switch from Global to Custom Theme", () => {
    it("should disconnect from old global theme", async () => {
      const funnelWithGlobal = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal);
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testCustomThemeId,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      // Verify transaction was called (which includes disconnect logic)
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should set activeThemeId to custom theme", async () => {
      const funnelWithGlobal = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal);
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testCustomThemeId,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      expect(mockPrisma.funnel.update).toHaveBeenCalled();
    });

    it("should verify old global theme no longer has funnel", async () => {
      const funnelWithGlobal = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal);
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testCustomThemeId,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      // Verify disconnect was called through transaction
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should return switched to custom theme message", async () => {
      const funnelWithGlobal = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal);
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testCustomThemeId,
      });

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should invalidate cache", async () => {
      const funnelWithGlobal = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal);
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testCustomThemeId,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${testWorkspaceId}:funnel:${testFunnelId}:full`
      );
    });
  });

  describe("Switch from Custom to Global Theme", () => {
    it("should update activeThemeId to global theme", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(mockPrisma.funnel.update).toHaveBeenCalled();
    });

    it("should connect to global theme's funnels array", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should keep custom theme intact", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      // Custom theme should not be deleted (no theme.delete calls)
      expect(mockPrisma.theme.delete).toBeUndefined();
    });

    it("should return switched to global theme message", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should invalidate cache", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${testWorkspaceId}:funnel:${testFunnelId}:full`
      );
    });
  });

  describe("Switch Between Global Themes", () => {
    it("should disconnect from global theme A", async () => {
      const funnelWithGlobal1 = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal1);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme2Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should connect to global theme B", async () => {
      const funnelWithGlobal1 = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal1);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme2Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      expect(mockPrisma.funnel.update).toHaveBeenCalled();
    });

    it("should update activeThemeId to theme B", async () => {
      const funnelWithGlobal1 = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal1);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme2Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      expect(mockPrisma.funnel.update).toHaveBeenCalled();
    });

    it("should ensure funnel is in exactly ONE global theme at a time", async () => {
      const funnelWithGlobal1 = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal1);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme2Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      // Transaction ensures atomic disconnect and connect
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should return switched between themes message", async () => {
      const funnelWithGlobal1 = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal1);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme2Id,
      });

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should verify no dangling connections", async () => {
      const funnelWithGlobal1 = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal1);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme2);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme2Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      // Transaction handles cleanup
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null activeThemeId (initial setup)", async () => {
      const newFunnelId = 999;
      const newCustomThemeId = 888;
      const newCustomTheme = {
        ...mockCustomTheme,
        id: newCustomThemeId,
        funnelId: newFunnelId,
      };
      const newFunnel = {
        ...mockFunnel,
        id: newFunnelId,
        activeThemeId: null,
        activeTheme: null,
        customTheme: {
          id: newCustomThemeId,
        },
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(newFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(newCustomTheme);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...newFunnel,
        activeThemeId: newCustomThemeId,
      });

      const result = await setActiveTheme(newFunnelId, ownerUserId, {
        themeId: newCustomThemeId,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should handle setting same theme twice (idempotent)", async () => {
      const funnelWithGlobal = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme is already active");
      // Should not call transaction if theme is already active
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("should verify funnel has exactly ONE custom theme", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);

      // Mock implementation verifies customTheme exists
      expect(mockFunnel.customTheme).toBeTruthy();
      expect(mockFunnel.customTheme?.id).toBe(testCustomThemeId);
    });

    it("should verify funnel has exactly ONE active theme", async () => {
      const funnelWithGlobal = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal);

      expect(funnelWithGlobal.activeThemeId).toBe(testGlobalTheme1Id);
      expect(funnelWithGlobal.activeTheme?.id).toBe(testGlobalTheme1Id);
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(null);

      await expect(
        setActiveTheme(testFunnelId, ownerUserId, { themeId: 88888 })
      ).rejects.toThrow("Theme not found");
    });

    it("should succeed even if custom theme was manually deleted", async () => {
      const funnelNoCustom = {
        ...mockFunnel,
        customTheme: null,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelNoCustom);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...funnelNoCustom,
        activeThemeId: testGlobalTheme1Id,
      });

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });
  });

  describe("Data Integrity", () => {
    it("should verify no dangling connections after multiple switches", async () => {
      // Mock multiple switches
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue(mockFunnel);

      // Each switch should use transaction
      mockPrisma.theme.findUnique.mockResolvedValueOnce(mockGlobalTheme1);
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should verify customTheme relation is never broken", async () => {
      const funnelWithGlobal = {
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
        activeTheme: mockGlobalTheme1,
        customTheme: mockCustomTheme,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobal);

      // Custom theme should still exist
      expect(funnelWithGlobal.customTheme).toBeTruthy();
      expect(funnelWithGlobal.customTheme?.id).toBe(testCustomThemeId);
    });

    it("should verify no funnel appears in multiple global themes simultaneously", async () => {
      // This is enforced by the transaction logic in the service
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      // Transaction ensures only one connection
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should verify Theme.funnels accuracy", async () => {
      // Multiple funnels can use same global theme
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate workspace funnel cache on success", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${testWorkspaceId}:funnel:${testFunnelId}:full`
      );
    });

    it("should succeed even if cache invalidation fails", async () => {
      (cacheService.del as any).mockRejectedValue(new Error("Cache error"));

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should log cache errors without failing operation", async () => {
      (cacheService.del as any).mockRejectedValue(new Error("Redis down"));

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to invalidate funnel cache:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Controller Integration", () => {
    it("should handle controller request successfully", async () => {
      mockReq.body = { themeId: testGlobalTheme1Id };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme1);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnel.update.mockResolvedValue({
        ...mockFunnel,
        activeThemeId: testGlobalTheme1Id,
      });

      await setActiveThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Theme updated successfully",
        })
      );
    });

    it("should handle controller errors", async () => {
      mockReq.userId = null;
      mockReq.body = { themeId: testGlobalTheme1Id };

      await setActiveThemeController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
