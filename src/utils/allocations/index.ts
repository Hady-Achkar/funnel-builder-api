import { getPrisma } from "../../lib/prisma";
import { UserPlan } from "../../generated/prisma-client";

export interface WorkspaceAllocations {
  maxFunnels: number;
  maxSubdomains: number;
  maxCustomDomains: number;
  maxMembers: number;
}

export interface UserAllocations {
  maxWorkspaces: number;
  workspaceAllocations: WorkspaceAllocations;
}

export interface WorkspaceUsage {
  funnelsCount: number;
  subdomainsCount: number;
  customDomainsCount: number;
  membersCount: number;
}

export interface UserUsage {
  workspacesCount: number;
}

export interface AllocationCheckResult {
  canCreateFunnel: boolean;
  canCreateSubdomain: boolean;
  canCreateCustomDomain: boolean;
  canAddMember: boolean;
  canCreateWorkspace: boolean;
  allocations: UserAllocations;
  workspaceUsage: WorkspaceUsage;
  userUsage: UserUsage;
}

export class AllocationService {
  private static getAllocationsByPlan(plan: UserPlan): UserAllocations {
    switch (plan) {
      case "FREE":
        return {
          maxWorkspaces: 1,
          workspaceAllocations: {
            maxFunnels: 1,
            maxSubdomains: 1,
            maxCustomDomains: 0,
            maxMembers: 3,
          },
        };
      case "BUSINESS":
        return {
          maxWorkspaces: 3,
          workspaceAllocations: {
            maxFunnels: 5,
            maxSubdomains: 3,
            maxCustomDomains: 2,
            maxMembers: 3,
          },
        };
      case "AGENCY":
        return {
          maxWorkspaces: 100,
          workspaceAllocations: {
            maxFunnels: 500,
            maxSubdomains: 200,
            maxCustomDomains: 100,
            maxMembers: 500,
          },
        };
      default:
        return {
          maxWorkspaces: 1,
          workspaceAllocations: {
            maxFunnels: 100,
            maxSubdomains: 100,
            maxCustomDomains: 100,
            maxMembers: 300,
          },
        };
    }
  }

  static async checkAllocations(
    userId: number,
    workspaceId?: number
  ): Promise<AllocationCheckResult> {
    const prisma = getPrisma();

    // Get user plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const allocations = this.getAllocationsByPlan(user.plan);

    // Get user's workspace count
    const workspacesCount = await prisma.workspace.count({
      where: { ownerId: userId },
    });

    const userUsage: UserUsage = {
      workspacesCount,
    };

    let workspaceUsage: WorkspaceUsage = {
      funnelsCount: 0,
      subdomainsCount: 0,
      customDomainsCount: 0,
      membersCount: 0,
    };

    // If workspaceId is provided, get workspace-specific usage
    if (workspaceId) {
      const [funnelsCount, subdomainsCount, customDomainsCount, membersCount] =
        await Promise.all([
          prisma.funnel.count({
            where: { workspaceId },
          }),
          prisma.domain.count({
            where: {
              workspaceId,
              type: "SUBDOMAIN",
            },
          }),
          prisma.domain.count({
            where: {
              workspaceId,
              type: "CUSTOM_DOMAIN",
            },
          }),
          prisma.workspaceMember.count({
            where: {
              workspaceId,
            },
          }),
        ]);

      workspaceUsage = {
        funnelsCount,
        subdomainsCount,
        customDomainsCount,
        membersCount,
      };
    }

    return {
      canCreateFunnel:
        workspaceUsage.funnelsCount <
        allocations.workspaceAllocations.maxFunnels,
      canCreateSubdomain:
        workspaceUsage.subdomainsCount <
        allocations.workspaceAllocations.maxSubdomains,
      canCreateCustomDomain:
        workspaceUsage.customDomainsCount <
        allocations.workspaceAllocations.maxCustomDomains,
      canAddMember:
        workspaceUsage.membersCount <
        allocations.workspaceAllocations.maxMembers,
      canCreateWorkspace: userUsage.workspacesCount < allocations.maxWorkspaces,
      allocations,
      workspaceUsage,
      userUsage,
    };
  }

  static async canCreateFunnel(
    userId: number,
    workspaceId: number
  ): Promise<boolean> {
    const result = await this.checkAllocations(userId, workspaceId);
    return result.canCreateFunnel;
  }

  static async canCreateSubdomain(
    userId: number,
    workspaceId: number
  ): Promise<boolean> {
    const result = await this.checkAllocations(userId, workspaceId);
    return result.canCreateSubdomain;
  }

  static async canCreateCustomDomain(
    userId: number,
    workspaceId: number
  ): Promise<boolean> {
    const result = await this.checkAllocations(userId, workspaceId);
    return result.canCreateCustomDomain;
  }

  static async canAddMember(
    userId: number,
    workspaceId: number
  ): Promise<boolean> {
    const result = await this.checkAllocations(userId, workspaceId);
    return result.canAddMember;
  }

  static async canCreateWorkspace(userId: number): Promise<boolean> {
    const result = await this.checkAllocations(userId);
    return result.canCreateWorkspace;
  }
}
