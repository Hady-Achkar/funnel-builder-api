import { getPrisma } from '../../../lib/prisma';
import { BadRequestError } from '../../../errors';
import { encrypt } from './utils/encryption';
import { PermissionManager, PermissionAction } from '../../../utils/workspace-utils/workspace-permission-manager';
import {
  LockFunnelRequest,
  LockFunnelResponse,
  lockFunnelRequest,
  lockFunnelResponse,
} from '../../../types/funnel-settings/lock-funnel';
import { ZodError } from 'zod';
import { cacheService } from '../../cache/cache.service';

export const lockFunnel = async (
  userId: number,
  data: Partial<LockFunnelRequest>
): Promise<LockFunnelResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedRequest = lockFunnelRequest.parse(data);

    const prisma = getPrisma();

    // Get funnel with workspace information by slug
    const funnel = await prisma.funnel.findFirst({
      where: {
        slug: validatedRequest.funnelSlug,
        workspace: {
          slug: validatedRequest.workspaceSlug,
        },
      },
      select: {
        id: true,
        slug: true,
        workspaceId: true,
        workspace: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found");
    }

    // Check permissions using centralized PermissionManager
    await PermissionManager.requirePermission({
      userId,
      workspaceId: funnel.workspaceId,
      action: PermissionAction.EDIT_FUNNEL,
    });

    // Encrypt password using AES-256-GCM
    const passwordHash = encrypt(validatedRequest.password.trim());

    await prisma.$transaction(async (tx) => {
      const existingSettings = await tx.funnelSettings.findUnique({
        where: { funnelId: funnel.id },
      });

      if (existingSettings) {
        await tx.funnelSettings.update({
          where: { funnelId: funnel.id },
          data: {
            isPasswordProtected: true,
            passwordHash,
          },
        });
      } else {
        await tx.funnelSettings.create({
          data: {
            funnelId: funnel.id,
            isPasswordProtected: true,
            passwordHash,
          },
        });
      }
    });

    const cacheKeysToInvalidate = [
      `funnel:${funnel.id}:settings:full`,
      `workspace:${validatedRequest.workspaceSlug}:funnel:${funnel.slug}:full`,
      `workspace:${funnel.workspaceId}:funnels:all`,
    ];

    await Promise.all(
      cacheKeysToInvalidate.map(key =>
        cacheService.del(key).catch(err =>
          console.warn(`Failed to invalidate cache key ${key}:`, err)
        )
      )
    );

    const response = {
      message: 'Funnel locked successfully',
      success: true,
    };

    return lockFunnelResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || 'Invalid data provided';
      throw new BadRequestError(message);
    }
    throw error;
  }
};