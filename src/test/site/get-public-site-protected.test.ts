import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { checkFunnelAccess } from "../../middleware/funnelAccess";
import { getPrisma } from "../../lib/prisma";
import { verifyFunnelAccessToken } from "../../lib/jwt";

// Extend Request interface to include funnelId
interface ExtendedRequest extends Request {
  funnelId?: number;
}

vi.mock("../../lib/prisma");
vi.mock("../../lib/jwt");

describe("Get Public Site - Password Protection Tests", () => {
  let mockPrisma: any;
  let mockRequest: Partial<ExtendedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: any;
  let jsonMock: any;

  const testHostname = "www.digitalsite.llc";
  const testFunnelId = 123;
  const testFunnelSlug = "test-funnel";
  const testDomainId = 456;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock response
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      params: {},
      query: {},
      cookies: {},
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();

    // Setup mock Prisma
    mockPrisma = {
      domain: {
        findUnique: vi.fn(),
      },
      funnelDomain: {
        findFirst: vi.fn(),
      },
      funnel: {
        findFirst: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
    vi.mocked(verifyFunnelAccessToken).mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Hostname-Based Lookup", () => {
    it("should return 400 if neither funnelSlug nor hostname provided", async () => {
      mockRequest.query = {};
      mockRequest.params = {};

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Funnel slug or hostname is required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 400 if hostname provided without funnelSlug", async () => {
      mockRequest.query = { hostname: testHostname };

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Funnel slug parameter is required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 404 if domain not found", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.domain.findUnique).toHaveBeenCalledWith({
        where: { hostname: testHostname },
        select: { id: true, status: true },
      });
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Domain not found",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if domain status is not ACTIVE", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "PENDING",
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Domain not accessible",
        message: "Domain status is PENDING",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 404 if no active funnel found for domain", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.funnelDomain.findFirst).toHaveBeenCalledWith({
        where: {
          domainId: testDomainId,
          isActive: true,
          funnel: {
            slug: testFunnelSlug,
          },
        },
        select: {
          funnel: {
            select: {
              id: true,
              slug: true,
              status: true,
              settings: {
                select: {
                  isPasswordProtected: true,
                },
              },
            },
          },
        },
      });
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Funnel not found or not connected to this domain",
        message: "The requested funnel is not associated with this domain",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if funnel status is DRAFT", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        funnel: {
          id: testFunnelId,
          slug: testFunnelSlug,
          status: "DRAFT",
          settings: {
            isPasswordProtected: false,
          },
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Funnel not accessible",
        message: "Funnel status is DRAFT",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 if funnel status is ARCHIVED", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        funnel: {
          id: testFunnelId,
          slug: testFunnelSlug,
          status: "ARCHIVED",
          settings: {
            isPasswordProtected: false,
          },
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Funnel not accessible",
        message: "Funnel status is ARCHIVED",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Non-Password Protected Site", () => {
    it("should allow access to LIVE funnel without password protection", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        funnel: {
          id: testFunnelId,
          slug: testFunnelSlug,
          status: "LIVE",
          settings: {
            isPasswordProtected: false,
          },
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect(mockRequest.funnelId).toBe(testFunnelId);
    });

    it("should allow access to SHARED funnel without password protection", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        funnel: {
          id: testFunnelId,
          slug: testFunnelSlug,
          status: "SHARED",
          settings: {
            isPasswordProtected: false,
          },
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect(mockRequest.funnelId).toBe(testFunnelId);
    });

    it("should set funnelId in request for controller access", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        funnel: {
          id: testFunnelId,
          slug: testFunnelSlug,
          status: "LIVE",
          settings: {
            isPasswordProtected: false,
          },
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.funnelId).toBe(testFunnelId);
    });
  });

  describe("Password Protected Site", () => {
    it("should return 200 with requiresPassword when site is password protected and no valid token", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockRequest.headers = {};

      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        funnel: {
          id: testFunnelId,
          slug: testFunnelSlug,
          status: "LIVE",
          settings: {
            isPasswordProtected: true,
          },
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Password required",
        message:
          "This content is password protected. Please enter the password to continue.",
        requiresPassword: true,
        funnelSlug: testFunnelSlug,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should allow access when site is password protected and valid token exists in header", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockRequest.headers = {
        authorization: "Bearer valid-jwt-token",
      };

      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        funnel: {
          id: testFunnelId,
          slug: testFunnelSlug,
          status: "LIVE",
          settings: {
            isPasswordProtected: true,
          },
        },
      });

      vi.mocked(verifyFunnelAccessToken).mockReturnValue({
        funnelSlug: testFunnelSlug,
        funnelId: testFunnelId,
        hasAccess: true,
        type: "funnel_access",
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(verifyFunnelAccessToken).toHaveBeenCalledWith("valid-jwt-token");
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect(mockRequest.funnelId).toBe(testFunnelId);
    });

    it("should check password protection even for SHARED funnels", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockRequest.headers = {};

      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        funnel: {
          id: testFunnelId,
          slug: testFunnelSlug,
          status: "SHARED",
          settings: {
            isPasswordProtected: true,
          },
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Password required",
        message:
          "This content is password protected. Please enter the password to continue.",
        requiresPassword: true,
        funnelSlug: testFunnelSlug,
      });
    });
  });

  describe("Backward Compatibility - FunnelSlug Based Lookup", () => {
    it("should still work with funnelSlug for page endpoints", async () => {
      mockRequest.params = { funnelSlug: "test-funnel" };
      mockRequest.query = {};

      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: testFunnelId,
          slug: testFunnelSlug,
        settings: {
          isPasswordProtected: false,
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
        where: {
          slug: "test-funnel",
          status: "LIVE",
        },
        select: {
          id: true,
          slug: true,
          settings: {
            select: {
              isPasswordProtected: true,
            },
          },
        },
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.funnelId).toBe(testFunnelId);
    });

    it("should prioritize funnelSlug over hostname if both provided", async () => {
      mockRequest.params = { funnelSlug: "test-funnel" };
      mockRequest.query = { hostname: testHostname };

      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: testFunnelId,
          slug: testFunnelSlug,
        settings: {
          isPasswordProtected: false,
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.funnel.findFirst).toHaveBeenCalled();
      expect(mockPrisma.domain.findUnique).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should enforce password protection for funnelSlug-based access", async () => {
      mockRequest.params = { funnelSlug: "protected-funnel" };
      mockRequest.query = {};
      mockRequest.headers = {};

      mockPrisma.funnel.findFirst.mockResolvedValue({
        id: testFunnelId,
          slug: testFunnelSlug,
        settings: {
          isPasswordProtected: true,
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Password required",
        message:
          "This content is password protected. Please enter the password to continue.",
        requiresPassword: true,
        funnelSlug: testFunnelSlug,
      });
    });
  });

  describe("Error Handling", () => {
    it("should return 500 on database error during domain lookup", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Internal server error",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 500 on unexpected error during funnel lookup", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockRejectedValue(
        new Error("Unexpected error")
      );

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle null settings gracefully", async () => {
      mockRequest.query = { hostname: testHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        funnel: {
          id: testFunnelId,
          slug: testFunnelSlug,
          status: "LIVE",
          settings: null,
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should allow access if settings is null (no password protection)
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should handle hostname with special characters", async () => {
      const specialHostname = "test-site_123.example.com";
      mockRequest.query = { hostname: specialHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: testDomainId,
        status: "ACTIVE",
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        funnel: {
          id: testFunnelId,
          slug: testFunnelSlug,
          status: "LIVE",
          settings: {
            isPasswordProtected: false,
          },
        },
      });

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.domain.findUnique).toHaveBeenCalledWith({
        where: { hostname: specialHostname },
        select: { id: true, status: true },
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle case-sensitive hostnames correctly", async () => {
      const uppercaseHostname = "WWW.DIGITALSITE.LLC";
      mockRequest.query = { hostname: uppercaseHostname, funnelSlug: testFunnelSlug };
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await checkFunnelAccess(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.domain.findUnique).toHaveBeenCalledWith({
        where: { hostname: uppercaseHostname },
        select: { id: true, status: true },
      });
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Domain not found",
      });
    });
  });
});
