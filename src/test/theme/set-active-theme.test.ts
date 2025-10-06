import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActiveTheme } from "../../services/theme/set-active-theme";
import { setActiveThemeController } from "../../controllers/theme/set-active-theme";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { PrismaClient, $Enums } from "../../generated/prisma-client";
import { NextFunction } from "express";

vi.mock("../../services/cache/cache.service");

describe("Set Active Theme for Funnel Tests", () => {
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();
  let testWorkspaceId: number;
  let testFunnelId: number;
  let testCustomThemeId: number;
  let testGlobalTheme1Id: number;
  let testGlobalTheme2Id: number;
  let ownerUserId: number;
  let editorUserId: number;
  let viewerUserId: number;
  let nonMemberUserId: number;
  let otherWorkspaceId: number;
  let otherWorkspaceFunnelId: number;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock cache service
    (cacheService.del as any).mockResolvedValue(undefined);

    // Create owner user
    const owner = await prisma.user.create({
      data: {
        email: `owner-${Date.now()}@test.com`,
        username: `owner-${Date.now()}`,
        firstName: "Owner",
        lastName: "User",
        password: "hashedpassword",
        plan: $Enums.UserPlan.BUSINESS,
      },
    });
    ownerUserId = owner.id;

    // Create test workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: `Test Workspace ${Date.now()}`,
        slug: `test-workspace-${Date.now()}`,
        ownerId: ownerUserId,
      },
    });
    testWorkspaceId = workspace.id;

    // Create funnel with custom theme
    const funnel = await prisma.funnel.create({
      data: {
        name: `Test Funnel ${Date.now()}`,
        slug: `test-funnel-${Date.now()}`,
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId: testWorkspaceId,
        createdBy: ownerUserId,
      },
    });
    testFunnelId = funnel.id;

    // Create custom theme for the funnel
    const customTheme = await prisma.theme.create({
      data: {
        name: "Custom Theme",
        type: $Enums.ThemeType.CUSTOM,
        funnelId: testFunnelId,
      },
    });
    testCustomThemeId = customTheme.id;

    // Set custom theme as active
    await prisma.funnel.update({
      where: { id: testFunnelId },
      data: { activeThemeId: testCustomThemeId },
    });

    // Create global themes
    const globalTheme1 = await prisma.theme.create({
      data: {
        name: "Global Theme One",
        type: $Enums.ThemeType.GLOBAL,
        funnelId: null,
      },
    });
    testGlobalTheme1Id = globalTheme1.id;

    const globalTheme2 = await prisma.theme.create({
      data: {
        name: "Global Theme Two",
        type: $Enums.ThemeType.GLOBAL,
        funnelId: null,
      },
    });
    testGlobalTheme2Id = globalTheme2.id;

    // Create editor user
    const editor = await prisma.user.create({
      data: {
        email: `editor-${Date.now()}@test.com`,
        username: `editor-${Date.now()}`,
        firstName: "Editor",
        lastName: "User",
        password: "hashedpassword",
        plan: $Enums.UserPlan.FREE,
      },
    });
    editorUserId = editor.id;

    await prisma.workspaceMember.create({
      data: {
        userId: editorUserId,
        workspaceId: testWorkspaceId,
        role: $Enums.WorkspaceRole.EDITOR,
        permissions: [$Enums.WorkspacePermission.EDIT_FUNNELS],
      },
    });

    // Create viewer user
    const viewer = await prisma.user.create({
      data: {
        email: `viewer-${Date.now()}@test.com`,
        username: `viewer-${Date.now()}`,
        firstName: "Viewer",
        lastName: "User",
        password: "hashedpassword",
        plan: $Enums.UserPlan.FREE,
      },
    });
    viewerUserId = viewer.id;

    await prisma.workspaceMember.create({
      data: {
        userId: viewerUserId,
        workspaceId: testWorkspaceId,
        role: $Enums.WorkspaceRole.VIEWER,
        permissions: [],
      },
    });

    // Create non-member user
    const nonMember = await prisma.user.create({
      data: {
        email: `nonmember-${Date.now()}@test.com`,
        username: `nonmember-${Date.now()}`,
        firstName: "NonMember",
        lastName: "User",
        password: "hashedpassword",
        plan: $Enums.UserPlan.FREE,
      },
    });
    nonMemberUserId = nonMember.id;

    // Create another workspace and funnel for cross-workspace tests
    const otherWorkspace = await prisma.workspace.create({
      data: {
        name: `Other Workspace ${Date.now()}`,
        slug: `other-workspace-${Date.now()}`,
        ownerId: ownerUserId,
      },
    });
    otherWorkspaceId = otherWorkspace.id;

    const otherFunnel = await prisma.funnel.create({
      data: {
        name: `Other Funnel ${Date.now()}`,
        slug: `other-funnel-${Date.now()}`,
        status: $Enums.FunnelStatus.DRAFT,
        workspaceId: otherWorkspaceId,
        createdBy: ownerUserId,
      },
    });
    otherWorkspaceFunnelId = otherFunnel.id;

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

  afterEach(async () => {
    // Clean up test data
    try {
      const workspaceIds = [testWorkspaceId, otherWorkspaceId].filter(
        (id) => id !== undefined
      );
      const userIds = [ownerUserId, editorUserId, viewerUserId, nonMemberUserId].filter(
        (id) => id !== undefined
      );
      const themeIds = [testCustomThemeId, testGlobalTheme1Id, testGlobalTheme2Id].filter(
        (id) => id !== undefined
      );

      if (workspaceIds.length > 0) {
        await prisma.workspaceMember.deleteMany({
          where: { workspaceId: { in: workspaceIds } },
        });
        await prisma.funnel.deleteMany({
          where: { workspaceId: { in: workspaceIds } },
        });
      }

      if (themeIds.length > 0) {
        await prisma.theme.deleteMany({
          where: { id: { in: themeIds } },
        });
      }

      if (workspaceIds.length > 0) {
        await prisma.workspace.deleteMany({
          where: { id: { in: workspaceIds } },
        });
      }

      if (userIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }

    vi.restoreAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("should require user to be logged in", async () => {
      await expect(
        setActiveTheme(testFunnelId, null as any, { themeId: testGlobalTheme1Id })
      ).rejects.toThrow("Please log in to update the theme");
    });

    it("should verify funnel exists", async () => {
      await expect(
        setActiveTheme(99999, ownerUserId, { themeId: testGlobalTheme1Id })
      ).rejects.toThrow("Funnel not found");
    });

    it("should allow workspace owner to set active theme", async () => {
      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should allow editor with EDIT_FUNNELS permission to set active theme", async () => {
      const result = await setActiveTheme(testFunnelId, editorUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should deny viewer role from setting active theme", async () => {
      await expect(
        setActiveTheme(testFunnelId, viewerUserId, {
          themeId: testGlobalTheme1Id,
        })
      ).rejects.toThrow("You don't have permission to update themes for this funnel");
    });

    it("should deny non-member from setting active theme", async () => {
      await expect(
        setActiveTheme(testFunnelId, nonMemberUserId, {
          themeId: testGlobalTheme1Id,
        })
      ).rejects.toThrow("You don't have access to this funnel");
    });

    it("should deny access to funnel from different workspace", async () => {
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
      await expect(
        setActiveTheme(testFunnelId, ownerUserId, { themeId: 99999 })
      ).rejects.toThrow("Theme not found");
    });

    it("should reject custom theme that doesn't belong to the funnel", async () => {
      // Create another funnel with its own custom theme
      const anotherFunnel = await prisma.funnel.create({
        data: {
          name: `Another Funnel ${Date.now()}`,
          slug: `another-funnel-${Date.now()}`,
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: testWorkspaceId,
          createdBy: ownerUserId,
        },
      });

      const anotherCustomTheme = await prisma.theme.create({
        data: {
          name: "Another Custom Theme",
          type: $Enums.ThemeType.CUSTOM,
          funnelId: anotherFunnel.id,
        },
      });

      await expect(
        setActiveTheme(testFunnelId, ownerUserId, { themeId: anotherCustomTheme.id })
      ).rejects.toThrow("This custom theme doesn't belong to this funnel");

      // Cleanup
      await prisma.theme.delete({ where: { id: anotherCustomTheme.id } });
      await prisma.funnel.delete({ where: { id: anotherFunnel.id } });
    });
  });

  describe("Set Custom Theme", () => {
    it("should successfully set custom theme as active", async () => {
      // First set to global theme
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      // Then switch back to custom
      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      const updatedFunnel = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
      });

      expect(updatedFunnel?.activeThemeId).toBe(testCustomThemeId);
      expect(result.message).toBe("Theme updated successfully");
    });

    it("should update activeThemeId correctly", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      const funnel = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
        select: { activeThemeId: true },
      });

      expect(funnel?.activeThemeId).toBe(testCustomThemeId);
    });

    it("should NOT add funnel to any global theme's funnels array", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      const globalTheme1 = await prisma.theme.findUnique({
        where: { id: testGlobalTheme1Id },
        include: { funnels: true },
      });

      const globalTheme2 = await prisma.theme.findUnique({
        where: { id: testGlobalTheme2Id },
        include: { funnels: true },
      });

      expect(globalTheme1?.funnels).toHaveLength(0);
      expect(globalTheme2?.funnels).toHaveLength(0);
    });

    it("should return user-friendly success message", async () => {
      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      expect(result.message).toBe("Theme is already active");
    });
  });

  describe("Set Global Theme", () => {
    it("should successfully set global theme as active", async () => {
      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      const updatedFunnel = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
      });

      expect(updatedFunnel?.activeThemeId).toBe(testGlobalTheme1Id);
      expect(result.message).toBe("Theme updated successfully");
    });

    it("should update activeThemeId to global theme", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      const funnel = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
        select: { activeThemeId: true },
      });

      expect(funnel?.activeThemeId).toBe(testGlobalTheme1Id);
    });

    it("should connect funnel to global theme's funnels array", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      const globalTheme = await prisma.theme.findUnique({
        where: { id: testGlobalTheme1Id },
        include: { funnels: true },
      });

      expect(globalTheme?.funnels).toHaveLength(1);
      expect(globalTheme?.funnels[0].id).toBe(testFunnelId);
    });

    it("should return user-friendly message with theme name", async () => {
      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });
  });

  describe("Switch from Global to Custom Theme", () => {
    beforeEach(async () => {
      // Set global theme as active first
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });
    });

    it("should disconnect from old global theme", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      const globalTheme = await prisma.theme.findUnique({
        where: { id: testGlobalTheme1Id },
        include: { funnels: true },
      });

      expect(globalTheme?.funnels).toHaveLength(0);
    });

    it("should set activeThemeId to custom theme", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      const funnel = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
        select: { activeThemeId: true },
      });

      expect(funnel?.activeThemeId).toBe(testCustomThemeId);
    });

    it("should verify old global theme no longer has funnel", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      const oldGlobalTheme = await prisma.theme.findUnique({
        where: { id: testGlobalTheme1Id },
        include: { funnels: { where: { id: testFunnelId } } },
      });

      expect(oldGlobalTheme?.funnels).toHaveLength(0);
    });

    it("should return switched to custom theme message", async () => {
      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should invalidate cache", async () => {
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
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      const funnel = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
        select: { activeThemeId: true },
      });

      expect(funnel?.activeThemeId).toBe(testGlobalTheme1Id);
    });

    it("should connect to global theme's funnels array", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      const globalTheme = await prisma.theme.findUnique({
        where: { id: testGlobalTheme1Id },
        include: { funnels: true },
      });

      expect(globalTheme?.funnels.some((f) => f.id === testFunnelId)).toBe(true);
    });

    it("should keep custom theme intact", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      const customTheme = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
      });

      expect(customTheme).toBeTruthy();
      expect(customTheme?.funnelId).toBe(testFunnelId);
    });

    it("should return switched to global theme message", async () => {
      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should invalidate cache", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${testWorkspaceId}:funnel:${testFunnelId}:full`
      );
    });
  });

  describe("Switch Between Global Themes", () => {
    beforeEach(async () => {
      // Set global theme 1 as active first
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });
    });

    it("should disconnect from global theme A", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      const themeA = await prisma.theme.findUnique({
        where: { id: testGlobalTheme1Id },
        include: { funnels: true },
      });

      expect(themeA?.funnels).toHaveLength(0);
    });

    it("should connect to global theme B", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      const themeB = await prisma.theme.findUnique({
        where: { id: testGlobalTheme2Id },
        include: { funnels: true },
      });

      expect(themeB?.funnels).toHaveLength(1);
      expect(themeB?.funnels[0].id).toBe(testFunnelId);
    });

    it("should update activeThemeId to theme B", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      const funnel = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
        select: { activeThemeId: true },
      });

      expect(funnel?.activeThemeId).toBe(testGlobalTheme2Id);
    });

    it("should ensure funnel is in exactly ONE global theme at a time", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      const allThemes = await prisma.theme.findMany({
        where: {
          type: $Enums.ThemeType.GLOBAL,
          funnels: { some: { id: testFunnelId } },
        },
      });

      expect(allThemes).toHaveLength(1);
      expect(allThemes[0].id).toBe(testGlobalTheme2Id);
    });

    it("should return switched between themes message", async () => {
      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should verify no dangling connections", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });

      const theme1 = await prisma.theme.findUnique({
        where: { id: testGlobalTheme1Id },
        include: { funnels: { where: { id: testFunnelId } } },
      });

      const theme2 = await prisma.theme.findUnique({
        where: { id: testGlobalTheme2Id },
        include: { funnels: { where: { id: testFunnelId } } },
      });

      expect(theme1?.funnels).toHaveLength(0);
      expect(theme2?.funnels).toHaveLength(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null activeThemeId (initial setup)", async () => {
      // Create funnel without active theme
      const newFunnel = await prisma.funnel.create({
        data: {
          name: `New Funnel ${Date.now()}`,
          slug: `new-funnel-${Date.now()}`,
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: testWorkspaceId,
          createdBy: ownerUserId,
          activeThemeId: null,
        },
      });

      const newCustomTheme = await prisma.theme.create({
        data: {
          name: "New Custom Theme",
          type: $Enums.ThemeType.CUSTOM,
          funnelId: newFunnel.id,
        },
      });

      const result = await setActiveTheme(newFunnel.id, ownerUserId, {
        themeId: newCustomTheme.id,
      });

      expect(result.message).toBe("Theme updated successfully");

      // Cleanup
      await prisma.theme.delete({ where: { id: newCustomTheme.id } });
      await prisma.funnel.delete({ where: { id: newFunnel.id } });
    });

    it("should handle setting same theme twice (idempotent)", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      const result = await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme is already active");

      const globalTheme = await prisma.theme.findUnique({
        where: { id: testGlobalTheme1Id },
        include: { funnels: true },
      });

      // Should still have exactly one connection
      expect(globalTheme?.funnels).toHaveLength(1);
    });

    it("should verify funnel has exactly ONE custom theme", async () => {
      const funnel = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
        include: { customTheme: true },
      });

      expect(funnel?.customTheme).toBeTruthy();
      expect(funnel?.customTheme?.type).toBe($Enums.ThemeType.CUSTOM);
      expect(funnel?.customTheme?.funnelId).toBe(testFunnelId);

      // Verify there's only one custom theme for this funnel
      const customThemes = await prisma.theme.findMany({
        where: {
          type: $Enums.ThemeType.CUSTOM,
          funnelId: testFunnelId,
        },
      });

      expect(customThemes).toHaveLength(1);
    });

    it("should verify funnel has exactly ONE active theme", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      const funnel = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
        select: {
          activeThemeId: true,
          activeTheme: true,
        },
      });

      expect(funnel?.activeThemeId).toBe(testGlobalTheme1Id);
      expect(funnel?.activeTheme?.id).toBe(testGlobalTheme1Id);

      // Verify funnel appears in only one global theme's funnels array
      const globalThemes = await prisma.theme.findMany({
        where: {
          type: $Enums.ThemeType.GLOBAL,
          funnels: { some: { id: testFunnelId } },
        },
      });

      expect(globalThemes).toHaveLength(1);
    });

    it("should handle database errors gracefully", async () => {
      // Trigger a constraint error by passing a deleted theme
      const tempTheme = await prisma.theme.create({
        data: {
          name: "Temp Theme",
          type: $Enums.ThemeType.GLOBAL,
        },
      });

      const tempThemeId = tempTheme.id;
      await prisma.theme.delete({ where: { id: tempThemeId } });

      await expect(
        setActiveTheme(testFunnelId, ownerUserId, { themeId: tempThemeId })
      ).rejects.toThrow("Theme not found");
    });

    it("should succeed even if custom theme was manually deleted", async () => {
      // This tests graceful handling of data integrity issues
      // Create a funnel without custom theme (edge case)
      const funnelNoCustom = await prisma.funnel.create({
        data: {
          name: `Funnel No Custom ${Date.now()}`,
          slug: `funnel-no-custom-${Date.now()}`,
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: testWorkspaceId,
          createdBy: ownerUserId,
        },
      });

      // Should still be able to set global theme
      const result = await setActiveTheme(funnelNoCustom.id, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      expect(result.message).toBe("Theme updated successfully");

      // Cleanup
      await prisma.funnel.delete({ where: { id: funnelNoCustom.id } });
    });
  });

  describe("Data Integrity", () => {
    it("should verify no dangling connections after multiple switches", async () => {
      // Switch multiple times
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme2Id,
      });
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testCustomThemeId,
      });
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      // Check all global themes
      const allGlobalThemes = await prisma.theme.findMany({
        where: { type: $Enums.ThemeType.GLOBAL },
        include: { funnels: true },
      });

      const themesWithFunnel = allGlobalThemes.filter((theme) =>
        theme.funnels.some((f) => f.id === testFunnelId)
      );

      expect(themesWithFunnel).toHaveLength(1);
      expect(themesWithFunnel[0].id).toBe(testGlobalTheme1Id);
    });

    it("should verify customTheme relation is never broken", async () => {
      // Switch to global theme
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      // Custom theme should still exist and be linked via funnelId (CustomTheme relation)
      const funnel = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
        include: { customTheme: true },
      });

      expect(funnel?.customTheme).toBeTruthy();
      expect(funnel?.customTheme?.id).toBe(testCustomThemeId);
      expect(funnel?.customTheme?.funnelId).toBe(testFunnelId);

      // Verify custom theme NEVER uses the funnels array (that's only for global themes)
      const customTheme = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
        include: { funnels: true },
      });

      expect(customTheme?.funnels).toHaveLength(0);
      expect(customTheme?.type).toBe($Enums.ThemeType.CUSTOM);
      expect(customTheme?.funnelId).toBe(testFunnelId);
    });

    it("should verify no funnel appears in multiple global themes simultaneously", async () => {
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      const globalThemesWithFunnel = await prisma.theme.findMany({
        where: {
          type: $Enums.ThemeType.GLOBAL,
          funnels: { some: { id: testFunnelId } },
        },
      });

      expect(globalThemesWithFunnel).toHaveLength(1);
    });

    it("should verify Theme.funnels accuracy", async () => {
      // Create multiple funnels and set them to different themes
      const funnel2 = await prisma.funnel.create({
        data: {
          name: `Funnel 2 ${Date.now()}`,
          slug: `funnel-2-${Date.now()}`,
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: testWorkspaceId,
          createdBy: ownerUserId,
        },
      });

      const customTheme2 = await prisma.theme.create({
        data: {
          name: "Custom Theme 2",
          type: $Enums.ThemeType.CUSTOM,
          funnelId: funnel2.id,
        },
      });

      await prisma.funnel.update({
        where: { id: funnel2.id },
        data: { activeThemeId: customTheme2.id },
      });

      // Set both funnels to the same global theme
      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });
      await setActiveTheme(funnel2.id, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      const globalTheme = await prisma.theme.findUnique({
        where: { id: testGlobalTheme1Id },
        include: { funnels: true },
      });

      expect(globalTheme?.funnels).toHaveLength(2);
      expect(globalTheme?.funnels.map((f) => f.id)).toContain(testFunnelId);
      expect(globalTheme?.funnels.map((f) => f.id)).toContain(funnel2.id);

      // Cleanup
      await prisma.theme.delete({ where: { id: customTheme2.id } });
      await prisma.funnel.delete({ where: { id: funnel2.id } });
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate workspace funnel cache on success", async () => {
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

      await setActiveTheme(testFunnelId, ownerUserId, {
        themeId: testGlobalTheme1Id,
      });

      const funnel = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
        select: { activeThemeId: true },
      });

      expect(funnel?.activeThemeId).toBe(testGlobalTheme1Id);
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
