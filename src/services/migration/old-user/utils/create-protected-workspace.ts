/**
 * Create Protected Workspace Utility
 *
 * Creates a protected workspace for migrated OLD_MEMBER users
 * Protected workspaces:
 * - Cannot be deleted by users
 * - Get 1 custom domain allocation (override from plan's 0)
 * - Automatically created with OLD_MEMBER plan type
 * - Status: ACTIVE
 *
 * @see ARCHITECTURE.md - Service utility patterns
 */

import { getPrisma } from '../../../../lib/prisma';
import {
  WorkspaceRole,
  WorkspacePermission,
  WorkspaceStatus,
  UserPlan,
  DomainType,
  DomainStatus,
  SslStatus,
} from '../../../../generated/prisma-client';
import { rolePermissionPresets } from '../../../../types/workspace/update';

/**
 * Protected workspace creation parameters
 */
export interface CreateProtectedWorkspaceParams {
  userId: number;
  userEmail: string;
  firstName: string;
  tx?: any; // Prisma transaction client
}

/**
 * Protected workspace creation result
 */
export interface CreateProtectedWorkspaceResult {
  workspaceId: number;
  workspaceName: string;
  workspaceSlug: string;
}

/**
 * Creates a protected workspace for a migrated OLD_MEMBER user
 *
 * @param params - User information for workspace creation
 * @returns Workspace creation result
 *
 * @throws Error if workspace creation fails
 */
export async function createProtectedWorkspace(
  params: CreateProtectedWorkspaceParams
): Promise<CreateProtectedWorkspaceResult> {
  const { userId, userEmail, firstName, tx } = params;
  const prisma = tx || getPrisma();

  // Generate workspace name and slug
  const workspaceName = `${firstName}'s Workspace`;
  const baseSlug = generateSlugFromEmail(userEmail);

  // Find available slug (in case of conflicts)
  const workspaceSlug = await findAvailableSlug(baseSlug);

  // Create workspace - either in provided transaction or new one
  const createWorkspaceInTx = async (txClient: any) => {
    // Check if workspace subdomain already exists (should not happen, but defensive check)
    const domain = process.env.WORKSPACE_DOMAIN!;
    const fullHostname = `${workspaceSlug}.${domain}`;

    const existingDomain = await txClient.domain.findUnique({
      where: { hostname: fullHostname },
    });

    if (existingDomain) {
      throw new Error(
        `Workspace subdomain conflict: ${fullHostname} already exists`
      );
    }

    // Create protected workspace
    const createdWorkspace = await txClient.workspace.create({
      data: {
        name: workspaceName,
        slug: workspaceSlug,
        description: 'Your protected workspace from the migration',
        ownerId: userId,
        planType: UserPlan.OLD_MEMBER,
        status: WorkspaceStatus.ACTIVE,
        isProtected: true, // Protected workspace flag
      },
    });

    // Create workspace subdomain record
    await txClient.domain.create({
      data: {
        hostname: fullHostname,
        type: DomainType.WORKSPACE_SUBDOMAIN,
        status: DomainStatus.ACTIVE,
        sslStatus: SslStatus.ACTIVE,
        workspaceId: null,
        createdBy: userId,
        cloudflareHostnameId: null,
        cloudflareZoneId: null,
        cloudflareRecordId: null,
      },
    });

    // Create owner membership with all permissions
    await txClient.workspaceMember.create({
      data: {
        userId,
        workspaceId: createdWorkspace.id,
        role: WorkspaceRole.OWNER,
        permissions: [
          WorkspacePermission.MANAGE_WORKSPACE,
          WorkspacePermission.MANAGE_MEMBERS,
          WorkspacePermission.CREATE_FUNNELS,
          WorkspacePermission.EDIT_FUNNELS,
          WorkspacePermission.EDIT_PAGES,
          WorkspacePermission.DELETE_FUNNELS,
          WorkspacePermission.VIEW_ANALYTICS,
          WorkspacePermission.MANAGE_DOMAINS,
          WorkspacePermission.CREATE_DOMAINS,
          WorkspacePermission.DELETE_DOMAINS,
          WorkspacePermission.CONNECT_DOMAINS,
        ],
      },
    });

    // Initialize default role permission templates
    const rolesToInitialize = [
      WorkspaceRole.ADMIN,
      WorkspaceRole.EDITOR,
      WorkspaceRole.VIEWER,
    ];

    for (const role of rolesToInitialize) {
      await txClient.workspaceRolePermTemplate.create({
        data: {
          workspaceId: createdWorkspace.id,
          role,
          permissions: rolePermissionPresets[role] || [],
        },
      });
    }

    return createdWorkspace;
  };

  // Execute workspace creation either in provided tx or new transaction
  const workspace = tx
    ? await createWorkspaceInTx(tx)
    : await prisma.$transaction(createWorkspaceInTx);

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceSlug: workspace.slug,
  };
}

/**
 * Generates a slug from email address
 * Example: john.doe@example.com -> john-doe
 */
function generateSlugFromEmail(email: string): string {
  const username = email.split('@')[0];
  const slug = username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // Ensure slug starts and ends with alphanumeric
  return slug || 'workspace';
}

/**
 * Finds an available slug by appending numbers if needed
 */
async function findAvailableSlug(baseSlug: string): Promise<string> {
  const prisma = getPrisma();
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety check to prevent infinite loop
    if (counter > 1000) {
      throw new Error('Unable to find available workspace slug');
    }
  }
}
