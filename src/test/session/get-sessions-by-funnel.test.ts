import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getSessionsByFunnel } from "../../services/session/get-by-funnel";
import { getPrisma } from "../../lib/prisma";

vi.mock("../../lib/prisma");
vi.mock("../../utils/workspace-utils/workspace-permission-manager", () => ({
  PermissionManager: {
    can: vi.fn(),
  },
  PermissionAction: {
    VIEW_FUNNEL: "VIEW_FUNNEL",
  },
}));

import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager";

describe("Get Sessions by Funnel Tests", () => {
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
      session: {
        findMany: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error if user ID is not provided", async () => {
      await expect(getSessionsByFunnel(funnelId, 0)).rejects.toThrow(
        "User ID is required"
      );
    });

    it("should throw error for invalid funnel ID (negative)", async () => {
      await expect(getSessionsByFunnel(-1, userId)).rejects.toThrow(
        "Invalid input"
      );
    });

    it("should throw error for invalid funnel ID (zero)", async () => {
      await expect(getSessionsByFunnel(0, userId)).rejects.toThrow(
        "Invalid input"
      );
    });

    it("should throw error if funnel does not exist", async () => {
      mockPrisma.funnel.findUnique.mockResolvedValue(null);

      await expect(getSessionsByFunnel(funnelId, userId)).rejects.toThrow(
        "Funnel not found"
      );
    });
  });

  describe("Permission Checks", () => {
    const mockFunnel = {
      id: funnelId,
      workspaceId,
      pages: [
        { id: 1, name: "Home" },
        { id: 2, name: "About" },
      ],
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
    });

    it("should allow user with VIEW_FUNNEL permission", async () => {
      const mockSessions = [
        {
          id: "session-1",
          sessionId: "sess-abc-123",
          visitedPages: [1, 2, 3],
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
      });

      const result = await getSessionsByFunnel(funnelId, userId);

      expect(result.sessions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(PermissionManager.can).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "VIEW_FUNNEL",
      });
    });

    it("should deny user without VIEW_FUNNEL permission", async () => {
      (PermissionManager.can as any).mockResolvedValue({
        allowed: false,
        reason: "You don't have permission to view this funnel",
      });

      await expect(getSessionsByFunnel(funnelId, userId)).rejects.toThrow(
        "You don't have permission to view this funnel"
      );
    });

    it("should deny non-workspace member", async () => {
      (PermissionManager.can as any).mockResolvedValue({
        allowed: false,
        reason: "You don't have access to this workspace",
      });

      await expect(getSessionsByFunnel(funnelId, userId)).rejects.toThrow(
        "You don't have access to this workspace"
      );
    });
  });

  describe("Session Retrieval", () => {
    const mockFunnel = {
      id: funnelId,
      workspaceId,
      pages: [
        { id: 1, name: "Home" },
        { id: 2, name: "About" },
      ],
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
      });
    });

    it("should return empty array when funnel has no sessions", async () => {
      mockPrisma.session.findMany.mockResolvedValue([]);

      const result = await getSessionsByFunnel(funnelId, userId);

      expect(result.sessions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should return all sessions for a funnel", async () => {
      const mockSessions = [
        {
          id: "session-1",
          sessionId: "sess-abc-123",
          visitedPages: [1, 2, 3],
          createdAt: new Date("2024-01-03"),
          updatedAt: new Date("2024-01-03"),
        },
        {
          id: "session-2",
          sessionId: "sess-def-456",
          visitedPages: [1],
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
        {
          id: "session-3",
          sessionId: "sess-ghi-789",
          visitedPages: [2, 3, 4, 5],
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      const result = await getSessionsByFunnel(funnelId, userId);

      expect(result.sessions).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: { funnelId },
        select: {
          id: true,
          sessionId: true,
          visitedPages: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should include all required fields in session response", async () => {
      const mockSessions = [
        {
          id: "session-1",
          sessionId: "sess-abc-123",
          visitedPages: [1, 2, 3],
          createdAt: new Date("2024-01-01T10:00:00Z"),
          updatedAt: new Date("2024-01-01T12:00:00Z"),
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      const result = await getSessionsByFunnel(funnelId, userId);

      expect(result.sessions[0]).toHaveProperty("id", "session-1");
      expect(result.sessions[0]).toHaveProperty("sessionId", "sess-abc-123");
      expect(result.sessions[0]).toHaveProperty("visitedPages", [1, 2, 3]);
      expect(result.sessions[0]).toHaveProperty("createdAt");
      expect(result.sessions[0]).toHaveProperty("updatedAt");
    });

    it("should handle sessions with empty visitedPages array", async () => {
      const mockSessions = [
        {
          id: "session-1",
          sessionId: "sess-abc-123",
          visitedPages: [],
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      const result = await getSessionsByFunnel(funnelId, userId);

      expect(result.sessions[0].visitedPages).toEqual([]);
    });

    it("should order sessions by createdAt descending (newest first)", async () => {
      const mockSessions = [
        {
          id: "session-3",
          sessionId: "sess-newest",
          visitedPages: [1],
          createdAt: new Date("2024-01-03"),
          updatedAt: new Date("2024-01-03"),
        },
        {
          id: "session-2",
          sessionId: "sess-middle",
          visitedPages: [1],
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
        {
          id: "session-1",
          sessionId: "sess-oldest",
          visitedPages: [1],
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      const result = await getSessionsByFunnel(funnelId, userId);

      expect(result.sessions[0].sessionId).toBe("sess-newest");
      expect(result.sessions[1].sessionId).toBe("sess-middle");
      expect(result.sessions[2].sessionId).toBe("sess-oldest");
    });
  });

  describe("Response Format", () => {
    const mockFunnel = {
      id: funnelId,
      workspaceId,
      pages: [
        { id: 1, name: "Home" },
        { id: 2, name: "About" },
      ],
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
      });
    });

    it("should return correct response structure", async () => {
      const mockSessions = [
        {
          id: "session-1",
          sessionId: "sess-abc-123",
          visitedPages: [1, 2],
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      const result = await getSessionsByFunnel(funnelId, userId);

      expect(result).toHaveProperty("sessions");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.sessions)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("should have total matching sessions array length", async () => {
      const mockSessions = [
        {
          id: "session-1",
          sessionId: "sess-1",
          visitedPages: [1],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "session-2",
          sessionId: "sess-2",
          visitedPages: [2],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "session-3",
          sessionId: "sess-3",
          visitedPages: [3],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      const result = await getSessionsByFunnel(funnelId, userId);

      expect(result.total).toBe(result.sessions.length);
      expect(result.total).toBe(3);
    });
  });

  describe("Date Filtering", () => {
    const mockFunnel = {
      id: funnelId,
      workspaceId,
      pages: [
        { id: 1, name: "Home" },
        { id: 2, name: "About" },
      ],
    };

    beforeEach(() => {
      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
      });
    });

    it("should filter sessions by startDate", async () => {
      const mockSessions = [
        {
          id: "session-1",
          sessionId: "sess-1",
          visitedPages: [1],
          createdAt: new Date("2025-10-05"),
          updatedAt: new Date("2025-10-05"),
        },
        {
          id: "session-2",
          sessionId: "sess-2",
          visitedPages: [1],
          createdAt: new Date("2025-10-06"),
          updatedAt: new Date("2025-10-06"),
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      await getSessionsByFunnel(funnelId, userId, "2025-10-01", undefined);

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: {
          funnelId,
          updatedAt: {
            gte: new Date("2025-10-01"),
          },
        },
        select: {
          id: true,
          sessionId: true,
          visitedPages: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should filter sessions by endDate", async () => {
      const mockSessions = [
        {
          id: "session-1",
          sessionId: "sess-1",
          visitedPages: [1],
          createdAt: new Date("2025-10-05"),
          updatedAt: new Date("2025-10-05"),
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      await getSessionsByFunnel(funnelId, userId, undefined, "2025-10-08");

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: {
          funnelId,
          updatedAt: {
            lte: new Date("2025-10-08T23:59:59.999Z"),
          },
        },
        select: {
          id: true,
          sessionId: true,
          visitedPages: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should filter sessions by date range (startDate and endDate)", async () => {
      const mockSessions = [
        {
          id: "session-1",
          sessionId: "sess-1",
          visitedPages: [1],
          createdAt: new Date("2025-10-05"),
          updatedAt: new Date("2025-10-05"),
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      await getSessionsByFunnel(funnelId, userId, "2025-09-30", "2025-10-08");

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: {
          funnelId,
          updatedAt: {
            gte: new Date("2025-09-30T00:00:00.000Z"),
            lte: new Date("2025-10-08T23:59:59.999Z"),
          },
        },
        select: {
          id: true,
          sessionId: true,
          visitedPages: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should return all sessions when no date filters provided", async () => {
      const mockSessions = [
        {
          id: "session-1",
          sessionId: "sess-1",
          visitedPages: [1],
          createdAt: new Date("2025-10-05"),
          updatedAt: new Date("2025-10-05"),
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      await getSessionsByFunnel(funnelId, userId, undefined, undefined);

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: {
          funnelId,
        },
        select: {
          id: true,
          sessionId: true,
          visitedPages: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should return empty array when no sessions match date filter", async () => {
      mockPrisma.session.findMany.mockResolvedValue([]);

      const result = await getSessionsByFunnel(
        funnelId,
        userId,
        "2025-11-01",
        "2025-11-30"
      );

      expect(result.sessions).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle database error gracefully", async () => {
      mockPrisma.funnel.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(getSessionsByFunnel(funnelId, userId)).rejects.toThrow(
        "Failed to get sessions: Database connection failed"
      );
    });

    it("should handle permission check error", async () => {
      const mockFunnel = {
        id: funnelId,
        workspaceId,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);

      (PermissionManager.can as any).mockRejectedValue(
        new Error("Permission service error")
      );

      await expect(getSessionsByFunnel(funnelId, userId)).rejects.toThrow(
        "Failed to get sessions"
      );
    });

    it("should handle session query error", async () => {
      const mockFunnel = {
        id: funnelId,
        workspaceId,
      };

      mockPrisma.funnel.findUnique.mockResolvedValue(mockFunnel);
      (PermissionManager.can as any).mockResolvedValue({
        allowed: true,
      });
      mockPrisma.session.findMany.mockRejectedValue(
        new Error("Session query failed")
      );

      await expect(getSessionsByFunnel(funnelId, userId)).rejects.toThrow(
        "Failed to get sessions: Session query failed"
      );
    });
  });
});
