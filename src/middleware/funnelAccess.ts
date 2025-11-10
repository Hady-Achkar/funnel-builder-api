import { Request, Response, NextFunction } from 'express';
import { getPrisma } from '../lib/prisma';
import { verifyFunnelAccessToken } from '../lib/jwt';

interface FunnelAccessRequest extends Request {
  funnelId?: number;
}

export const checkFunnelAccess = async (
  req: FunnelAccessRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { funnelSlug: paramSlug } = req.params;
    const { hostname, funnelSlug: querySlug } = req.query;

    // Must have either funnelSlug (from params) or hostname (from query)
    if (!paramSlug && !hostname) {
      return res.status(400).json({ error: 'Funnel slug or hostname is required' });
    }

    const prisma = getPrisma();

    let funnel;

    // Option 1: Lookup by funnelSlug (existing behavior for /page endpoints)
    if (paramSlug) {
      funnel = await prisma.funnel.findFirst({
        where: {
          slug: paramSlug as string,
          status: 'LIVE'
        },
        select: {
          id: true,
          slug: true,
          settings: {
            select: {
              isPasswordProtected: true
            }
          }
        }
      });
    }
    // Option 2: Lookup by hostname + funnelSlug (for /sites/public endpoint)
    else if (hostname) {
      // For /sites/public endpoint, funnelSlug query parameter is required
      if (!querySlug) {
        return res.status(400).json({ error: 'Funnel slug parameter is required' });
      }

      // First find the domain by hostname
      const domain = await prisma.domain.findUnique({
        where: { hostname: hostname as string },
        select: { id: true, status: true }
      });

      if (!domain) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      if (domain.status !== 'ACTIVE') {
        return res.status(403).json({
          error: 'Domain not accessible',
          message: `Domain status is ${domain.status}`
        });
      }

      // Find the active funnel connected to this domain that ALSO matches the slug
      const funnelDomain = await prisma.funnelDomain.findFirst({
        where: {
          domainId: domain.id,
          isActive: true,
          funnel: {
            slug: querySlug as string  // Must match the provided slug
          }
        },
        select: {
          funnel: {
            select: {
              id: true,
              slug: true,
              status: true,
              settings: {
                select: {
                  isPasswordProtected: true
                }
              }
            }
          }
        }
      });

      if (!funnelDomain?.funnel) {
        return res.status(404).json({
          error: 'Funnel not found or not connected to this domain',
          message: 'The requested funnel is not associated with this domain'
        });
      }

      // Check funnel status (allow LIVE and SHARED for public sites)
      if (!['LIVE', 'SHARED'].includes(funnelDomain.funnel.status)) {
        return res.status(403).json({
          error: 'Funnel not accessible',
          message: `Funnel status is ${funnelDomain.funnel.status}`
        });
      }

      funnel = funnelDomain.funnel;
    }

    if (!funnel) {
      return res.status(404).json({ error: 'Funnel not found or not publicly accessible' });
    }

    // Store funnelId in request for potential use by controllers
    req.funnelId = funnel.id;

    // If funnel is not password protected, allow access
    if (!funnel.settings?.isPasswordProtected) {
      return next();
    }

    // Check for access token in Authorization header or query parameter
    let token: string | undefined;

    // Try to get token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback to query parameter
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    // If no token provided, request password
    if (!token) {
      return res.status(200).json({
        error: 'Password required',
        message: 'This content is password protected. Please enter the password to continue.',
        requiresPassword: true,
        funnelSlug: funnel.slug
      });
    }

    // Verify the token
    const decoded = verifyFunnelAccessToken(token);

    // Token is invalid or expired
    if (!decoded) {
      return res.status(200).json({
        error: 'Access expired',
        message: 'Your access has expired. Please enter the password again to continue.',
        requiresPassword: true,
        funnelSlug: funnel.slug,
        expired: true
      });
    }

    // Verify token is for this specific funnel
    if (decoded.funnelSlug !== funnel.slug) {
      return res.status(200).json({
        error: 'Invalid access',
        message: 'This content is password protected. Please enter the password to continue.',
        requiresPassword: true,
        funnelSlug: funnel.slug
      });
    }

    // Token is valid, allow access
    return next();

  } catch (error) {
    console.error('Funnel access middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};