import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GetPublicSiteService } from "../../services/site/get-public-site";
import { getPrisma } from "../../lib/prisma";
import {
  DomainStatus,
  SslStatus,
  FunnelStatus,
  PageType,
} from "../../generated/prisma-client";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../errors/http-errors";

vi.mock("../../lib/prisma");

describe("Get Public Site Tests", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      domain: {
        findUnique: vi.fn(),
      },
      funnelDomain: {
        findFirst: vi.fn(),
      },
      funnel: {
        findUnique: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockDomain = {
    id: 1,
    hostname: "example.mydigitalsite.io",
    type: "SUBDOMAIN",
    status: DomainStatus.ACTIVE,
    sslStatus: SslStatus.ACTIVE,
    workspaceId: 1,
    createdBy: 1,
    verificationToken: null,
    ownershipVerification: null,
    dnsInstructions: null,
    sslCertificateId: null,
    sslValidationRecords: null,
    lastVerifiedAt: new Date(),
    expiresAt: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFunnelDomainConnection = {
    id: 1,
    funnelId: 1,
    domainId: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockActiveTheme = {
    id: 1,
    name: "Active Theme",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#007bff",
    buttonTextColor: "#ffffff",
    borderColor: "#cccccc",
    optionColor: "#f0f0f0",
    fontFamily: "Inter, sans-serif",
    borderRadius: "SOFT",
    type: "CUSTOM",
    funnelId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGlobalTheme = {
    id: 2,
    name: "Global Theme",
    backgroundColor: "#0e1e12",
    textColor: "#d4ecd0",
    buttonColor: "#387e3d",
    buttonTextColor: "#e8f5e9",
    borderColor: "#214228",
    optionColor: "#16331b",
    fontFamily: "Roboto, sans-serif",
    borderRadius: "ROUNDED",
    type: "GLOBAL",
    funnelId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFunnel = {
    id: 1,
    name: "My Awesome Site",
    slug: "my-awesome-site",
    status: FunnelStatus.LIVE,
    workspaceId: 1,
    createdBy: 1,
    activeThemeId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    pages: [
      {
        id: 1,
        name: "Home",
        linkingId: "home",
        content: '{"blocks":[]}',
        order: 0,
        type: PageType.PAGE,
        seoTitle: "Home Page",
        seoDescription: "Welcome to our site",
        seoKeywords: "home, welcome",
        visits: 0,
        funnelId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "About",
        linkingId: "about",
        content: '{"blocks":[]}',
        order: 1,
        type: PageType.PAGE,
        seoTitle: "About Us",
        seoDescription: "Learn about us",
        seoKeywords: "about",
        visits: 0,
        funnelId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: "Contact",
        linkingId: "contact",
        content: '{"blocks":[]}',
        order: 2,
        type: PageType.PAGE,
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
        visits: 0,
        funnelId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    settings: {
      id: 1,
      funnelId: 1,
      defaultSeoTitle: "My Site",
      defaultSeoDescription: "My amazing site",
      defaultSeoKeywords: null,
      favicon: "https://example.com/favicon.ico",
      ogImage: "https://example.com/og-image.jpg",
      googleAnalyticsId: null,
      facebookPixelId: null,
      customTrackingScripts: null,
      enableCookieConsent: false,
      cookieConsentText: null,
      privacyPolicyUrl: null,
      termsOfServiceUrl: null,
      language: "en",
      timezone: "UTC",
      dateFormat: "DD.MM.YYYY",
      isPasswordProtected: false,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    activeTheme: mockActiveTheme,
  };

  describe("Success Cases", () => {
    it("should return site data for valid hostname with LIVE site", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result).toBeDefined();
      expect(result.site).toBeDefined();
      expect(result.site.id).toBe(1);
      expect(result.site.name).toBe("My Awesome Site");
      expect(result.site.status).toBe(FunnelStatus.LIVE);
    });

    it("should include all pages in the response", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result.site.pages).toHaveLength(3);
      expect(result.site.pages[0].name).toBe("Home");
      expect(result.site.pages[1].name).toBe("About");
      expect(result.site.pages[2].name).toBe("Contact");
    });

    it("should include settings in the response", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result.site.settings).toBeDefined();
      expect(result.site.settings.favicon).toBe(
        "https://example.com/favicon.ico"
      );
      expect(result.site.settings.language).toBe("en");
      expect(result.site.settings.passwordProtected).toBe(false);
      expect(result.site.settings.socialPreview).toBeDefined();
      expect(result.site.settings.socialPreview.title).toBe("My Site");
      expect(result.site.settings.socialPreview.description).toBe(
        "My amazing site"
      );
      expect(result.site.settings.socialPreview.image).toBe(
        "https://example.com/og-image.jpg"
      );
    });

    it("should include active theme in the response", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result.site.theme).toBeDefined();
      expect(result.site.theme?.backgroundColor).toBe("#ffffff");
      expect(result.site.theme?.textColor).toBe("#000000");
      expect(result.site.theme?.fontFamily).toBe("Inter, sans-serif");
    });

    it("should order pages correctly", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result.site.pages[0].order).toBe(0);
      expect(result.site.pages[1].order).toBe(1);
      expect(result.site.pages[2].order).toBe(2);
    });

    it("should handle site with null active theme", async () => {
      const funnelWithoutTheme = { ...mockFunnel, activeThemeId: null, activeTheme: null };
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithoutTheme);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result.site.theme).toBeNull();
    });

    it("should handle site with null settings", async () => {
      const funnelWithoutSettings = { ...mockFunnel, settings: null };
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithoutSettings);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result.site.settings).toBeDefined();
      expect(result.site.settings.favicon).toBeNull();
      expect(result.site.settings.language).toBe("en");
      expect(result.site.settings.passwordProtected).toBe(false);
    });
  });

  describe("Error Cases - Domain Validation", () => {
    it("should throw NotFoundError for non-existent hostname", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "nonexistent.mydigitalsite.io",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "nonexistent.mydigitalsite.io",
        })
      ).rejects.toThrow("Domain not found");
    });

    it("should throw NotFoundError for domain with PENDING status", async () => {
      const pendingDomain = { ...mockDomain, status: DomainStatus.PENDING };
      mockPrisma.domain.findUnique.mockResolvedValue(pendingDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow("Domain is not active");
    });

    it("should throw NotFoundError for domain with FAILED status", async () => {
      const failedDomain = { ...mockDomain, status: DomainStatus.FAILED };
      mockPrisma.domain.findUnique.mockResolvedValue(failedDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow("Domain is not active");
    });

    it("should throw NotFoundError for domain with SUSPENDED status", async () => {
      const suspendedDomain = { ...mockDomain, status: DomainStatus.SUSPENDED };
      mockPrisma.domain.findUnique.mockResolvedValue(suspendedDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow("Domain is not active");
    });

    it.skip("should throw NotFoundError for domain with PENDING SSL status", async () => {
      const pendingSslDomain = { ...mockDomain, sslStatus: SslStatus.PENDING };
      mockPrisma.domain.findUnique.mockResolvedValue(pendingSslDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow("Domain SSL certificate is not active");
    });

    it.skip("should throw NotFoundError for domain with ERROR SSL status", async () => {
      const errorSslDomain = { ...mockDomain, sslStatus: SslStatus.ERROR };
      mockPrisma.domain.findUnique.mockResolvedValue(errorSslDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow("Domain SSL certificate is not active");
    });

    it.skip("should throw NotFoundError for domain with EXPIRED SSL status", async () => {
      const expiredSslDomain = { ...mockDomain, sslStatus: SslStatus.EXPIRED };
      mockPrisma.domain.findUnique.mockResolvedValue(expiredSslDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow("Domain SSL certificate is not active");
    });
  });

  describe("Error Cases - Connection Validation", () => {
    it("should throw NotFoundError when no site is connected to domain", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow("No site is connected to this domain");
    });

    it("should throw NotFoundError when connected site does not exist", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow("Site not found");
    });
  });

  describe("Error Cases - Site Status Validation", () => {
    it("should throw ForbiddenError for site with DRAFT status", async () => {
      const draftFunnel = { ...mockFunnel, status: FunnelStatus.DRAFT };
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(draftFunnel);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow("Site is not published");
    });

    it("should throw ForbiddenError for site with ARCHIVED status", async () => {
      const archivedFunnel = { ...mockFunnel, status: FunnelStatus.ARCHIVED };
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(archivedFunnel);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
        })
      ).rejects.toThrow("Site has been archived");
    });
  });

  describe("Edge Cases", () => {
    it("should handle site with 0 pages", async () => {
      const funnelWithNoPages = { ...mockFunnel, pages: [] };
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithNoPages);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result.site.pages).toHaveLength(0);
    });

    it("should handle site with SHARED status", async () => {
      const sharedFunnel = { ...mockFunnel, status: FunnelStatus.SHARED };
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(sharedFunnel);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result.site.status).toBe(FunnelStatus.SHARED);
    });

    it("should handle custom domain hostname", async () => {
      const customDomain = {
        ...mockDomain,
        hostname: "www.example.com",
        type: "CUSTOM_DOMAIN",
      };
      mockPrisma.domain.findUnique.mockResolvedValue(customDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "www.example.com",
      });

      expect(result).toBeDefined();
      expect(result.site.id).toBe(1);
    });
  });

  describe("Theme Handling Tests", () => {
    it("should return GLOBAL theme when funnel uses a global theme", async () => {
      const funnelWithGlobalTheme = {
        ...mockFunnel,
        activeThemeId: 2,
        activeTheme: mockGlobalTheme,
      };

      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobalTheme);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result.site.theme).toBeDefined();
      expect(result.site.theme?.backgroundColor).toBe("#0e1e12");
      expect(result.site.theme?.textColor).toBe("#d4ecd0");
      expect(result.site.theme?.buttonColor).toBe("#387e3d");
      expect(result.site.theme?.fontFamily).toBe("Roboto, sans-serif");
      expect(result.site.theme?.borderRadius).toBe("ROUNDED");
    });

    it("should return CUSTOM theme when funnel uses a custom theme", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result.site.theme).toBeDefined();
      expect(result.site.theme?.backgroundColor).toBe("#ffffff");
      expect(result.site.theme?.textColor).toBe("#000000");
      expect(result.site.theme?.buttonColor).toBe("#007bff");
      expect(result.site.theme?.fontFamily).toBe("Inter, sans-serif");
      expect(result.site.theme?.borderRadius).toBe("SOFT");
    });

    it("should return the ACTIVE theme, not the custom theme relation", async () => {
      // Funnel has activeThemeId pointing to global theme (not its custom theme)
      const funnelWithGlobalActive = {
        ...mockFunnel,
        activeThemeId: 2,
        activeTheme: mockGlobalTheme,
      };

      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithGlobalActive);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      // Should return the global theme (active), not custom theme
      expect(result.site.theme).toBeDefined();
      expect(result.site.theme?.fontFamily).toBe("Roboto, sans-serif");
      expect(result.site.theme?.backgroundColor).toBe("#0e1e12");
    });

    it("should return null when funnel has no active theme", async () => {
      const funnelWithNoTheme = {
        ...mockFunnel,
        activeThemeId: null,
        activeTheme: null,
      };

      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findUnique.mockResolvedValue(funnelWithNoTheme);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
      });

      expect(result.site.theme).toBeNull();
    });
  });
});
