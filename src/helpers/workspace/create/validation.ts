import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors/http-errors";

/**
 * Validates that a workspace slug is available (both as workspace slug and subdomain)
 */
export async function validateSlugAvailability(slug: string): Promise<void> {
  const prisma = getPrisma();

  // Check if workspace slug already exists
  const existingWorkspace = await prisma.workspace.findUnique({
    where: { slug },
  });

  if (existingWorkspace) {
    throw new BadRequestError(
      "This workspace slug is already taken. Please choose another one."
    );
  }

  // Check if subdomain would conflict with existing domains
  const workspaceDomain = process.env.WORKSPACE_DOMAIN
  const potentialHostname = `${slug}.${workspaceDomain}`;
  
  const existingDomain = await prisma.domain.findUnique({
    where: { hostname: potentialHostname },
  });

  if (existingDomain) {
    throw new BadRequestError(
      "This slug would create a conflicting subdomain. Please choose another one."
    );
  }
}

/**
 * Validates that the workspace name is not already used by this user
 */
export async function validateWorkspaceNameUniqueness(
  userId: number,
  name: string
): Promise<void> {
  const prisma = getPrisma();

  const existingWorkspace = await prisma.workspace.findFirst({
    where: {
      ownerId: userId,
      name: name,
    },
  });

  if (existingWorkspace) {
    throw new BadRequestError(
      "You already have a workspace with this name. Please choose a different name."
    );
  }
}

/**
 * Validates that user has not exceeded their workspace limit based on plan
 */
export async function validateUserWorkspaceLimit(
  userId: number
): Promise<void> {
  const prisma = getPrisma();

  // Get user's maximum workspace limit
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      maximumWorkspaces: true,
      plan: true,
    },
  });

  if (!user) {
    throw new BadRequestError("User not found");
  }

  // Count existing workspaces owned by user
  const workspaceCount = await prisma.workspace.count({
    where: { ownerId: userId },
  });

  if (workspaceCount >= user.maximumWorkspaces) {
    throw new BadRequestError(
      `You have reached your workspace limit of ${user.maximumWorkspaces} workspace${user.maximumWorkspaces !== 1 ? 's' : ''}. Please upgrade your plan to create more workspaces.`
    );
  }
}

/**
 * Validates slug format for workspace creation
 */
export function validateSlugFormat(slug: string): void {
  // Additional validation beyond Zod schema
  const reservedSlugs = [
    'api', 'www', 'admin', 'dashboard', 'app', 'mail', 'ftp', 'blog',
    'help', 'support', 'docs', 'status', 'cdn', 'assets', 'static',
    'images', 'img', 'css', 'js', 'fonts', 'media', 'files'
  ];

  if (reservedSlugs.includes(slug.toLowerCase())) {
    throw new BadRequestError(
      `The slug "${slug}" is reserved and cannot be used. Please choose a different slug.`
    );
  }
}