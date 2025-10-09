import { getPrisma } from '../../../lib/prisma';
import { BadRequestError } from '../../../errors';
import bcrypt from 'bcryptjs';
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

    // Get funnel to retrieve workspaceId
    const funnel = await prisma.funnel.findUnique({
      where: { id: validatedRequest.funnelId },
      select: { id: true, workspaceId: true },
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

    // Hash password using bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(validatedRequest.password.trim(), 10);

    await prisma.$transaction(async (tx) => {
      const existingSettings = await tx.funnelSettings.findUnique({
        where: { funnelId: validatedRequest.funnelId },
      });

      if (existingSettings) {
        await tx.funnelSettings.update({
          where: { funnelId: validatedRequest.funnelId },
          data: {
            isPasswordProtected: true,
            passwordHash,
          },
        });
      } else {
        await tx.funnelSettings.create({
          data: {
            funnelId: validatedRequest.funnelId,
            isPasswordProtected: true,
            passwordHash,
          },
        });
      }
    });

    const cacheKeysToInvalidate = [
      `funnel:${validatedRequest.funnelId}:settings:full`,
      `workspace:${funnel.workspaceId}:funnel:${funnel.id}:full`,
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