import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from "express";
import { createFunnelController } from "./index";
import { createFunnel } from "../../../services/funnel/create";
import { cacheService } from "../../../services/cache/cache.service";
import { UnauthorizedError } from "../../../errors/http-errors";
import { AuthRequest } from "../../../middleware/auth";

// Mock dependencies
vi.mock("../../../services/funnel/create");
vi.mock("../../../services/cache/cache.service");

const mockCreateFunnel = vi.mocked(createFunnel);
const mockCacheServiceDel = vi.mocked(cacheService.del);

describe("createFunnelController", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {
        name: "Test Funnel",
        workspaceSlug: "test-workspace",
        status: "DRAFT",
      },
      userId: 1,
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();

    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock console methods to avoid test output noise
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful funnel creation", () => {
    it("should create funnel and invalidate cache successfully", async () => {
      const mockResult = {
        message: "Funnel created successfully!",
        funnelId: 123,
        workspaceId: 8,
      };

      mockCreateFunnel.mockResolvedValue(mockResult);
      mockCacheServiceDel.mockResolvedValue(undefined);

      await createFunnelController(req as any, res as Response, next);

      // Verify service was called with correct data
      expect(mockCreateFunnel).toHaveBeenCalledWith(1, {
        name: "Test Funnel",
        workspaceSlug: "test-workspace",
        status: "DRAFT",
      });

      // Verify cache invalidation
      expect(mockCacheServiceDel).toHaveBeenCalledWith("workspace:8:funnels:all");

      // Verify response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle cache invalidation failure gracefully", async () => {
      const mockResult = {
        message: "Funnel created successfully!",
        funnelId: 123,
        workspaceId: 8,
      };

      mockCreateFunnel.mockResolvedValue(mockResult);
      mockCacheServiceDel.mockRejectedValue(new Error("Cache service down"));

      await createFunnelController(req as any, res as Response, next);

      // Should still return success
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();

      // Should log cache error
      expect(console.error).toHaveBeenCalledWith(
        "Cache invalidation failed in funnel create controller:",
        expect.any(Error)
      );
    });
  });

  describe("validation errors", () => {
    it("should return 400 for missing workspace slug", async () => {
      req.body = {
        name: "Test Funnel",
        // Missing workspaceSlug
      };

      await createFunnelController(req as any, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Validation failed",
        details: "Invalid input: expected string, received undefined",
      });
      expect(mockCreateFunnel).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid status", async () => {
      req.body = {
        name: "Test Funnel",
        workspaceSlug: "test-workspace",
        status: "INVALID_STATUS",
      };

      await createFunnelController(req as any, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Validation failed",
        details: expect.stringContaining("Status must be DRAFT, LIVE, ARCHIVED, or SHARED"),
      });
      expect(mockCreateFunnel).not.toHaveBeenCalled();
    });

    it("should use default values for optional fields", async () => {
      req.body = {
        workspaceSlug: "test-workspace",
        // Name should default to current date/time
        // Status should default to DRAFT
      };

      const mockResult = {
        message: "Funnel created successfully!",
        funnelId: 123,
        workspaceId: 8,
      };

      mockCreateFunnel.mockResolvedValue(mockResult);

      await createFunnelController(req as any, res as Response, next);

      expect(mockCreateFunnel).toHaveBeenCalledWith(1, expect.objectContaining({
        workspaceSlug: "test-workspace",
        status: "DRAFT",
        name: expect.any(String), // Should be auto-generated date
      }));
    });
  });

  describe("authentication errors", () => {
    it("should throw UnauthorizedError when userId is missing", async () => {
      req.userId = undefined;

      await createFunnelController(req as any, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockCreateFunnel).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when userId is null", async () => {
      req.userId = null;

      await createFunnelController(req as any, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockCreateFunnel).not.toHaveBeenCalled();
    });
  });

  describe("service errors", () => {
    it("should pass through service errors to error handler", async () => {
      const serviceError = new Error("Database connection failed");
      mockCreateFunnel.mockRejectedValue(serviceError);

      await createFunnelController(req as any, res as Response, next);

      expect(console.error).toHaveBeenCalledWith(
        "[FUNNEL_CREATE_CONTROLLER_ERROR] Error in funnel create controller:",
        serviceError
      );
      expect(next).toHaveBeenCalledWith(serviceError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("should handle business logic errors from service", async () => {
      const businessError = new Error("Workspace does not exist");
      mockCreateFunnel.mockRejectedValue(businessError);

      await createFunnelController(req as any, res as Response, next);

      expect(console.error).toHaveBeenCalledWith(
        "[FUNNEL_CREATE_CONTROLLER_ERROR] Error in funnel create controller:",
        businessError
      );
      expect(next).toHaveBeenCalledWith(businessError);
    });
  });

  describe("edge cases", () => {
    it("should handle empty request body", async () => {
      req.body = {};

      await createFunnelController(req as any, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Validation failed",
        details: "Invalid input: expected string, received undefined",
      });
    });

    it("should handle malformed request body", async () => {
      req.body = null;

      await createFunnelController(req as any, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Validation failed",
        details: expect.any(String),
      });
    });

    it("should trim and validate funnel name", async () => {
      req.body = {
        name: "  Test Funnel  ", // Should be trimmed
        workspaceSlug: "test-workspace",
      };

      const mockResult = {
        message: "Funnel created successfully!",
        funnelId: 123,
        workspaceId: 8,
      };

      mockCreateFunnel.mockResolvedValue(mockResult);

      await createFunnelController(req as any, res as Response, next);

      expect(mockCreateFunnel).toHaveBeenCalledWith(1, expect.objectContaining({
        name: "Test Funnel", // Should be trimmed
        workspaceSlug: "test-workspace",
      }));
    });

    it("should reject funnel name that is too long", async () => {
      req.body = {
        name: "a".repeat(101), // 101 characters, should fail
        workspaceSlug: "test-workspace",
      };

      await createFunnelController(req as any, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Validation failed",
        details: expect.stringContaining("must be less than 100 characters"),
      });
    });
  });
});