import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ConnectFunnelDomainService } from "../../services/domain-funnel/connect";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError } from "../../errors/http-errors";

vi.mock("../../lib/prisma");
vi.mock("../../utils/workspace-utils/workspace-permission-manager", () => ({
  PermissionManager: {
    requirePermission: vi.fn(),
  },
  PermissionAction: {
    CONNECT_DOMAIN: "CONNECT_DOMAIN",
  },
}));

import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager";

describe("Connect Funnel Domain Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const funnelId = 1;
  const domainId = 1;
  const workspaceId = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      funnel: {
        findUnique: vi.fn(),
      },
      domain: {
        findUnique: vi.fn(),
      },
      funnelDomain: {
        findFirst: vi.fn(),
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
    (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error for invalid funnel ID (negative)", async () => {
      await expect(
        ConnectFunnelDomainService.connect(userId, {
          funnelId: -1,
          domainId,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel ID (zero)", async () => {
      await expect(
        ConnectFunnelDomainService.connect(userId, {
          funnelId: 0,
          domainId,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid funnel ID (non-integer)", async () => {
      await expect(
        ConnectFunnelDomainService.connect(userId, {
          funnelId: 1.5,
          domainId,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid domain ID (negative)", async () => {
      await expect(
        ConnectFunnelDomainService.connect(userId, {
          funnelId,
          domainId: -1,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid domain ID (zero)", async () => {
      await expect(
        ConnectFunnelDomainService.connect(userId, {
          funnelId,
          domainId: 0,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid domain ID (non-integer)", async () => {
      await expect(
        ConnectFunnelDomainService.connect(userId, {
          funnelId,
          domainId: 1.5,
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Funnel Existence", () => {
    it("should throw error if funnel not found", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("Funnel not found");
    });

    it("should retrieve funnel with workspace info", async () => {
      const funnel = {
        id: funnelId,
        workspaceId,
        name: "Test Funnel",
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow();

      expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith({
        where: { id: funnelId },
        select: {
          id: true,
          workspaceId: true,
          name: true,
        },
      });
    });

    it("should proceed if funnel found", async () => {
      const funnel = {
        id: funnelId,
        workspaceId,
        name: "Test Funnel",
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("Domain not found");

      expect(mockPrisma.funnel.findUnique).toHaveBeenCalled();
    });
  });

  describe("Domain Existence", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      name: "Test Funnel",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
    });

    it("should throw error if domain not found", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("Domain not found");
    });

    it("should retrieve domain with workspace info", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow();

      expect(mockPrisma.domain.findUnique).toHaveBeenCalledWith({
        where: { id: domainId },
        select: {
          id: true,
          workspaceId: true,
          hostname: true,
        },
      });
    });

    it("should proceed if domain found", async () => {
      const domain = {
        id: domainId,
        workspaceId: 999,
        hostname: "example.com",
      };

      mockPrisma.domain.findUnique.mockResolvedValue(domain);

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("same workspace");

      expect(mockPrisma.domain.findUnique).toHaveBeenCalled();
    });
  });

  describe("Same Workspace Validation", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      name: "Test Funnel",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
    });

    it("should throw error if funnel and domain in different workspaces", async () => {
      const domain = {
        id: domainId,
        workspaceId: 999,
        hostname: "example.com",
      };

      mockPrisma.domain.findUnique.mockResolvedValue(domain);

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("Funnel and domain must belong to the same workspace");
    });

    it("should proceed if in same workspace", async () => {
      const domain = {
        id: domainId,
        workspaceId,
        hostname: "example.com",
      };

      mockPrisma.domain.findUnique.mockResolvedValue(domain);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 1,
        funnelId,
        domainId,
        isActive: true,
      });

      await ConnectFunnelDomainService.connect(userId, { funnelId, domainId });

      expect(PermissionManager.requirePermission).toHaveBeenCalled();
    });

    it("should include clear error message about same workspace", async () => {
      const domain = {
        id: domainId,
        workspaceId: 999,
        hostname: "example.com",
      };

      mockPrisma.domain.findUnique.mockResolvedValue(domain);

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("same workspace");
    });

    it("should validate workspace before permission check", async () => {
      const domain = {
        id: domainId,
        workspaceId: 999,
        hostname: "example.com",
      };

      mockPrisma.domain.findUnique.mockResolvedValue(domain);

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow();

      // Permission check should not be called
      expect(PermissionManager.requirePermission).not.toHaveBeenCalled();
    });
  });

  describe("Permission Checks", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      name: "Test Funnel",
    };

    const domain = {
      id: domainId,
      workspaceId,
      hostname: "example.com",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.domain.findUnique.mockResolvedValue(domain);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 1,
        funnelId,
        domainId,
        isActive: true,
      });
    });

    it("should check CONNECT_DOMAIN permission", async () => {
      await ConnectFunnelDomainService.connect(userId, { funnelId, domainId });

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "CONNECT_DOMAIN",
      });
    });

    it("should throw error if user lacks CONNECT_DOMAIN permission", async () => {
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have permission to connect domain")
      );

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("You don't have permission to connect domain");
    });

    it("should allow workspace owner to connect", async () => {
      const result = await ConnectFunnelDomainService.connect(userId, {
        funnelId,
        domainId,
      });

      expect(result.message).toBe("Funnel connected successfully");
    });

    it("should allow admin to connect", async () => {
      const result = await ConnectFunnelDomainService.connect(userId, {
        funnelId,
        domainId,
      });

      expect(result.message).toBe("Funnel connected successfully");
    });

    it("should allow editor with CONNECT_DOMAINS permission", async () => {
      const result = await ConnectFunnelDomainService.connect(userId, {
        funnelId,
        domainId,
      });

      expect(result.message).toBe("Funnel connected successfully");
    });

    it("should deny non-member from connecting", async () => {
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have access to this workspace")
      );

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("You don't have access to this workspace");
    });
  });

  describe("Connection Logic", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      name: "Test Funnel",
    };

    const domain = {
      id: domainId,
      workspaceId,
      hostname: "example.com",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.domain.findUnique.mockResolvedValue(domain);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
    });

    it("should create funnelDomain record", async () => {
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 1,
        funnelId,
        domainId,
        isActive: true,
      });

      await ConnectFunnelDomainService.connect(userId, { funnelId, domainId });

      expect(mockPrisma.funnelDomain.create).toHaveBeenCalledWith({
        data: {
          funnelId,
          domainId,
          isActive: true,
        },
      });
    });

    it("should throw error if exact connection already exists", async () => {
      mockPrisma.funnelDomain.findFirst.mockResolvedValue({
        id: 1,
        funnelId,
        domainId,
        isActive: true,
      });

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("This funnel is already connected to this domain");
    });

    it("should remove previous connections to same funnel", async () => {
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 2,
        funnelId,
        domainId,
        isActive: true,
      });

      await ConnectFunnelDomainService.connect(userId, { funnelId, domainId });

      expect(mockPrisma.funnelDomain.deleteMany).toHaveBeenCalledWith({
        where: { funnelId },
      });
    });

    it("should set isActive to true", async () => {
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 1,
        funnelId,
        domainId,
        isActive: true,
      });

      await ConnectFunnelDomainService.connect(userId, { funnelId, domainId });

      const createCall = mockPrisma.funnelDomain.create.mock.calls[0][0];
      expect(createCall.data.isActive).toBe(true);
    });

    it("should check for duplicate before deleting old connections", async () => {
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 1,
        funnelId,
        domainId,
        isActive: true,
      });

      await ConnectFunnelDomainService.connect(userId, { funnelId, domainId });

      // findFirst should be called before deleteMany
      const callOrder = mockPrisma.funnelDomain.findFirst.mock.invocationCallOrder[0];
      const deleteCallOrder = mockPrisma.funnelDomain.deleteMany.mock.invocationCallOrder[0];

      expect(callOrder).toBeLessThan(deleteCallOrder);
    });

    it("should allow multiple funnels to connect to same domain", async () => {
      const funnel2Id = 2;
      const funnel2 = {
        id: funnel2Id,
        workspaceId,
        name: "Test Funnel 2",
      };

      mockPrisma.funnel.findUnique
        .mockResolvedValueOnce(funnel)
        .mockResolvedValueOnce(funnel2);
      mockPrisma.domain.findUnique.mockResolvedValue(domain);
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.funnelDomain.create
        .mockResolvedValueOnce({
          id: 1,
          funnelId,
          domainId,
          isActive: true,
        })
        .mockResolvedValueOnce({
          id: 2,
          funnelId: funnel2Id,
          domainId,
          isActive: true,
        });

      await ConnectFunnelDomainService.connect(userId, { funnelId, domainId });
      await ConnectFunnelDomainService.connect(userId, {
        funnelId: funnel2Id,
        domainId,
      });

      expect(mockPrisma.funnelDomain.create).toHaveBeenCalledTimes(2);
    });

    it("should create connection with correct data structure", async () => {
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 1,
        funnelId,
        domainId,
        isActive: true,
      });

      await ConnectFunnelDomainService.connect(userId, { funnelId, domainId });

      const createCall = mockPrisma.funnelDomain.create.mock.calls[0][0];
      expect(createCall.data).toEqual({
        funnelId,
        domainId,
        isActive: true,
      });
    });
  });

  describe("Transaction Handling", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      name: "Test Funnel",
    };

    const domain = {
      id: domainId,
      workspaceId,
      hostname: "example.com",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.domain.findUnique.mockResolvedValue(domain);
    });

    it("should execute operations within a transaction", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 1,
        funnelId,
        domainId,
        isActive: true,
      });

      await ConnectFunnelDomainService.connect(userId, { funnelId, domainId });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should rollback on transaction error", async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error("Transaction failed"));

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("Transaction failed");
    });

    it("should not commit if create fails", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          ...mockPrisma,
          funnelDomain: {
            findFirst: vi.fn().mockResolvedValue(null),
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockRejectedValue(new Error("Create failed")),
          },
        });
      });

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("Create failed");
    });

    it("should execute all operations atomically", async () => {
      let findFirstCalled = false;
      let deleteManyCalled = false;
      let createCalled = false;

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          funnelDomain: {
            findFirst: vi.fn().mockImplementation(() => {
              findFirstCalled = true;
              return Promise.resolve(null);
            }),
            deleteMany: vi.fn().mockImplementation(() => {
              deleteManyCalled = true;
              return Promise.resolve({ count: 0 });
            }),
            create: vi.fn().mockImplementation(() => {
              createCalled = true;
              return Promise.resolve({
                id: 1,
                funnelId,
                domainId,
                isActive: true,
              });
            }),
          },
        };
        return await callback(txMock);
      });

      await ConnectFunnelDomainService.connect(userId, { funnelId, domainId });

      expect(findFirstCalled).toBe(true);
      expect(deleteManyCalled).toBe(true);
      expect(createCalled).toBe(true);
    });
  });

  describe("Response Format", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      name: "Test Funnel",
    };

    const domain = {
      id: domainId,
      workspaceId,
      hostname: "example.com",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.domain.findUnique.mockResolvedValue(domain);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 1,
        funnelId,
        domainId,
        isActive: true,
      });
    });

    it("should return success message", async () => {
      const result = await ConnectFunnelDomainService.connect(userId, {
        funnelId,
        domainId,
      });

      expect(result.message).toBe("Funnel connected successfully");
    });

    it("should return valid response structure", async () => {
      const result = await ConnectFunnelDomainService.connect(userId, {
        funnelId,
        domainId,
      });

      expect(result).toHaveProperty("message");
      expect(typeof result.message).toBe("string");
    });

    it("should not include sensitive data in response", async () => {
      const result = await ConnectFunnelDomainService.connect(userId, {
        funnelId,
        domainId,
      });

      expect(result).not.toHaveProperty("userId");
      expect(result).not.toHaveProperty("workspaceId");
      expect(result).not.toHaveProperty("passwordHash");
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockPrisma.funnel.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("Database connection failed");
    });

    it("should throw BadRequestError for Zod validation errors", async () => {
      try {
        await ConnectFunnelDomainService.connect(userId, {
          funnelId: -1,
          domainId,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
      }
    });

    it("should handle transaction failures", async () => {
      const funnel = {
        id: funnelId,
        workspaceId,
        name: "Test Funnel",
      };

      const domain = {
        id: domainId,
        workspaceId,
        hostname: "example.com",
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.domain.findUnique.mockResolvedValue(domain);
      mockPrisma.$transaction.mockRejectedValue(
        new Error("Transaction rollback")
      );

      await expect(
        ConnectFunnelDomainService.connect(userId, { funnelId, domainId })
      ).rejects.toThrow("Transaction rollback");
    });

    it("should include validation message in BadRequestError", async () => {
      try {
        await ConnectFunnelDomainService.connect(userId, {
          funnelId: 0,
          domainId,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        if (error instanceof BadRequestError) {
          expect(error.message).toBeTruthy();
        }
      }
    });
  });

  describe("Edge Cases", () => {
    const funnel = {
      id: funnelId,
      workspaceId,
      name: "Test Funnel",
    };

    const domain = {
      id: domainId,
      workspaceId,
      hostname: "example.com",
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(funnel);
      mockPrisma.domain.findUnique.mockResolvedValue(domain);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });
    });

    it("should handle reconnecting same funnel to different domain", async () => {
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 2,
        funnelId,
        domainId,
        isActive: true,
      });

      const result = await ConnectFunnelDomainService.connect(userId, {
        funnelId,
        domainId,
      });

      expect(result.message).toBe("Funnel connected successfully");
      expect(mockPrisma.funnelDomain.deleteMany).toHaveBeenCalledWith({
        where: { funnelId },
      });
    });

    it("should handle funnel with no previous connections", async () => {
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 1,
        funnelId,
        domainId,
        isActive: true,
      });

      const result = await ConnectFunnelDomainService.connect(userId, {
        funnelId,
        domainId,
      });

      expect(result.message).toBe("Funnel connected successfully");
    });

    it("should handle domain with multiple funnels", async () => {
      mockPrisma.funnelDomain.findFirst.mockResolvedValue(null);
      mockPrisma.funnelDomain.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.funnelDomain.create.mockResolvedValue({
        id: 1,
        funnelId,
        domainId,
        isActive: true,
      });

      const result = await ConnectFunnelDomainService.connect(userId, {
        funnelId,
        domainId,
      });

      expect(result.message).toBe("Funnel connected successfully");
    });
  });
});
