import { getPrisma } from "../../../lib/prisma";

export class WorkspaceLimitsHelper {
  // Resource limits per workspace
  private static readonly MAX_FUNNELS_PER_WORKSPACE = 3;
  private static readonly MAX_DOMAINS_PER_WORKSPACE = 3;
  private static readonly MAX_SUBDOMAINS_PER_WORKSPACE = 3;
  private static readonly MAX_ADMINS_PER_WORKSPACE = 3;

  /**
   * Check if workspace can create more funnels
   */
  static async canCreateFunnel(workspaceId: number): Promise<boolean> {
    const prisma = getPrisma();
    const funnelCount = await prisma.funnel.count({
      where: { workspaceId }
    });
    return funnelCount < this.MAX_FUNNELS_PER_WORKSPACE;
  }

  /**
   * Check if workspace can create more custom domains
   */
  static async canCreateCustomDomain(workspaceId: number): Promise<boolean> {
    const prisma = getPrisma();
    const customDomainCount = await prisma.domain.count({
      where: {
        workspaceId,
        type: 'CUSTOM_DOMAIN'
      }
    });
    return customDomainCount < this.MAX_DOMAINS_PER_WORKSPACE;
  }

  /**
   * Check if workspace can create more subdomains
   */
  static async canCreateSubdomain(workspaceId: number): Promise<boolean> {
    const prisma = getPrisma();
    const subdomainCount = await prisma.domain.count({
      where: {
        workspaceId,
        type: 'SUBDOMAIN'
      }
    });
    return subdomainCount < this.MAX_SUBDOMAINS_PER_WORKSPACE;
  }

  /**
   * Check if workspace can add more admins
   */
  static async canAddAdmin(workspaceId: number): Promise<boolean> {
    const prisma = getPrisma();
    const adminCount = await prisma.workspaceMember.count({
      where: {
        workspaceId,
        role: 'ADMIN'
      }
    });
    return adminCount < this.MAX_ADMINS_PER_WORKSPACE;
  }

  /**
   * Get resource counts for a workspace
   */
  static async getResourceCounts(workspaceId: number) {
    const prisma = getPrisma();

    const [funnelCount, customDomainCount, subdomainCount, adminCount] = await Promise.all([
      prisma.funnel.count({ where: { workspaceId } }),
      prisma.domain.count({ where: { workspaceId, type: 'CUSTOM_DOMAIN' } }),
      prisma.domain.count({ where: { workspaceId, type: 'SUBDOMAIN' } }),
      prisma.workspaceMember.count({ where: { workspaceId, role: 'ADMIN' } })
    ]);

    return {
      funnels: {
        current: funnelCount,
        max: this.MAX_FUNNELS_PER_WORKSPACE,
        canCreate: funnelCount < this.MAX_FUNNELS_PER_WORKSPACE
      },
      customDomains: {
        current: customDomainCount,
        max: this.MAX_DOMAINS_PER_WORKSPACE,
        canCreate: customDomainCount < this.MAX_DOMAINS_PER_WORKSPACE
      },
      subdomains: {
        current: subdomainCount,
        max: this.MAX_SUBDOMAINS_PER_WORKSPACE,
        canCreate: subdomainCount < this.MAX_SUBDOMAINS_PER_WORKSPACE
      },
      admins: {
        current: adminCount,
        max: this.MAX_ADMINS_PER_WORKSPACE,
        canCreate: adminCount < this.MAX_ADMINS_PER_WORKSPACE
      }
    };
  }
}