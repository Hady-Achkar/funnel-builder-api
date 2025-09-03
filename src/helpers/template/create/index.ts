import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";

export interface PermissionCheckResult {
  isAdmin: boolean;
  hasAccess: boolean;
  workspace: {
    id: number;
    name: string;
    ownerId: number;
  };
  funnel: {
    id: number;
    name: string;
    workspaceId: number;
    createdBy: number;
  };
}

export const checkTemplateCreationPermissions = async (
  userId: number,
  funnelId: number
): Promise<PermissionCheckResult> => {
  const prisma = getPrisma();

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      isAdmin: true 
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Only admins can create templates
  if (!user.isAdmin) {
    throw new ForbiddenError("Only admin users can create templates");
  }

  // Get funnel with workspace details
  const funnel = await prisma.funnel.findUnique({
    where: { id: funnelId },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      createdBy: true,
      workspace: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
    },
  });

  if (!funnel) {
    throw new NotFoundError("Funnel not found");
  }

  if (!funnel.workspace) {
    throw new NotFoundError("Workspace not found for this funnel");
  }

  // Check if user has access to the workspace
  const isWorkspaceOwner = funnel.workspace.ownerId === userId;
  
  let hasWorkspaceAccess = isWorkspaceOwner;
  
  if (!isWorkspaceOwner) {
    // Check if user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userId,
          workspaceId: funnel.workspaceId,
        },
      },
      select: {
        role: true,
        permissions: true,
      },
    });

    if (workspaceMember) {
      hasWorkspaceAccess = true;
    }
  }

  if (!hasWorkspaceAccess) {
    throw new ForbiddenError(
      `You don't have access to the workspace "${funnel.workspace.name}" containing this funnel`
    );
  }

  return {
    isAdmin: user.isAdmin,
    hasAccess: hasWorkspaceAccess,
    workspace: funnel.workspace,
    funnel: {
      id: funnel.id,
      name: funnel.name,
      workspaceId: funnel.workspaceId,
      createdBy: funnel.createdBy,
    },
  };
};

export interface PageLinkingMap {
  oldLinkingId: string;
  newLinkingId: string;
}

/**
 * Generates a unique 8-character alphanumeric ID
 */
export const generateShortUniqueId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Creates a mapping of old linking IDs to new linking IDs for all pages
 */
export const createLinkingIdMap = (
  pages: Array<{ linkingId: string | null }>
): Map<string, string> => {
  const linkingIdMap = new Map<string, string>();
  const usedIds = new Set<string>();

  pages.forEach(page => {
    if (page.linkingId) {
      let newId = generateShortUniqueId();
      
      // Ensure uniqueness
      while (usedIds.has(newId)) {
        newId = generateShortUniqueId();
      }
      
      usedIds.add(newId);
      linkingIdMap.set(page.linkingId, newId);
    }
  });

  return linkingIdMap;
};

/**
 * Replaces all occurrences of old linking IDs with new linking IDs in content
 * This ensures that internal page links remain functional in the template
 */
export const replaceLinkingIdsInContent = (
  content: string | null,
  linkingIdMap: Map<string, string>
): string | null => {
  if (!content) return content;
  
  let updatedContent = content;
  
  linkingIdMap.forEach((newLinkingId, oldLinkingId) => {
    // Escape special regex characters in the linking ID
    const escapedOldId = oldLinkingId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace linking IDs in various link contexts:
    
    // 1. In href attributes: href="linkingId", href='linkingId', href="/linkingId", href='/linkingId'
    updatedContent = updatedContent.replace(
      new RegExp(`(href\\s*=\\s*["'])/?${escapedOldId}(["'])`, 'gi'),
      `$1${newLinkingId}$2`
    );
    
    // 2. In src attributes: src="linkingId", src='linkingId', src="/linkingId", src='/linkingId'  
    updatedContent = updatedContent.replace(
      new RegExp(`(src\\s*=\\s*["'])/?${escapedOldId}(["'])`, 'gi'),
      `$1${newLinkingId}$2`
    );
    
    // 3. In action attributes: action="linkingId", action='linkingId'
    updatedContent = updatedContent.replace(
      new RegExp(`(action\\s*=\\s*["'])/?${escapedOldId}(["'])`, 'gi'),
      `$1${newLinkingId}$2`
    );
    
    // 4. URL paths after slash: /linkingId (word boundary)
    updatedContent = updatedContent.replace(
      new RegExp(`(/)${escapedOldId}\\b`, 'g'),
      `$1${newLinkingId}`
    );
    
    // 5. In brackets (commonly used for links): [linkingId]
    updatedContent = updatedContent.replace(
      new RegExp(`(\\[)${escapedOldId}(\\])`, 'g'),
      `$1${newLinkingId}$2`
    );
    
    // 6. In parentheses (commonly used for links): (linkingId)
    updatedContent = updatedContent.replace(
      new RegExp(`(\\()${escapedOldId}(\\))`, 'g'),
      `$1${newLinkingId}$2`
    );
    
    // 7. After equals sign in any context: =linkingId, ="linkingId", ='linkingId'
    updatedContent = updatedContent.replace(
      new RegExp(`(=["']?)${escapedOldId}(["']?)`, 'g'),
      `$1${newLinkingId}$2`
    );
    
    // 8. In query parameters: ?page=linkingId, &page=linkingId
    updatedContent = updatedContent.replace(
      new RegExp(`([?&]\\w+=)${escapedOldId}\\b`, 'g'),
      `$1${newLinkingId}`
    );
    
    // 9. As standalone link (word boundaries): ensure it's not part of another word
    updatedContent = updatedContent.replace(
      new RegExp(`\\b${escapedOldId}\\b(?=[\\s"'\\]\\)/>])`, 'g'),
      newLinkingId
    );
    
    // 10. In data attributes: data-link="linkingId", data-target="linkingId"
    updatedContent = updatedContent.replace(
      new RegExp(`(data-[\\w-]+\\s*=\\s*["'])${escapedOldId}(["'])`, 'gi'),
      `$1${newLinkingId}$2`
    );
    
    // 11. In onclick and other event handlers: onclick="goTo('linkingId')"
    updatedContent = updatedContent.replace(
      new RegExp(`(['"])${escapedOldId}(['"])`, 'g'),
      `$1${newLinkingId}$2`
    );
  });
  
  return updatedContent;
};

/**
 * Get the new linking ID for a page given its old linking ID
 */
export const getNewLinkingId = (
  oldLinkingId: string | null,
  linkingIdMap: Map<string, string>
): string | null => {
  if (!oldLinkingId) return null;
  return linkingIdMap.get(oldLinkingId) || oldLinkingId;
};