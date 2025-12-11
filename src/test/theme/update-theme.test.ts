import { describe, it, expect, beforeEach, vi } from "vitest";
import { updateTheme } from "../../services/theme/update";
import { updateThemeController } from "../../controllers/theme/update";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { $Enums } from "../../generated/prisma-client";
import { NextFunction } from "express";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");

describe("Update Theme Tests", () => {
  let mockPrisma: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;

  const ownerUserId = 1;
  const adminUserId = 2;
  const editorUserId = 3;
  const viewerUserId = 4;
  const nonMemberUserId = 5;
  const testWorkspaceId = 100;
  const testFunnelId = 200;
  const testCustomThemeId = 300;
  const testGlobalThemeId = 400;

  const mockOwnerUser = {
    id: ownerUserId,
    email: "owner@test.com",
    username: "owner",
    firstName: "Owner",
    lastName: "User",
    password: "hashedpassword",
    plan: $Enums.UserPlan.BUSINESS,
    isAdmin: false,
  };

  const mockAdminUser = {
    id: adminUserId,
    email: "admin@test.com",
    username: "admin",
    firstName: "Admin",
    lastName: "User",
    password: "hashedpassword",
    plan: $Enums.UserPlan.BUSINESS,
    isAdmin: true,
  };

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
    createdAt: new Date(),
    updatedAt: new Date(),
    funnel: {
      id: testFunnelId,
      name: "Test Funnel",
      slug: "test-funnel",
      workspaceId: testWorkspaceId,
      createdBy: ownerUserId,
      workspace: mockWorkspace,
    },
  };

  const mockGlobalTheme = {
    id: testGlobalThemeId,
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
    createdAt: new Date(),
    updatedAt: new Date(),
    funnel: null,
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
      user: {
        findUnique: vi.fn(),
      },
      theme: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
      funnel: {
        findUnique: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);

    // Mock cache service
    (cacheService.del as any).mockResolvedValue(undefined);
    (cacheService.get as any).mockResolvedValue(null);
    (cacheService.set as any).mockResolvedValue(undefined);

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

  describe("Authentication & Authorization", () => {
    it("should require user to be logged in", async () => {
      await expect(
        updateTheme(0, { id: testCustomThemeId }, { name: "Updated Name" })
      ).rejects.toThrow("User ID is required");
    });

    it("should verify theme exists", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(null);

      await expect(
        updateTheme(ownerUserId, { id: 99999 }, { name: "Updated Name" })
      ).rejects.toThrow("Theme not found");
    });

    it("should allow workspace owner to update custom theme", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        name: "Updated Custom Theme",
      });

      const result = await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "Updated Custom Theme" }
      );

      expect(result.message).toBe("Theme updated successfully");
      expect(mockPrisma.theme.update).toHaveBeenCalledWith({
        where: { id: testCustomThemeId },
        data: { name: "Updated Custom Theme" },
      });
    });

    it("should allow editor with EDIT_FUNNELS permission to update custom theme", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockEditorMember);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        name: "Editor Updated Theme",
      });

      const result = await updateTheme(
        editorUserId,
        { id: testCustomThemeId },
        { name: "Editor Updated Theme" }
      );

      expect(result.message).toBe("Theme updated successfully");
    });

    it("should deny viewer role from updating theme", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockViewerMember);

      await expect(
        updateTheme(viewerUserId, { id: testCustomThemeId }, { name: "Viewer Update" })
      ).rejects.toThrow("You don't have permission to update themes");
    });

    it("should deny non-member from updating theme", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        updateTheme(nonMemberUserId, { id: testCustomThemeId }, { name: "Non-Member Update" })
      ).rejects.toThrow("You don't have access to this theme");
    });
  });

  describe("Global Theme Restrictions", () => {
    it("should prevent non-admin users from updating global themes", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme);
      mockPrisma.user.findUnique.mockResolvedValue(mockOwnerUser);

      await expect(
        updateTheme(ownerUserId, { id: testGlobalThemeId }, { name: "Updated Global" })
      ).rejects.toThrow("Only system administrators can update global themes");
    });

    it("should allow admin users to update global themes", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme);
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockGlobalTheme,
        name: "Admin Updated Global",
      });

      const result = await updateTheme(
        adminUserId,
        { id: testGlobalThemeId },
        { name: "Admin Updated Global" }
      );

      expect(result.message).toBe("Theme updated successfully");
      expect(mockPrisma.theme.update).toHaveBeenCalled();
    });

    it("should prevent workspace owner from updating global themes", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme);
      mockPrisma.user.findUnique.mockResolvedValue(mockOwnerUser);

      await expect(
        updateTheme(ownerUserId, { id: testGlobalThemeId }, { backgroundColor: "#123456" })
      ).rejects.toThrow("Only system administrators can update global themes");
    });

    it("should prevent editor from updating global themes", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme);
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockOwnerUser, id: editorUserId });

      await expect(
        updateTheme(editorUserId, { id: testGlobalThemeId }, { textColor: "#654321" })
      ).rejects.toThrow("Only system administrators can update global themes");
    });
  });

  describe("Custom Theme Updates", () => {
    it("should update theme name", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        name: "New Theme Name",
      });

      const result = await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "New Theme Name" }
      );

      expect(result.message).toBe("Theme updated successfully");
      expect(mockPrisma.theme.update).toHaveBeenCalledWith({
        where: { id: testCustomThemeId },
        data: { name: "New Theme Name" },
      });
    });

    it("should update theme colors", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        backgroundColor: "#111111",
        textColor: "#222222",
        buttonColor: "#333333",
      });

      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        {
          backgroundColor: "#111111",
          textColor: "#222222",
          buttonColor: "#333333",
        }
      );

      expect(mockPrisma.theme.update).toHaveBeenCalledWith({
        where: { id: testCustomThemeId },
        data: {
          backgroundColor: "#111111",
          textColor: "#222222",
          buttonColor: "#333333",
        },
      });
    });

    it("should update font family", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        fontFamily: "Comic Sans MS",
      });

      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { fontFamily: "Comic Sans MS" }
      );

      expect(mockPrisma.theme.update).toHaveBeenCalledWith({
        where: { id: testCustomThemeId },
        data: { fontFamily: "Comic Sans MS" },
      });
    });

    it("should update border radius", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        borderRadius: $Enums.BorderRadius.ROUNDED,
      });

      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { borderRadius: "ROUNDED" }
      );

      expect(mockPrisma.theme.update).toHaveBeenCalledWith({
        where: { id: testCustomThemeId },
        data: { borderRadius: "ROUNDED" },
      });
    });

    it("should update multiple fields at once", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        name: "Multi Update Theme",
        backgroundColor: "#aabbcc",
        fontFamily: "Georgia",
        borderRadius: $Enums.BorderRadius.NONE,
      });

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

      expect(mockPrisma.theme.update).toHaveBeenCalledWith({
        where: { id: testCustomThemeId },
        data: {
          name: "Multi Update Theme",
          backgroundColor: "#aabbcc",
          fontFamily: "Georgia",
          borderRadius: "NONE",
        },
      });
    });
  });

  describe("Theme Connections Preservation", () => {
    it("should not modify theme.funnelId when updating custom theme", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        name: "Updated Name",
      });

      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "Updated Name" }
      );

      // Verify update doesn't include funnelId
      expect(mockPrisma.theme.update).toHaveBeenCalledWith({
        where: { id: testCustomThemeId },
        data: { name: "Updated Name" },
      });
    });

    it("should not modify theme.type when updating", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        name: "Updated Name",
      });

      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "Updated Name" }
      );

      // Verify update doesn't include type
      expect(mockPrisma.theme.update).toHaveBeenCalledWith({
        where: { id: testCustomThemeId },
        data: { name: "Updated Name" },
      });
    });

    it("should not affect funnel.activeThemeId when updating theme", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        backgroundColor: "#abcdef",
      });

      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { backgroundColor: "#abcdef" }
      );

      // Verify no funnel updates were made
      expect(mockPrisma.funnel?.update).toBeUndefined();
    });

    it("should not create or remove connections in theme.funnels array", async () => {
      const globalThemeWithFunnels = {
        ...mockGlobalTheme,
        funnels: [{ id: testFunnelId }],
      };

      mockPrisma.theme.findUnique.mockResolvedValue(globalThemeWithFunnels);
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrisma.theme.update.mockResolvedValue({
        ...globalThemeWithFunnels,
        name: "Updated Global Theme",
      });

      await updateTheme(
        adminUserId,
        { id: testGlobalThemeId },
        { name: "Updated Global Theme" }
      );

      // Verify update doesn't include funnels connections
      expect(mockPrisma.theme.update).toHaveBeenCalledWith({
        where: { id: testGlobalThemeId },
        data: { name: "Updated Global Theme" },
      });
    });
  });

  describe("Cache Invalidation", () => {
    it("should delete cache for single funnel when updating custom theme", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue(mockCustomTheme);

      await updateTheme(
        ownerUserId,
        { id: testCustomThemeId },
        { name: "Cache Test" }
      );

      // Should invalidate both funnel full cache and funnels:all cache with slug-based keys
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${mockWorkspace.slug}:funnel:${mockFunnel.slug}:full`
      );
      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${testWorkspaceId}:funnels:all`
      );
    });

    it("should invalidate global themes cache when admin updates global theme", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockGlobalTheme);
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrisma.theme.update.mockResolvedValue(mockGlobalTheme);

      await updateTheme(
        adminUserId,
        { id: testGlobalThemeId },
        { name: "Global Cache Test" }
      );

      expect(cacheService.del).toHaveBeenCalledWith("themes:global");
    });

    it("should succeed even if cache invalidation fails", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue(mockCustomTheme);
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
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        backgroundColor: "#ABCDEF",
      });

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
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue({
        ...mockCustomTheme,
        name: "Controller Test",
      });
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
      mockPrisma.theme.findUnique.mockResolvedValue(null);
      mockReq.params.id = "99999";
      mockReq.body = { name: "Test" };

      await updateThemeController(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("User-Friendly Messages", () => {
    it("should return simple success message", async () => {
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.theme.update.mockResolvedValue(mockCustomTheme);

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
      mockPrisma.theme.findUnique.mockResolvedValue(mockCustomTheme);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockViewerMember);

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
      mockPrisma.theme.findUnique.mockResolvedValue(null);

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
