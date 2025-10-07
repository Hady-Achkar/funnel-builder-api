import { describe, it, expect, beforeEach, vi } from "vitest";
import { AcceptInvitationService } from "../../services/workspace/accept-invitation";
import { MembershipStatus, UserPlan, AddOnType } from "../../generated/prisma-client";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../errors";

// Mock Prisma
const mockPrismaInstance = {
  user: {
    findUnique: vi.fn(),
  },
  workspaceMember: {
    findFirst: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  workspace: {
    findUnique: vi.fn(),
  },
};

vi.mock("../../lib/prisma", () => ({
  getPrisma: vi.fn(() => mockPrismaInstance),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../../services/cache/cache.service", () => ({
  cacheService: {
    del: vi.fn(),
  },
}));

describe("Accept Invitation Service - Allocation Tests", () => {
  let service: AcceptInvitationService;
  let mockPrisma: any;
  let mockJwt: any;

  beforeEach(async () => {
    const jwt = await import("jsonwebtoken");

    service = new AcceptInvitationService();
    mockPrisma = mockPrismaInstance;
    mockJwt = jwt.default;

    vi.clearAllMocks();
  });

  describe("Member Allocation Checks", () => {
    it("should accept invitation when workspace has available slots (FREE plan)", async () => {
      const userId = 1;
      const token = "valid-token";
      const tokenPayload = {
        workspaceId: 1,
        email: "newuser@example.com",
        role: "EDITOR",
        type: "workspace_invitation",
      };

      mockJwt.verify.mockReturnValue(tokenPayload);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: "newuser@example.com",
      });

      mockPrisma.workspaceMember.findFirst.mockResolvedValue({
        id: 10,
        email: "newuser@example.com",
        workspaceId: 1,
        status: MembershipStatus.PENDING,
        role: "EDITOR",
        permissions: [],
      });

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 2,
        planType: UserPlan.FREE,
        addOns: [],
      });

      // Current count: 2 ACTIVE members (limit is 3 for FREE)
      mockPrisma.workspaceMember.count.mockResolvedValue(2);

      mockPrisma.workspaceMember.update.mockResolvedValue({
        id: 10,
        userId,
        role: "EDITOR",
        permissions: [],
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date(),
      });

      const result = await service.acceptInvitation(userId, { token });

      expect(result.message).toBe("Invitation accepted successfully");
      expect(mockPrisma.workspaceMember.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          userId,
          status: MembershipStatus.ACTIVE,
          joinedAt: expect.any(Date),
        },
      });
    });

    it("should reject invitation when FREE workspace is at member limit", async () => {
      const userId = 1;
      const token = "valid-token";
      const tokenPayload = {
        workspaceId: 1,
        email: "newuser@example.com",
        role: "EDITOR",
        type: "workspace_invitation",
      };

      mockJwt.verify.mockReturnValue(tokenPayload);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: "newuser@example.com",
      });

      mockPrisma.workspaceMember.findFirst.mockResolvedValue({
        id: 10,
        email: "newuser@example.com",
        workspaceId: 1,
        status: MembershipStatus.PENDING,
        role: "EDITOR",
        permissions: [],
      });

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 2,
        planType: UserPlan.FREE,
        addOns: [],
      });

      // Current count: 3 ACTIVE members (limit is 3 for FREE)
      mockPrisma.workspaceMember.count.mockResolvedValue(3);

      await expect(
        service.acceptInvitation(userId, { token })
      ).rejects.toThrow(BadRequestError);

      await expect(
        service.acceptInvitation(userId, { token })
      ).rejects.toThrow("Workspace member limit has been reached");

      expect(mockPrisma.workspaceMember.update).not.toHaveBeenCalled();
    });

    it("should accept invitation for BUSINESS workspace with add-ons", async () => {
      const userId = 1;
      const token = "valid-token";
      const tokenPayload = {
        workspaceId: 1,
        email: "newuser@example.com",
        role: "EDITOR",
        type: "workspace_invitation",
      };

      mockJwt.verify.mockReturnValue(tokenPayload);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: "newuser@example.com",
      });

      mockPrisma.workspaceMember.findFirst.mockResolvedValue({
        id: 10,
        email: "newuser@example.com",
        workspaceId: 1,
        status: MembershipStatus.PENDING,
        role: "EDITOR",
        permissions: [],
      });

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 2,
        planType: UserPlan.BUSINESS,
        addOns: [
          { type: AddOnType.EXTRA_ADMIN, quantity: 2, status: "ACTIVE" },
        ],
      });

      // Current count: 4 ACTIVE members (base 3 + 2 from add-on = 5 total)
      mockPrisma.workspaceMember.count.mockResolvedValue(4);

      mockPrisma.workspaceMember.update.mockResolvedValue({
        id: 10,
        userId,
        role: "EDITOR",
        permissions: [],
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date(),
      });

      const result = await service.acceptInvitation(userId, { token });

      expect(result.message).toBe("Invitation accepted successfully");
      expect(mockPrisma.workspaceMember.update).toHaveBeenCalled();
    });

    it("should accept invitation for AGENCY workspace with high limits", async () => {
      const userId = 1;
      const token = "valid-token";
      const tokenPayload = {
        workspaceId: 1,
        email: "newuser@example.com",
        role: "EDITOR",
        type: "workspace_invitation",
      };

      mockJwt.verify.mockReturnValue(tokenPayload);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: "newuser@example.com",
      });

      mockPrisma.workspaceMember.findFirst.mockResolvedValue({
        id: 10,
        email: "newuser@example.com",
        workspaceId: 1,
        status: MembershipStatus.PENDING,
        role: "EDITOR",
        permissions: [],
      });

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        name: "Agency Workspace",
        slug: "agency-workspace",
        ownerId: 2,
        planType: UserPlan.AGENCY,
        addOns: [],
      });

      // Current count: 499 ACTIVE members (limit is 500 for AGENCY)
      mockPrisma.workspaceMember.count.mockResolvedValue(499);

      mockPrisma.workspaceMember.update.mockResolvedValue({
        id: 10,
        userId,
        role: "EDITOR",
        permissions: [],
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date(),
      });

      const result = await service.acceptInvitation(userId, { token });

      expect(result.message).toBe("Invitation accepted successfully");
      expect(mockPrisma.workspaceMember.update).toHaveBeenCalled();
    });

    it("should reject invitation when AGENCY workspace is at member limit", async () => {
      const userId = 1;
      const token = "valid-token";
      const tokenPayload = {
        workspaceId: 1,
        email: "newuser@example.com",
        role: "EDITOR",
        type: "workspace_invitation",
      };

      mockJwt.verify.mockReturnValue(tokenPayload);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: "newuser@example.com",
      });

      mockPrisma.workspaceMember.findFirst.mockResolvedValue({
        id: 10,
        email: "newuser@example.com",
        workspaceId: 1,
        status: MembershipStatus.PENDING,
        role: "EDITOR",
        permissions: [],
      });

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        name: "Agency Workspace",
        slug: "agency-workspace",
        ownerId: 2,
        planType: UserPlan.AGENCY,
        addOns: [],
      });

      // Current count: 500 ACTIVE members (at limit for AGENCY)
      mockPrisma.workspaceMember.count.mockResolvedValue(500);

      await expect(
        service.acceptInvitation(userId, { token })
      ).rejects.toThrow(BadRequestError);

      expect(mockPrisma.workspaceMember.update).not.toHaveBeenCalled();
    });
  });

  describe("Error Cases", () => {
    it("should reject invalid token", async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(
        service.acceptInvitation(1, { token: "invalid-token" })
      ).rejects.toThrow(BadRequestError);
    });

    it("should reject when no pending invitation exists", async () => {
      const tokenPayload = {
        workspaceId: 1,
        email: "newuser@example.com",
        role: "EDITOR",
        type: "workspace_invitation",
      };

      mockJwt.verify.mockReturnValue(tokenPayload);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "newuser@example.com",
      });

      mockPrisma.workspaceMember.findFirst.mockResolvedValue(null);

      await expect(
        service.acceptInvitation(1, { token: "valid-token" })
      ).rejects.toThrow(ForbiddenError);
    });

    it("should reject when workspace doesn't exist", async () => {
      const tokenPayload = {
        workspaceId: 999,
        email: "newuser@example.com",
        role: "EDITOR",
        type: "workspace_invitation",
      };

      mockJwt.verify.mockReturnValue(tokenPayload);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "newuser@example.com",
      });

      mockPrisma.workspaceMember.findFirst.mockResolvedValue({
        id: 10,
        email: "newuser@example.com",
        workspaceId: 999,
        status: MembershipStatus.PENDING,
      });

      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptInvitation(1, { token: "valid-token" })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
