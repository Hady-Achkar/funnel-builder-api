import { getPrisma } from '../../../lib/prisma';
import { BadRequestError } from '../../../errors';
import { checkFunnelSettingsPermissions } from '../../../helpers/funnel-settings/lock-funnel';
import { hashPassword } from '../../../helpers/funnel-settings/shared';
import {
  LockFunnelRequest,
  LockFunnelResponse,
  lockFunnelRequest,
  lockFunnelResponse,
} from '../../../types/funnel-settings/lock-funnel';
import { ZodError } from 'zod';

export const lockFunnel = async (
  userId: number,
  data: Partial<LockFunnelRequest>
): Promise<LockFunnelResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedRequest = lockFunnelRequest.parse(data);

    await checkFunnelSettingsPermissions(userId, validatedRequest.funnelId);

    const prisma = getPrisma();
    const passwordHash = await hashPassword(validatedRequest.password.trim());

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