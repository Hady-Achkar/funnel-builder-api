import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { updateTheme } from "../../services/theme/update";
import { updateThemeController } from "../../controllers/theme/update";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { PrismaClient, $Enums } from "../../generated/prisma-client";
import { NextFunction } from "express";

vi.mock("../../services/cache/cache.service");

describe("Update Theme Tests", () => {
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  let testWorkspaceId: number;
  let testFunnelId: number;
  let testCustomThemeId: number;
  let testGlobalThemeId: number;
  let ownerUserId: number;
  let adminUserId: number;
  let editorUserId: number;
  let viewerUserId: number;
  let nonMemberUserId: number;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock cache service
    (cacheService.del as any).mockResolvedValue(undefined);
    (cacheService.get as any).mockResolvedValue(null);
    (cacheService.set as any).mockResolvedValue(undefined);

    // Generate unique identifier for this test run
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create owner user
    const owner = await prisma.user.create({
      data: {
        email: `owner-${uniqueId}@test.com`,
        username: `owner-${uniqueId}`,
        firstName: "Owner",
        lastName: "User",
        password: "hashedpassword",
        plan: $Enums.UserPlan.BUSINESS,
        isAdmin: false,
      },
    });
    ownerUserId = owner.id;

    // Create admin user (system admin)
    const admin = await prisma.user.create({
      data: {
        email: `admin-${uniqueId}@test.com`,
        username: `admin-${uniqueId}`,
        firstName: "Admin",
        lastName: "User",
        password: "hashedpassword",
        plan: $Enums.UserPlan.BUSINESS,
        isAdmin: true,
      },
    });
    adminUserId = admin.id;

    // Create editor user
    const editor = await prisma.user.create({
      data: {
        email: `editor-${uniqueId}@test.com`,
        username: `editor-${uniqueId}`,
        firstName: "Editor",
        lastName: "User",
        password: "hashedpassword",
        plan: $Enums.UserPlan.BUSINESS,
        isAdmin: false,
      },
    });
    editorUserId = editor.id;

    // Create viewer user
    const viewer = await prisma.user.create({
      data: {
        email: `viewer-${uniqueId}@test.com`,
        username: `viewer-${uniqueId}`,
        firstName: "Viewer",
        lastName: "User",
        password: "hashedpassword",
        plan: $Enums.UserPlan.FREE,
        isAdmin: false,
      },
    });
    viewerUserId = viewer.id;

    // Create non-member user
    const nonMember = await prisma.user.create({
      data: {
        email: `nonmember-${uniqueId}@test.com`,
        username: `nonmember-${uniqueId}`,
        firstName: "NonMember",
        lastName: "User",
        password: "hashedpassword",
        plan: $Enums.UserPlan.FREE,
        isAdmin: false,
      },
    });
    nonMemberUserId = nonMember.id;

    // Create test workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: `Test Workspace ${uniqueId}`,
        slug: `test-workspace-${uniqueId}`,
        ownerId: ownerUserId,
      },
    });
    testWorkspaceId = workspace.id;

    // Add editor as workspace member
    await prisma.workspaceMember.create({
      data: {
        userId: editorUserId,
        workspaceId: testWorkspaceId,
        role: $Enums.WorkspaceRole.EDITOR,
        permissions: [$Enums.WorkspacePermission.EDIT_FUNNELS],
        status: $Enums.MembershipStatus.ACTIVE,
      },
    });

    // Add viewer as workspace member
    await prisma.workspaceMember.create({
      data: {
        userId: viewerUserId,
        workspaceId: testWorkspaceId,
        role: $Enums.WorkspaceRole.VIEWER,
        permissions: [],
        status: $Enums.MembershipStatus.ACTIVE,
      },
    });

    // Create funnel
    const funnel = await prisma.funnel.create({
      data: {
        name: `Test Funnel ${uniqueId}`,
        slug: `test-funnel-${uniqueId}`,
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
        backgroundColor: "#000000",
        textColor: "#ffffff",
        buttonColor: "#ff0000",
        buttonTextColor: "#ffffff",
        borderColor: "#cccccc",
        optionColor: "#eeeeee",
        fontFamily: "Arial",
        borderRadius: $Enums.BorderRadius.SOFT,
      },
    });
    testCustomThemeId = customTheme.id;

    // Set custom theme as active
    await prisma.funnel.update({
      where: { id: testFunnelId },
      data: { activeThemeId: testCustomThemeId },
    });

    // Create global theme
    const globalTheme = await prisma.theme.create({
      data: {
        name: "Global Theme",
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
      },
    });
    testGlobalThemeId = globalTheme.id;

    // Setup mock request and response
    mockReq = {
      userId: ownerUserId,
      params: { id: String(testCustomThemeId) },
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
      const userIds = [ownerUserId, adminUserId, editorUserId, viewerUserId, nonMemberUserId].filter(
        (id) => id !== undefined
      );
      const themeIds = [testCustomThemeId, testGlobalThemeId].filter(
        (id) => id !== undefined
      );

      if (testWorkspaceId) {
        await prisma.workspaceMember.deleteMany({
          where: { workspaceId: testWorkspaceId },
        });
      }

      if (testFunnelId) {
        await prisma.funnel.deleteMany({
          where: { id: testFunnelId },
        });
      }

      if (themeIds.length > 0) {
        await prisma.theme.deleteMany({
          where: { id: { in: themeIds } },
        });
      }

      if (testWorkspaceId) {
        await prisma.workspace.deleteMany({
          where: { id: testWorkspaceId },
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
  });

  describe("Authentication & Authorization", () => {
    it("should require user to be logged in", async () => {
      await expect(
        updateTheme(0, { id: testCustomThemeId }, { name: "Updated Name" })
      ).rejects.toThrow("User ID is required");
    });

    it("should verify theme exists", async () => {
      await expect(
        updateTheme(ownerUserId, { id: 99999 }, { name: "Updated Name" })
      ).rejects.toThrow("Theme not found");
    });

    it("should allow workspace owner to update custom theme", async () => {
      const result = await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "Updated Custom Theme" }
      );

      expect(result.message).toBe("Theme updated successfully");

      const updatedTheme = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
      });

      expect(updatedTheme?.name).toBe("Updated Custom Theme");
    });

    it("should allow editor with EDIT_FUNNELS permission to update custom theme", async () => {
      const result = await updateTheme(
        editorUserId,
        { id: testCustomThemeId },
        { name: "Editor Updated Theme" }
      );

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should deny viewer role from updating theme", async () => {
      await expect(
        updateTheme(viewerUserId, { id: testCustomThemeId }, { name: "Viewer Update" })
      ).rejects.toThrow("You don't have permission to update themes");
    });

    it("should deny non-member from updating theme", async () => {
      await expect(
        updateTheme(nonMemberUserId, { id: testCustomThemeId }, { name: "Non-Member Update" })
      ).rejects.toThrow("You don't have access to this theme");
    });
  });

  describe("Global Theme Restrictions", () => {
    it("should prevent non-admin users from updating global themes", async () => {
      await expect(
        updateTheme(ownerUserId, { id: testGlobalThemeId }, { name: "Updated Global" })
      ).rejects.toThrow("Only system administrators can update global themes");
    });

    it("should allow admin users to update global themes", async () => {
      const result = await updateTheme(
        adminUserId,
        { id: testGlobalThemeId },
        { name: "Admin Updated Global" }
      );

      expect(result.message).toBe("Theme updated successfully");

      const updatedTheme = await prisma.theme.findUnique({
        where: { id: testGlobalThemeId },
      });

      expect(updatedTheme?.name).toBe("Admin Updated Global");
    });

    it("should prevent workspace owner from updating global themes", async () => {
      await expect(
        updateTheme(ownerUserId, { id: testGlobalThemeId }, { backgroundColor: "#123456" })
      ).rejects.toThrow("Only system administrators can update global themes");
    });

    it("should prevent editor from updating global themes", async () => {
      await expect(
        updateTheme(editorUserId, { id: testGlobalThemeId }, { textColor: "#654321" })
      ).rejects.toThrow("Only system administrators can update global themes");
    });
  });

  describe("Custom Theme Updates", () => {
    it("should update theme name", async () => {
      const result = await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "New Theme Name" }
      );

      expect(result.message).toBe("Theme updated successfully");

      const theme = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
      });

      expect(theme?.name).toBe("New Theme Name");
    });

    it("should update theme colors", async () => {
      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        {
          backgroundColor: "#111111",
          textColor: "#222222",
          buttonColor: "#333333",
        }
      );

      const theme = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
      });

      expect(theme?.backgroundColor).toBe("#111111");
      expect(theme?.textColor).toBe("#222222");
      expect(theme?.buttonColor).toBe("#333333");
    });

    it("should update font family", async () => {
      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { fontFamily: "Comic Sans MS" }
      );

      const theme = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
      });

      expect(theme?.fontFamily).toBe("Comic Sans MS");
    });

    it("should update border radius", async () => {
      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { borderRadius: "ROUNDED" }
      );

      const theme = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
      });

      expect(theme?.borderRadius).toBe($Enums.BorderRadius.ROUNDED);
    });

    it("should update multiple fields at once", async () => {
      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        {
          name: "Multi Update Theme",
          backgroundColor: "#aabbcc",
          fontFamily: "Georgia",
          borderRadius: "NONE",
        }
      );

      const theme = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
      });

      expect(theme?.name).toBe("Multi Update Theme");
      expect(theme?.backgroundColor).toBe("#aabbcc");
      expect(theme?.fontFamily).toBe("Georgia");
      expect(theme?.borderRadius).toBe($Enums.BorderRadius.NONE);
    });
  });

  describe("Theme Connections Preservation", () => {
    it("should not modify theme.funnelId when updating custom theme", async () => {
      const themeBefore = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
        select: { funnelId: true },
      });

      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "Updated Name" }
      );

      const themeAfter = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
        select: { funnelId: true },
      });

      expect(themeAfter?.funnelId).toBe(themeBefore?.funnelId);
      expect(themeAfter?.funnelId).toBe(testFunnelId);
    });

    it("should not modify theme.type when updating", async () => {
      const themeBefore = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
        select: { type: true },
      });

      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "Updated Name" }
      );

      const themeAfter = await prisma.theme.findUnique({
        where: { id: testCustomThemeId },
        select: { type: true },
      });

      expect(themeAfter?.type).toBe(themeBefore?.type);
      expect(themeAfter?.type).toBe($Enums.ThemeType.CUSTOM);
    });

    it("should not affect funnel.activeThemeId when updating theme", async () => {
      const funnelBefore = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
        select: { activeThemeId: true },
      });

      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { backgroundColor: "#abcdef" }
      );

      const funnelAfter = await prisma.funnel.findUnique({
        where: { id: testFunnelId },
        select: { activeThemeId: true },
      });

      expect(funnelAfter?.activeThemeId).toBe(funnelBefore?.activeThemeId);
    });

    it("should not create or remove connections in theme.funnels array", async () => {
      // Create a second funnel with the global theme
      const funnel2 = await prisma.funnel.create({
        data: {
          name: `Test Funnel 2 ${Date.now()}`,
          slug: `test-funnel-2-${Date.now()}`,
          status: $Enums.FunnelStatus.DRAFT,
          workspaceId: testWorkspaceId,
          createdBy: ownerUserId,
          activeThemeId: testGlobalThemeId,
        },
      });

      // Connect funnel to global theme
      await prisma.theme.update({
        where: { id: testGlobalThemeId },
        data: {
          funnels: {
            connect: { id: funnel2.id },
          },
        },
      });

      const themeBefore = await prisma.theme.findUnique({
        where: { id: testGlobalThemeId },
        include: { funnels: true },
      });

      // Admin updates global theme
      await updateTheme(
        adminUserId,
        { id: testGlobalThemeId },
        { name: "Updated Global Theme" }
      );

      const themeAfter = await prisma.theme.findUnique({
        where: { id: testGlobalThemeId },
        include: { funnels: true },
      });

      expect(themeAfter?.funnels.length).toBe(themeBefore?.funnels.length);
      expect(themeAfter?.funnels[0]?.id).toBe(funnel2.id);

      // Cleanup
      await prisma.funnel.delete({ where: { id: funnel2.id } });
    });
  });

  describe("Cache Invalidation", () => {
    it("should delete cache for single funnel when updating custom theme", async () => {
      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "Cache Test" }
      );

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${testWorkspaceId}:funnel:${testFunnelId}:full`
      );
    });

    it("should invalidate global themes cache when admin updates global theme", async () => {
      await updateTheme(
        adminUserId,
        { id: testGlobalThemeId },
        { name: "Global Cache Test" }
      );

      expect(cacheService.del).toHaveBeenCalledWith("themes:global");
    });

    it("should succeed even if cache invalidation fails", async () => {
      (cacheService.del as any).mockRejectedValueOnce(new Error("Cache error"));

      const result = await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "Cache Failure Test" }
      );

      expect(result.message).toBe("Theme updated successfully");
    });
  });

  describe("Validation", () => {
    it("should reject invalid color format", async () => {
      await expect(
        updateTheme(
          ownerUserId,
          { id: testCustomThemeId },
          { backgroundColor: "red" }
        )
      ).rejects.toThrow("Background color must be a valid hex color");
    });

    it("should reject empty theme name", async () => {
      await expect(
        updateTheme(
          ownerUserId,
          { id: testCustomThemeId },
          { name: "" }
        )
      ).rejects.toThrow("Theme name cannot be empty");
    });

    it("should reject invalid border radius", async () => {
      await expect(
        updateTheme(
          ownerUserId,
          { id: testCustomThemeId },
          { borderRadius: "INVALID" as any }
        )
      ).rejects.toThrow("Border radius must be NONE, SOFT, or ROUNDED");
    });

    it("should reject empty update request", async () => {
      await expect(
        updateTheme(
          ownerUserId,
          { id: testCustomThemeId },
          {}
        )
      ).rejects.toThrow("At least one field must be provided for update");
    });

    it("should accept valid hex colors", async () => {
      const result = await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { backgroundColor: "#ABCDEF" }
      );

      expect(result.message).toBe("Theme updated successfully");
    });
  });

  describe("Controller Integration", () => {
    it("should handle controller request successfully", async () => {
      mockReq.body = { name: "Controller Test" };

      await updateThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Theme updated successfully",
        })
      );
    });

    it("should handle authentication error in controller", async () => {
      mockReq.userId = null;
      mockReq.body = { name: "Test" };

      await updateThemeController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Authentication required",
      });
    });

    it("should pass errors to next middleware", async () => {
      mockReq.params.id = "99999";
      mockReq.body = { name: "Test" };

      await updateThemeController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("User-Friendly Messages", () => {
    it("should return simple success message", async () => {
      const result = await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "Test" }
      );

      expect(result.message).toBe("Theme updated successfully");
      expect(result.message).not.toContain("custom");
      expect(result.message).not.toContain("global");
    });

    it("should provide clear error for permission denied", async () => {
      try {
        await updateTheme(
          viewerUserId,
          { id: testCustomThemeId },
          { name: "Test" }
        );
        throw new Error("Should have thrown");
      } catch (error: any) {
        expect(error.message).toContain("permission");
        expect(error.message).not.toContain("database");
        expect(error.message).not.toContain("SQL");
      }
    });

    it("should provide clear error for not found", async () => {
      try {
        await updateTheme(
          ownerUserId,
          { id: 99999 },
          { name: "Test" }
        );
        throw new Error("Should have thrown");
      } catch (error: any) {
        expect(error.message).toBe("Theme not found");
      }
    });
  });
});
