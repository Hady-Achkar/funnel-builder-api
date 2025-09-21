import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createFunnelController } from "../../controllers/funnel/create";
import { updateFunnelController } from "../../controllers/funnel/update";
import { deleteFunnelController } from "../../controllers/funnel/delete";
import { duplicateFunnelController } from "../../controllers/funnel/duplicate";
import { createFromTemplateController } from "../../controllers/funnel/createFromTemplate";
import { createFunnel } from "../../services/funnel/create";
import { updateFunnel } from "../../services/funnel/update";
import { deleteFunnel } from "../../services/funnel/delete";
import { duplicateFunnel } from "../../services/funnel/duplicate";
import { createFromTemplate } from "../../services/funnel/createFromTemplate";
import { cacheService } from "../../services/cache/cache.service";
import { getPrisma } from "../../lib/prisma";
import { NextFunction } from "express";

vi.mock("../../services/funnel/create");
vi.mock("../../services/funnel/update");
vi.mock("../../services/funnel/delete");
vi.mock("../../services/funnel/duplicate");
vi.mock("../../services/funnel/createFromTemplate");
vi.mock("../../services/cache/cache.service");
vi.mock("../../lib/prisma");

describe("Funnel Cache Invalidation Tests", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      userId: 1,
      params: {},
      body: {}
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    mockPrisma = {
      funnel: {
        findUnique: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
    (cacheService.del as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Create Funnel Cache Invalidation", () => {
    it("should invalidate both funnel list and workspace cache when creating a funnel", async () => {
      const workspaceSlug = "test-workspace";
      const workspaceId = 1;

      mockReq.body = {
        name: "New Funnel",
        workspaceSlug
      };

      (createFunnel as any).mockResolvedValue({
        response: {
          message: "Funnel created successfully!",
          funnelId: 1
        },
        workspaceId
      });

      await createFunnelController(mockReq, mockRes, mockNext);

      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${workspaceId}:funnels:all`);
      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${workspaceSlug}:user:${mockReq.userId}`);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle cache invalidation errors gracefully", async () => {
      const workspaceSlug = "test-workspace";
      const workspaceId = 1;

      mockReq.body = {
        name: "New Funnel",
        workspaceSlug
      };

      (createFunnel as any).mockResolvedValue({
        response: {
          message: "Funnel created successfully!",
          funnelId: 1
        },
        workspaceId
      });

      (cacheService.del as any).mockRejectedValue(new Error("Cache error"));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await createFunnelController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("Update Funnel Cache Invalidation", () => {
    it("should invalidate workspace cache when updating a funnel", async () => {
      const funnelId = 1;
      const workspaceSlug = "test-workspace";

      mockReq.params = { id: String(funnelId) };
      mockReq.body = { name: "Updated Funnel" };

      mockPrisma.funnel.findUnique.mockResolvedValue({
        workspace: { slug: workspaceSlug }
      });

      (updateFunnel as any).mockResolvedValue({
        message: "Funnel updated successfully",
        funnelId
      });

      await updateFunnelController(mockReq, mockRes, mockNext);

      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${workspaceSlug}:user:${mockReq.userId}`);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should handle missing workspace slug gracefully", async () => {
      const funnelId = 1;

      mockReq.params = { id: String(funnelId) };
      mockReq.body = { name: "Updated Funnel" };

      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      (updateFunnel as any).mockResolvedValue({
        message: "Funnel updated successfully",
        funnelId
      });

      await updateFunnelController(mockReq, mockRes, mockNext);

      expect(cacheService.del).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe("Delete Funnel Cache Invalidation", () => {
    it("should invalidate workspace cache when deleting a funnel", async () => {
      const funnelId = 1;
      const workspaceSlug = "test-workspace";

      mockReq.params = { id: String(funnelId) };

      mockPrisma.funnel.findUnique.mockResolvedValue({
        workspace: { slug: workspaceSlug }
      });

      (deleteFunnel as any).mockResolvedValue({
        message: "Funnel deleted successfully"
      });

      await deleteFunnelController(mockReq, mockRes, mockNext);

      expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith({
        where: { id: funnelId },
        select: {
          workspace: {
            select: { slug: true }
          }
        }
      });

      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${workspaceSlug}:user:${mockReq.userId}`);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should delete funnel even if cache invalidation fails", async () => {
      const funnelId = 1;
      const workspaceSlug = "test-workspace";

      mockReq.params = { id: String(funnelId) };

      mockPrisma.funnel.findUnique.mockResolvedValue({
        workspace: { slug: workspaceSlug }
      });

      (deleteFunnel as any).mockResolvedValue({
        message: "Funnel deleted successfully"
      });

      (cacheService.del as any).mockRejectedValue(new Error("Cache error"));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await deleteFunnelController(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("Duplicate Funnel Cache Invalidation", () => {
    it("should invalidate workspace cache when duplicating a funnel", async () => {
      const originalFunnelId = 1;
      const newFunnelId = 2;
      const workspaceSlug = "test-workspace";

      mockReq.params = { id: String(originalFunnelId) };
      mockReq.body = { name: "Duplicated Funnel" };

      (duplicateFunnel as any).mockResolvedValue({
        message: "Funnel duplicated successfully",
        funnelId: newFunnelId
      });

      mockPrisma.funnel.findUnique.mockResolvedValue({
        workspace: { slug: workspaceSlug }
      });

      await duplicateFunnelController(mockReq, mockRes, mockNext);

      expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith({
        where: { id: newFunnelId },
        select: {
          workspace: {
            select: { slug: true }
          }
        }
      });

      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${workspaceSlug}:user:${mockReq.userId}`);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle duplicate to different workspace", async () => {
      const originalFunnelId = 1;
      const newFunnelId = 2;
      const targetWorkspaceSlug = "target-workspace";

      mockReq.params = { id: String(originalFunnelId) };
      mockReq.body = {
        name: "Duplicated Funnel",
        targetWorkspaceSlug
      };

      (duplicateFunnel as any).mockResolvedValue({
        message: "Funnel duplicated successfully",
        funnelId: newFunnelId
      });

      mockPrisma.funnel.findUnique.mockResolvedValue({
        workspace: { slug: targetWorkspaceSlug }
      });

      await duplicateFunnelController(mockReq, mockRes, mockNext);

      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${targetWorkspaceSlug}:user:${mockReq.userId}`);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Create From Template Cache Invalidation", () => {
    it("should invalidate workspace cache when creating from template", async () => {
      const templateId = 1;
      const newFunnelId = 2;
      const workspaceSlug = "test-workspace";

      mockReq.params = { templateId: String(templateId) };
      mockReq.body = {
        name: "Funnel from Template",
        workspaceSlug
      };

      (createFromTemplate as any).mockResolvedValue({
        message: "Funnel created from template successfully",
        funnelId: newFunnelId
      });

      mockPrisma.funnel.findUnique.mockResolvedValue({
        workspace: { slug: workspaceSlug }
      });

      await createFromTemplateController(mockReq, mockRes, mockNext);

      expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith({
        where: { id: newFunnelId },
        select: {
          workspace: {
            select: { slug: true }
          }
        }
      });

      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${workspaceSlug}:user:${mockReq.userId}`);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Cache Invalidation Integration", () => {
    it("should invalidate all relevant caches when funnel count changes", async () => {
      // Test that when funnels are created/deleted, both funnel list and workspace caches are invalidated
      const workspaceSlug = "test-workspace";
      const workspaceId = 1;

      // Create funnel
      mockReq.body = {
        name: "New Funnel",
        workspaceSlug
      };

      (createFunnel as any).mockResolvedValue({
        response: {
          message: "Funnel created successfully!",
          funnelId: 1
        },
        workspaceId
      });

      await createFunnelController(mockReq, mockRes, mockNext);

      // Verify both caches are invalidated
      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${workspaceId}:funnels:all`);
      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${workspaceSlug}:user:${mockReq.userId}`);

      // Reset mocks
      vi.clearAllMocks();

      // Delete funnel
      mockReq.params = { id: "1" };
      mockPrisma.funnel.findUnique.mockResolvedValue({
        workspace: { slug: workspaceSlug }
      });

      (deleteFunnel as any).mockResolvedValue({
        message: "Funnel deleted successfully"
      });

      await deleteFunnelController(mockReq, mockRes, mockNext);

      // Verify workspace cache is invalidated
      expect(cacheService.del).toHaveBeenCalledWith(`workspace:${workspaceSlug}:user:${mockReq.userId}`);
    });

    it("should handle concurrent cache invalidations", async () => {
      // Test that multiple funnel operations don't interfere with each other
      const workspaceSlug = "test-workspace";
      const workspaceId = 1;

      const promises = [];

      // Simulate concurrent operations
      for (let i = 1; i <= 3; i++) {
        const req = {
          userId: 1,
          body: {
            name: `Funnel ${i}`,
            workspaceSlug
          },
          params: {}
        };

        (createFunnel as any).mockResolvedValue({
          response: {
            message: "Funnel created successfully!",
            funnelId: i
          },
          workspaceId
        });

        promises.push(createFunnelController(req as any, mockRes, mockNext));
      }

      await Promise.all(promises);

      // Each operation should invalidate cache
      expect(cacheService.del).toHaveBeenCalledTimes(6); // 2 cache keys per operation
    });
  });
});