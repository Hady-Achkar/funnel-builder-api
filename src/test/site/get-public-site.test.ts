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
import * as jwtLib from "../../lib/jwt";
import jwt from "jsonwebtoken";

vi.mock("../../lib/prisma");
vi.mock("../../lib/jwt");

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
        findFirst: vi.fn(),
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
    it("should return site data for valid hostname with LIVE site (no password protection)", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
      });

      expect(result).toBeDefined();
      expect(result.site).toBeDefined();
      expect(result.site.id).toBe(1);
      expect(result.site.name).toBe("My Awesome Site");
      expect(result.site.status).toBe(FunnelStatus.LIVE);
      expect(result.requiresPassword).toBe(false);
      expect(result.hasAccess).toBe(true);
      expect(result.tokenExpiry).toBeNull();
    });

    it("should include all pages in the response", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
      });

      expect(result.site.pages).toHaveLength(3);
      expect(result.site.pages[0].name).toBe("Home");
      expect(result.site.pages[1].name).toBe("About");
      expect(result.site.pages[2].name).toBe("Contact");
    });

    it("should include settings in the response", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
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
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
      });

      expect(result.site.theme).toBeDefined();
      expect(result.site.theme?.backgroundColor).toBe("#ffffff");
      expect(result.site.theme?.textColor).toBe("#000000");
      expect(result.site.theme?.fontFamily).toBe("Inter, sans-serif");
    });

    it("should order pages correctly", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
      });

      expect(result.site.pages[0].order).toBe(0);
      expect(result.site.pages[1].order).toBe(1);
      expect(result.site.pages[2].order).toBe(2);
    });

    it("should handle site with null active theme", async () => {
      const funnelWithoutTheme = { ...mockFunnel, activeThemeId: null, activeTheme: null };
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnel.findFirst.mockResolvedValue(funnelWithoutTheme);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
      });

      expect(result.site.theme).toBeNull();
    });

    it("should handle site with null settings", async () => {
      const funnelWithoutSettings = { ...mockFunnel, settings: null };
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnel.findFirst.mockResolvedValue(funnelWithoutSettings);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
      });

      expect(result.site.settings).toBeDefined();
      expect(result.site.settings.favicon).toBeNull();
      expect(result.site.settings.language).toBe("en");
      expect(result.site.settings.passwordProtected).toBe(false);
    });
  });

  describe("Access Control Tests", () => {
    it("should deny access to password-protected site without token", async () => {
      const protectedFunnel = {
        ...mockFunnel,
        settings: {
          ...mockFunnel.settings,
          isPasswordProtected: true,
          passwordHash: "hashed_password",
        },
      };

      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findFirst.mockResolvedValue(protectedFunnel);

      const result = await GetPublicSiteService.getPublicSite(
        {
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        },
        {} // Empty cookies
      );

      expect(result.site).toBeNull();
      expect(result.requiresPassword).toBe(true);
      expect(result.hasAccess).toBe(false);
      expect(result.tokenExpiry).toBeNull();
    });

    it("should grant access to password-protected site with valid token", async () => {
      const protectedFunnel = {
        ...mockFunnel,
        settings: {
          ...mockFunnel.settings,
          isPasswordProtected: true,
          passwordHash: "hashed_password",
        },
      };

      const mockToken = "valid.jwt.token";
      const mockTokenPayload = {
        funnelSlug: "my-awesome-site",
        funnelId: 1,
        hasAccess: true,
        type: "funnel_access" as const,
      };

      const mockDecodedJwt = {
        funnelSlug: "my-awesome-site",
        funnelId: 1,
        hasAccess: true,
        type: "funnel_access",
        exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
      };

      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findFirst.mockResolvedValue(protectedFunnel);

      vi.spyOn(jwtLib, "verifyFunnelAccessToken").mockReturnValue(
        mockTokenPayload
      );
      vi.spyOn(jwt, "decode").mockReturnValue(mockDecodedJwt);

      const cookies = {
        "funnel_access_my-awesome-site": mockToken,
      };

      const result = await GetPublicSiteService.getPublicSite(
        {
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        },
        cookies
      );

      expect(result.site).toBeDefined();
      expect(result.site?.id).toBe(1);
      expect(result.requiresPassword).toBe(true);
      expect(result.hasAccess).toBe(true);
      expect(result.tokenExpiry).toBeGreaterThan(0);
    });

    it("should deny access with invalid token", async () => {
      const protectedFunnel = {
        ...mockFunnel,
        settings: {
          ...mockFunnel.settings,
          isPasswordProtected: true,
          passwordHash: "hashed_password",
        },
      };

      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findFirst.mockResolvedValue(protectedFunnel);

      vi.spyOn(jwtLib, "verifyFunnelAccessToken").mockReturnValue(null);

      const cookies = {
        "funnel_access_my-awesome-site": "invalid.jwt.token",
      };

      const result = await GetPublicSiteService.getPublicSite(
        {
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        },
        cookies
      );

      expect(result.site).toBeNull();
      expect(result.requiresPassword).toBe(true);
      expect(result.hasAccess).toBe(false);
      expect(result.tokenExpiry).toBeNull();
    });

    it("should deny access with token for wrong funnel", async () => {
      const protectedFunnel = {
        ...mockFunnel,
        settings: {
          ...mockFunnel.settings,
          isPasswordProtected: true,
          passwordHash: "hashed_password",
        },
      };

      const mockTokenPayload = {
        funnelSlug: "different-funnel",
        funnelId: 999,
        hasAccess: true,
        type: "funnel_access" as const,
      };

      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findFirst.mockResolvedValue(protectedFunnel);

      vi.spyOn(jwtLib, "verifyFunnelAccessToken").mockReturnValue(
        mockTokenPayload
      );

      const cookies = {
        "funnel_access_my-awesome-site": "valid.jwt.token",
      };

      const result = await GetPublicSiteService.getPublicSite(
        {
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        },
        cookies
      );

      expect(result.site).toBeNull();
      expect(result.requiresPassword).toBe(true);
      expect(result.hasAccess).toBe(false);
      expect(result.tokenExpiry).toBeNull();
    });

    it("should grant access to non-protected site without token", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);

      const result = await GetPublicSiteService.getPublicSite(
        {
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        },
        {} // Empty cookies
      );

      expect(result.site).toBeDefined();
      expect(result.requiresPassword).toBe(false);
      expect(result.hasAccess).toBe(true);
      expect(result.tokenExpiry).toBeNull();
    });
  });

  describe("Error Cases - Domain Validation", () => {
    it("should throw NotFoundError for non-existent hostname", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "nonexistent.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "nonexistent.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow("Domain not found");
    });

    it("should throw NotFoundError when funnelSlug doesn't exist", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnel.findFirst.mockResolvedValue(null); // Funnel with this slug doesn't exist

      // Request with a non-existent funnelSlug
      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "non-existent-funnel",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "non-existent-funnel",
        })
      ).rejects.toThrow("Site not found");
    });

    it("should throw NotFoundError when funnel exists but is not connected to the domain", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel); // Funnel exists
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null); // But not connected to this domain

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow("Site not found for this domain");
    });

    it("should support multiple funnels on the same domain", async () => {
      // Create a second funnel
      const mockFunnel2 = {
        ...mockFunnel,
        id: 2,
        name: "Second Funnel",
        slug: "second-funnel",
      };

      const mockFunnelDomainConnection2 = {
        id: 2,
        funnelId: 2,
        domainId: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Test first funnel
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );

      const result1 = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
      });

      expect(result1.site.id).toBe(1);
      expect(result1.site.name).toBe("My Awesome Site");

      // Test second funnel on same domain
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel2);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection2
      );

      const result2 = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "second-funnel",
      });

      expect(result2.site.id).toBe(2);
      expect(result2.site.name).toBe("Second Funnel");
    });

    it("should throw NotFoundError for domain with PENDING status", async () => {
      const pendingDomain = { ...mockDomain, status: DomainStatus.PENDING };
      mockPrisma.domain.findUnique.mockResolvedValue(pendingDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow("Domain is not active");
    });

    it("should throw NotFoundError for domain with FAILED status", async () => {
      const failedDomain = { ...mockDomain, status: DomainStatus.FAILED };
      mockPrisma.domain.findUnique.mockResolvedValue(failedDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow("Domain is not active");
    });

    it("should throw NotFoundError for domain with SUSPENDED status", async () => {
      const suspendedDomain = { ...mockDomain, status: DomainStatus.SUSPENDED };
      mockPrisma.domain.findUnique.mockResolvedValue(suspendedDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow("Domain is not active");
    });

    it.skip("should throw NotFoundError for domain with PENDING SSL status", async () => {
      const pendingSslDomain = { ...mockDomain, sslStatus: SslStatus.PENDING };
      mockPrisma.domain.findUnique.mockResolvedValue(pendingSslDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow("Domain SSL certificate is not active");
    });

    it.skip("should throw NotFoundError for domain with ERROR SSL status", async () => {
      const errorSslDomain = { ...mockDomain, sslStatus: SslStatus.ERROR };
      mockPrisma.domain.findUnique.mockResolvedValue(errorSslDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow("Domain SSL certificate is not active");
    });

    it.skip("should throw NotFoundError for domain with EXPIRED SSL status", async () => {
      const expiredSslDomain = { ...mockDomain, sslStatus: SslStatus.EXPIRED };
      mockPrisma.domain.findUnique.mockResolvedValue(expiredSslDomain);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow("Domain SSL certificate is not active");
    });
  });

  describe("Error Cases - Connection Validation", () => {
    it("should throw NotFoundError when funnel slug does not exist", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnel.findFirst.mockResolvedValue(null); // No funnel with this slug

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "non-existent-funnel",
        })
      ).rejects.toThrow(NotFoundError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "non-existent-funnel",
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
      mockPrisma.funnel.findFirst.mockResolvedValue(draftFunnel);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow("Site is not published");
    });

    it("should throw ForbiddenError for site with ARCHIVED status", async () => {
      const archivedFunnel = { ...mockFunnel, status: FunnelStatus.ARCHIVED };
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findFirst.mockResolvedValue(archivedFunnel);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
        })
      ).rejects.toThrow(ForbiddenError);

      await expect(
        GetPublicSiteService.getPublicSite({
          hostname: "example.mydigitalsite.io",
          funnelSlug: "my-awesome-site",
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
      mockPrisma.funnel.findFirst.mockResolvedValue(funnelWithNoPages);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
      });

      expect(result.site.pages).toHaveLength(0);
    });

    it("should handle site with SHARED status", async () => {
      const sharedFunnel = { ...mockFunnel, status: FunnelStatus.SHARED };
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(
        mockFunnelDomainConnection
      );
      mockPrisma.funnel.findFirst.mockResolvedValue(sharedFunnel);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
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
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "www.example.com",
        funnelSlug: "my-awesome-site",
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
      mockPrisma.funnel.findFirst.mockResolvedValue(funnelWithGlobalTheme);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
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
      mockPrisma.funnel.findFirst.mockResolvedValue(mockFunnel);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
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
      mockPrisma.funnel.findFirst.mockResolvedValue(funnelWithGlobalActive);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
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
      mockPrisma.funnel.findFirst.mockResolvedValue(funnelWithNoTheme);

      const result = await GetPublicSiteService.getPublicSite({
        hostname: "example.mydigitalsite.io",
        funnelSlug: "my-awesome-site",
      });

      expect(result.site.theme).toBeNull();
    });
  });
});
