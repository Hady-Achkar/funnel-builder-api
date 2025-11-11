import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AffiliateLinkClickController } from "../../controllers/affiliate/affiliate-click";
import { AffiliateLinkClickService } from "../../services/affiliate/affiliate-click";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

vi.mock("../../services/affiliate/affiliate-click");
vi.mock("jsonwebtoken");

describe("AffiliateLinkClickController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      params: {},
      cookies: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /affiliate/click/:token/:sessionId", () => {
    it("should track click successfully with valid params", async () => {
      mockReq.params = {
        token: "valid-affiliate-token",
        sessionId: "session-123",
      };

      const mockResponse = { message: "Click tracked successfully" };
      (AffiliateLinkClickService.trackClick as any).mockResolvedValue(mockResponse);

      await AffiliateLinkClickController.trackClick(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(AffiliateLinkClickService.trackClick).toHaveBeenCalledWith({
        token: "valid-affiliate-token",
        sessionId: "session-123",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject authenticated users", async () => {
      mockReq.params = {
        token: "valid-affiliate-token",
        sessionId: "session-123",
      };
      mockReq.cookies = {
        authToken: "valid-jwt-token",
      };

      (jwt.verify as any).mockReturnValue({ userId: 1 });

      await AffiliateLinkClickController.trackClick(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "This endpoint is only for non-authenticated users",
        })
      );
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(AffiliateLinkClickService.trackClick).not.toHaveBeenCalled();
    });

    it("should allow requests with invalid/expired auth tokens", async () => {
      mockReq.params = {
        token: "valid-affiliate-token",
        sessionId: "session-123",
      };
      mockReq.cookies = {
        authToken: "expired-jwt-token",
      };

      (jwt.verify as any).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const mockResponse = { message: "Click tracked successfully" };
      (AffiliateLinkClickService.trackClick as any).mockResolvedValue(mockResponse);

      await AffiliateLinkClickController.trackClick(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(AffiliateLinkClickService.trackClick).toHaveBeenCalledWith({
        token: "valid-affiliate-token",
        sessionId: "session-123",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    });

    it("should handle service errors", async () => {
      mockReq.params = {
        token: "invalid-token",
        sessionId: "session-123",
      };

      const serviceError = new Error("Invalid affiliate token");
      (AffiliateLinkClickService.trackClick as any).mockRejectedValue(serviceError);

      await AffiliateLinkClickController.trackClick(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should work without any cookies", async () => {
      mockReq.params = {
        token: "valid-affiliate-token",
        sessionId: "session-123",
      };
      mockReq.cookies = undefined;

      const mockResponse = { message: "Click tracked successfully" };
      (AffiliateLinkClickService.trackClick as any).mockResolvedValue(mockResponse);

      await AffiliateLinkClickController.trackClick(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(AffiliateLinkClickService.trackClick).toHaveBeenCalledWith({
        token: "valid-affiliate-token",
        sessionId: "session-123",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should pass URL params correctly to service", async () => {
      const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      const testSessionId = "abc-def-123-456";

      mockReq.params = {
        token: testToken,
        sessionId: testSessionId,
      };

      const mockResponse = { message: "Click tracked successfully" };
      (AffiliateLinkClickService.trackClick as any).mockResolvedValue(mockResponse);

      await AffiliateLinkClickController.trackClick(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(AffiliateLinkClickService.trackClick).toHaveBeenCalledWith({
        token: testToken,
        sessionId: testSessionId,
      });
    });
  });
});
