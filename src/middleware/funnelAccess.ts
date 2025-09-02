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
    
    if (!funnelSlug) {
      return res.status(400).json({ error: 'Funnel slug is required' });
    }

    const prisma = getPrisma();
    
    // Get funnel and its settings
    const funnel = await prisma.funnel.findFirst({
      where: { 
        slug: funnelSlug,
        status: 'LIVE'
      },
      select: {
        id: true,
        settings: {
          select: {
            isPasswordProtected: true
          }
        }
      }
    });

    if (!funnel) {
      return res.status(404).json({ error: 'Funnel not found or not publicly accessible' });
    }

    // Store funnelId in request for potential use by controllers
    req.funnelId = funnel.id;

    // If funnel is not password protected, allow access
    if (!funnel.settings?.isPasswordProtected) {
      return next();
    }

    // Check if user has valid access cookie
    const hasAccess = getFunnelAccessFromCookies(req.cookies, funnel.id);
    
    if (hasAccess) {
      return next(); // User has valid access
    }

    // No access - return 403 with password requirement info
    return res.status(403).json({ 
      error: 'Password required',
      message: 'This funnel is password protected. Please provide the correct password.',
      requiresPassword: true,
      funnelId: funnel.id
    });

  } catch (error) {
    console.error('Funnel access middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};