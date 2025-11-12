import { getPrisma } from '../../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../../errors';
import { decrypt } from '../lock-funnel/utils/encryption';
import {
  VerifyPasswordRequest,
  VerifyPasswordResponse,
  verifyPasswordRequest,
  verifyPasswordResponse,
} from '../../../types/funnel-settings/verify-password';
import { ZodError } from 'zod';

export const verifyFunnelPassword = async (
  data: Partial<VerifyPasswordRequest>
): Promise<VerifyPasswordResponse> => {
  try {
    const validatedRequest = verifyPasswordRequest.parse(data);

    const prisma = getPrisma();

    // First, find the funnel by slug (using findFirst since slug is not unique alone)
    const funnel = await prisma.funnel.findFirst({
      where: { slug: validatedRequest.funnelSlug },
      select: {
        id: true,
        slug: true,
        settings: {
          select: {
            isPasswordProtected: true,
            passwordHash: true,
          },
        },
      },
    });

    if (!funnel) {
      throw new NotFoundError('Funnel not found');
    }

    if (!funnel.settings) {
      throw new NotFoundError('Funnel settings not found');
    }

    const funnelSettings = funnel.settings;

    // If funnel is not password protected, allow access
    if (!funnelSettings.isPasswordProtected || !funnelSettings.passwordHash) {
      const response = {
        valid: true,
        message: 'Access granted',
        funnelId: funnel.id,
      };
      return verifyPasswordResponse.parse(response);
    }

    // Decrypt and verify the password
    let isValidPassword = false;
    try {
      const decryptedPassword = decrypt(funnelSettings.passwordHash);
      isValidPassword = decryptedPassword === validatedRequest.password;
    } catch (error) {
      // If decryption fails, password is invalid
      isValidPassword = false;
    }

    const response = {
      valid: isValidPassword,
      message: isValidPassword ? 'Access granted' : 'Incorrect password. Please try again.',
      funnelId: funnel.id,
    };

    return verifyPasswordResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || 'Invalid data provided';
      throw new BadRequestError(message);
    }
    throw error;
  }
};