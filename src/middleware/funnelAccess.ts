import { Request, Response, NextFunction } from 'express';
import { getPrisma } from '../lib/prisma';
import { getFunnelAccessFromCookies } from '../lib/jwt';

interface FunnelAccessRequest extends Request {
  funnelId?: number;
}

export const checkFunnelAccess = async (
  req: FunnelAccessRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { funnelSlug } = req.params;
    const { hostname } = req.query;

    // Must have either funnelSlug (from params) or hostname (from query)
    if (!funnelSlug && !hostname) {
      return res.status(400).json({ error: 'Funnel slug or hostname is required' });
    }

    const prisma = getPrisma();

    let funnel;

    // Option 1: Lookup by funnelSlug (existing behavior for /page endpoints)
    if (funnelSlug) {
      funnel = await prisma.funnel.findFirst({
        where: {
          slug: funnelSlug as string,
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
    // Option 2: Lookup by hostname (new behavior for /sites/public endpoint)
    else if (hostname) {
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

      // Find the active funnel connected to this domain
      const funnelDomain = await prisma.funnelDomain.findFirst({
        where: {
          domainId: domain.id,
          isActive: true
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
        return res.status(404).json({ error: 'No active funnel found for this domain' });
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

    // Check if user has valid access cookie (now using funnelSlug)
    const hasAccess = getFunnelAccessFromCookies(req.cookies, funnel.slug);

    if (hasAccess) {
      return next(); // User has valid access
    }

    // No access - return 200 with password requirement info (now includes funnelSlug)
    return res.status(200).json({
      error: 'Password required',
      message: 'This funnel is password protected. Please provide the correct password.',
      requiresPassword: true,
      funnelSlug: funnel.slug
    });

  } catch (error) {
    console.error('Funnel access middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};