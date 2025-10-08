import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { updateFunnelSettings } from "../../services/funnel-settings/update";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import { $Enums } from "../../generated/prisma-client";

vi.mock("../../lib/prisma");
vi.mock("../../services/cache/cache.service");
vi.mock("../../utils/workspace-utils/workspace-permission-manager", () => ({
  PermissionManager: {
    requirePermission: vi.fn(),
  },
  PermissionAction: {
    EDIT_FUNNEL: "EDIT_FUNNEL",
  },
}));

import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager";

describe("Update Funnel Settings Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const funnelId = 1;
  const workspaceId = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findUnique: vi.fn(),
      },
      funnelSettings: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.del as any).mockResolvedValue(undefined);
    (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error if user ID is not provided", async () => {
      await expect(
        updateFunnelSettings(0, { funnelId })
      ).rejects.toThrow("User ID is required");
    });

    it("should throw error for invalid funnel ID (negative)", async () => {
      await expect(
        updateFunnelSettings(userId, { funnelId: -1 })
      ).rejects.toThrow("Invalid input");
    });

    it("should throw error for invalid funnel ID (zero)", async () => {
      await expect(
        updateFunnelSettings(userId, { funnelId: 0 })
      ).rejects.toThrow("Invalid input");
    });

    it("should throw error for invalid funnel ID (non-integer)", async () => {
      await expect(
        updateFunnelSettings(userId, { funnelId: 1.5 } as any)
      ).rejects.toThrow("Invalid input");
    });

    it("should throw error if funnel does not exist", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(
        updateFunnelSettings(userId, {
          funnelId,
          defaultSeoTitle: "New Title",
        })
      ).rejects.toThrow("Funnel not found");
    });

    it("should throw error if funnel settings do not exist", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(null);

      await expect(
        updateFunnelSettings(userId, {
          funnelId,
          defaultSeoTitle: "New Title",
        })
      ).rejects.toThrow("Funnel settings not found");
    });

    it("should throw error if no fields to update", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
      };

      const existingSettings = {
        id: 1,
        funnelId,
        defaultSeoTitle: "Existing Title",
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);

      await expect(
        updateFunnelSettings(userId, { funnelId })
      ).rejects.toThrow("Nothing to update");
    });

    it("should validate privacy policy URL format", async () => {
      await expect(
        updateFunnelSettings(userId, {
          funnelId,
          privacyPolicyUrl: "not-a-valid-url",
        })
      ).rejects.toThrow("Invalid input");
    });

    it("should validate terms of service URL format", async () => {
      await expect(
        updateFunnelSettings(userId, {
          funnelId,
          termsOfServiceUrl: "invalid-url",
        })
      ).rejects.toThrow("Invalid input");
    });

    it("should accept empty string for privacyPolicyUrl (transforms to null)", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
      };

      const existingSettings = {
        id: 1,
        funnelId,
        privacyPolicyUrl: "https://example.com/privacy",
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        privacyPolicyUrl: null,
      });

      await updateFunnelSettings(userId, {
        funnelId,
        privacyPolicyUrl: "",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: expect.objectContaining({
          privacyPolicyUrl: null,
        }),
      });
    });
  });

  describe("Permission Checks", () => {
    const funnel = {
      id: funnelId,
      name: "Test Funnel",
      workspaceId,
    };

    const existingSettings = {
      id: 1,
      funnelId,
      defaultSeoTitle: "Existing Title",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
    });

    it("should check EDIT_FUNNEL permission", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        defaultSeoTitle: "New Title",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "New Title",
      });

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "EDIT_FUNNEL",
      });
    });

    it("should throw error if user lacks EDIT_FUNNEL permission", async () => {
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have permission to edit funnel")
      );

      await expect(
        updateFunnelSettings(userId, {
          funnelId,
          defaultSeoTitle: "New Title",
        })
      ).rejects.toThrow("You don't have permission to edit funnel");
    });

    it("should allow workspace owner to update settings", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        defaultSeoTitle: "Updated by Owner",
      });

      const result = await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "Updated by Owner",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Funnel settings updated successfully");
    });

    it("should deny non-member from updating settings", async () => {
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have access to this workspace")
      );

      await expect(
        updateFunnelSettings(userId, {
          funnelId,
          defaultSeoTitle: "Try to Update",
        })
      ).rejects.toThrow("You don't have access to this workspace");
    });
  });

  describe("SEO Settings Updates", () => {
    const funnel = {
      id: funnelId,
      name: "Test Funnel",
      workspaceId,
    };

    const existingSettings = {
      id: 1,
      funnelId,
      defaultSeoTitle: "Old Title",
      defaultSeoDescription: "Old Description",
      defaultSeoKeywords: "old, keywords",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
    });

    it("should update SEO title", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        defaultSeoTitle: "New SEO Title",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "New SEO Title",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          defaultSeoTitle: "New SEO Title",
        },
      });
    });

    it("should update SEO description", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        defaultSeoDescription: "New SEO Description",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoDescription: "New SEO Description",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          defaultSeoDescription: "New SEO Description",
        },
      });
    });

    it("should update SEO keywords", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        defaultSeoKeywords: "new, keywords, seo",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoKeywords: "new, keywords, seo",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          defaultSeoKeywords: "new, keywords, seo",
        },
      });
    });

    it("should set SEO title to null", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        defaultSeoTitle: null,
      });

      await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: null,
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          defaultSeoTitle: null,
        },
      });
    });
  });

  describe("Media Settings Updates", () => {
    const funnel = {
      id: funnelId,
      name: "Test Funnel",
      workspaceId,
    };

    const existingSettings = {
      id: 1,
      funnelId,
      favicon: "https://example.com/old-favicon.ico",
      ogImage: "https://example.com/old-og.png",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
    });

    it("should update favicon", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        favicon: "https://example.com/new-favicon.ico",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        favicon: "https://example.com/new-favicon.ico",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          favicon: "https://example.com/new-favicon.ico",
        },
      });
    });

    it("should update OG image", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        ogImage: "https://example.com/new-og.png",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        ogImage: "https://example.com/new-og.png",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          ogImage: "https://example.com/new-og.png",
        },
      });
    });

    it("should remove favicon by setting to null", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        favicon: null,
      });

      await updateFunnelSettings(userId, {
        funnelId,
        favicon: null,
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          favicon: null,
        },
      });
    });
  });

  describe("Tracking Settings Updates", () => {
    const funnel = {
      id: funnelId,
      name: "Test Funnel",
      workspaceId,
    };

    const existingSettings = {
      id: 1,
      funnelId,
      googleAnalyticsId: null,
      facebookPixelId: null,
      customTrackingScripts: null,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
    });

    it("should update Google Analytics ID", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        googleAnalyticsId: "GA-123456789",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        googleAnalyticsId: "GA-123456789",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          googleAnalyticsId: "GA-123456789",
        },
      });
    });

    it("should update Facebook Pixel ID", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        facebookPixelId: "FB-987654321",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        facebookPixelId: "FB-987654321",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          facebookPixelId: "FB-987654321",
        },
      });
    });

    it("should update custom tracking scripts", async () => {
      const customScripts = {
        header: "<script>console.log('header')</script>",
        footer: "<script>console.log('footer')</script>",
      };

      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        customTrackingScripts: customScripts,
      });

      await updateFunnelSettings(userId, {
        funnelId,
        customTrackingScripts: customScripts,
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          customTrackingScripts: customScripts,
        },
      });
    });

    it("should remove Google Analytics ID", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        googleAnalyticsId: null,
      });

      await updateFunnelSettings(userId, {
        funnelId,
        googleAnalyticsId: null,
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          googleAnalyticsId: null,
        },
      });
    });
  });

  describe("Cookie Consent Settings Updates", () => {
    const funnel = {
      id: funnelId,
      name: "Test Funnel",
      workspaceId,
    };

    const existingSettings = {
      id: 1,
      funnelId,
      enableCookieConsent: false,
      cookieConsentText: null,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
    });

    it("should enable cookie consent", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        enableCookieConsent: true,
      });

      await updateFunnelSettings(userId, {
        funnelId,
        enableCookieConsent: true,
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          enableCookieConsent: true,
        },
      });
    });

    it("should disable cookie consent", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        enableCookieConsent: false,
      });

      await updateFunnelSettings(userId, {
        funnelId,
        enableCookieConsent: false,
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          enableCookieConsent: false,
        },
      });
    });

    it("should update cookie consent text", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        cookieConsentText: "We use cookies to improve your experience.",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        cookieConsentText: "We use cookies to improve your experience.",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          cookieConsentText: "We use cookies to improve your experience.",
        },
      });
    });
  });

  describe("Legal URLs Updates", () => {
    const funnel = {
      id: funnelId,
      name: "Test Funnel",
      workspaceId,
    };

    const existingSettings = {
      id: 1,
      funnelId,
      privacyPolicyUrl: null,
      termsOfServiceUrl: null,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
    });

    it("should update privacy policy URL", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        privacyPolicyUrl: "https://example.com/privacy",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        privacyPolicyUrl: "https://example.com/privacy",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          privacyPolicyUrl: "https://example.com/privacy",
        },
      });
    });

    it("should update terms of service URL", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        termsOfServiceUrl: "https://example.com/terms",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        termsOfServiceUrl: "https://example.com/terms",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          termsOfServiceUrl: "https://example.com/terms",
        },
      });
    });

    it("should remove privacy policy URL", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        privacyPolicyUrl: null,
      });

      await updateFunnelSettings(userId, {
        funnelId,
        privacyPolicyUrl: null,
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          privacyPolicyUrl: null,
        },
      });
    });
  });

  describe("Localization Settings Updates", () => {
    const funnel = {
      id: funnelId,
      name: "Test Funnel",
      workspaceId,
    };

    const existingSettings = {
      id: 1,
      funnelId,
      language: "en",
      timezone: "UTC",
      dateFormat: "YYYY-MM-DD",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
    });

    it("should update language", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        language: "es",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        language: "es",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          language: "es",
        },
      });
    });

    it("should update timezone", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        timezone: "America/New_York",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        timezone: "America/New_York",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          timezone: "America/New_York",
        },
      });
    });

    it("should update date format", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        dateFormat: "DD/MM/YYYY",
      });

      await updateFunnelSettings(userId, {
        funnelId,
        dateFormat: "DD/MM/YYYY",
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          dateFormat: "DD/MM/YYYY",
        },
      });
    });
  });

  describe("Multiple Fields Updates", () => {
    const funnel = {
      id: funnelId,
      name: "Test Funnel",
      workspaceId,
    };

    const existingSettings = {
      id: 1,
      funnelId,
      defaultSeoTitle: "Old Title",
      defaultSeoDescription: "Old Description",
      googleAnalyticsId: null,
      enableCookieConsent: false,
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
    });

    it("should update multiple fields at once", async () => {
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        defaultSeoTitle: "New Title",
        defaultSeoDescription: "New Description",
        googleAnalyticsId: "GA-123456789",
        enableCookieConsent: true,
      });

      await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "New Title",
        defaultSeoDescription: "New Description",
        googleAnalyticsId: "GA-123456789",
        enableCookieConsent: true,
      });

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: {
          defaultSeoTitle: "New Title",
          defaultSeoDescription: "New Description",
          googleAnalyticsId: "GA-123456789",
          enableCookieConsent: true,
        },
      });
    });

    it("should update all settings fields", async () => {
      const allUpdates = {
        funnelId,
        defaultSeoTitle: "Complete Title",
        defaultSeoDescription: "Complete Description",
        defaultSeoKeywords: "complete, keywords",
        favicon: "https://example.com/favicon.ico",
        ogImage: "https://example.com/og.png",
        googleAnalyticsId: "GA-123",
        facebookPixelId: "FB-456",
        customTrackingScripts: { header: "script" },
        enableCookieConsent: true,
        cookieConsentText: "We use cookies",
        privacyPolicyUrl: "https://example.com/privacy",
        termsOfServiceUrl: "https://example.com/terms",
        language: "en",
        timezone: "UTC",
        dateFormat: "YYYY-MM-DD",
      };

      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        ...allUpdates,
      });

      await updateFunnelSettings(userId, allUpdates);

      expect(mockPrisma.funnelSettings.update).toHaveBeenCalledWith({
        where: { funnelId },
        data: expect.objectContaining({
          defaultSeoTitle: "Complete Title",
          defaultSeoDescription: "Complete Description",
          googleAnalyticsId: "GA-123",
          facebookPixelId: "FB-456",
          enableCookieConsent: true,
          language: "en",
        }),
      });
    });
  });

  describe("Cache Invalidation", () => {
    const funnel = {
      id: funnelId,
      name: "Test Funnel",
      workspaceId,
    };

    const existingSettings = {
      id: 1,
      funnelId,
      defaultSeoTitle: "Old Title",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        defaultSeoTitle: "New Title",
      });
    });

    it("should invalidate funnel settings cache", async () => {
      await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "New Title",
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `funnel:${funnelId}:settings:full`
      );
    });

    it("should invalidate full funnel cache", async () => {
      await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "New Title",
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnel:${funnelId}:full`
      );
    });

    it("should invalidate all funnels cache", async () => {
      await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "New Title",
      });

      expect(cacheService.del).toHaveBeenCalledWith(
        `workspace:${workspaceId}:funnels:all`
      );
    });

    it("should invalidate all relevant cache keys", async () => {
      await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "New Title",
      });

      const expectedCacheKeys = [
        `funnel:${funnelId}:settings:full`,
        `workspace:${workspaceId}:funnel:${funnelId}:full`,
        `workspace:${workspaceId}:funnels:all`,
      ];

      expectedCacheKeys.forEach((key) => {
        expect(cacheService.del).toHaveBeenCalledWith(key);
      });

      expect(cacheService.del).toHaveBeenCalledTimes(expectedCacheKeys.length);
    });

    it("should continue operation if cache invalidation fails", async () => {
      (cacheService.del as any).mockRejectedValue(new Error("Cache error"));

      const result = await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "New Title",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Funnel settings updated successfully");
    });

    it("should continue if individual cache key fails", async () => {
      let callCount = 0;
      (cacheService.del as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Cache error"));
        }
        return Promise.resolve();
      });

      const result = await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "New Title",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Response Format", () => {
    const funnel = {
      id: funnelId,
      name: "Test Funnel",
      workspaceId,
    };

    const existingSettings = {
      id: 1,
      funnelId,
      defaultSeoTitle: "Old Title",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
      mockPrisma.funnelSettings.update.mockResolvedValue({
        ...existingSettings,
        defaultSeoTitle: "New Title",
      });
    });

    it("should return success message", async () => {
      const result = await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "New Title",
      });

      expect(result.message).toBe("Funnel settings updated successfully");
      expect(result.success).toBe(true);
    });

    it("should return valid response object", async () => {
      const result = await updateFunnelSettings(userId, {
        funnelId,
        defaultSeoTitle: "New Title",
      });

      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("success");
      expect(typeof result.message).toBe("string");
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
      };

      const existingSettings = {
        id: 1,
        funnelId,
        defaultSeoTitle: "Old Title",
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockResolvedValue(existingSettings);
      mockPrisma.funnelSettings.update.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        updateFunnelSettings(userId, {
          funnelId,
          defaultSeoTitle: "New Title",
        })
      ).rejects.toThrow("Failed to update funnel settings");
    });

    it("should handle prisma errors", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockRejectedValue(
        new Error("Prisma error")
      );

      await expect(
        updateFunnelSettings(userId, {
          funnelId,
          defaultSeoTitle: "New Title",
        })
      ).rejects.toThrow("Failed to update funnel settings");
    });

    it("should handle unknown errors", async () => {
      const funnel = {
        id: funnelId,
        name: "Test Funnel",
        workspaceId,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.funnelSettings.findUnique.mockRejectedValue("Unknown error");

      await expect(
        updateFunnelSettings(userId, {
          funnelId,
          defaultSeoTitle: "New Title",
        })
      ).rejects.toThrow("Couldn't update the funnel settings");
    });
  });
});