import { getPrisma } from '../../../lib/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../errors';
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

    // Step 1: Find domain by hostname
    const domain = await prisma.domain.findUnique({
      where: { hostname: validatedRequest.hostname },
    });

    if (!domain) {
      throw new NotFoundError('Domain not found');
    }

    if (domain.status !== 'ACTIVE') {
      throw new NotFoundError('Domain is not active');
    }

    // Step 2: Find active funnel-domain connection
    const connection = await prisma.funnelDomain.findFirst({
      where: {
        domainId: domain.id,
        isActive: true,
      },
    });

    if (!connection) {
      throw new NotFoundError('No funnel connected to this domain');
    }

    // Step 3: Find funnel with settings
    const funnel = await prisma.funnel.findUnique({
      where: { id: connection.funnelId },
      select: {
        id: true,
        slug: true,
        status: true,
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

    // Step 4: Validate funnel slug matches parameter
    if (funnel.slug !== validatedRequest.funnelSlug) {
      throw new NotFoundError('Funnel not found for this domain');
    }

    // Step 5: Validate funnel is LIVE
    if (funnel.status === 'DRAFT') {
      throw new ForbiddenError('Funnel is not published');
    }

    if (funnel.status === 'ARCHIVED') {
      throw new ForbiddenError('Funnel has been archived');
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