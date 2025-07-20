import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DomainService } from '../services/domain.service';
import { DomainType } from '../generated/prisma-client';

export class DomainController {
  /**
   * Create a custom domain
   * POST /api/domains/custom
   */
  static async createCustomDomain(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { hostname } = req.body;

      if (!hostname) {
        res.status(400).json({ error: 'Hostname is required' });
        return;
      }

      const domain = await DomainService.createCustomDomain(userId, {
        hostname,
        type: DomainType.CUSTOM_DOMAIN
      });

      res.status(201).json({
        message: 'Custom domain created. Please add ALL of the following DNS records at your domain provider.',
        domain,
        setupInstructions: {
          records: [
            domain.ownershipVerification,
            domain.dnsInstructions
          ],
          nextSteps: [
            'Add the TXT record for domain ownership verification',
            'Add the CNAME record to point your domain to our servers',
            'Wait for DNS propagation (up to 48 hours)',
            'Use the verify endpoint to check status'
          ]
        }
      });
    } catch (error: any) {
      console.error('Create custom domain error:', error);
      
      if (error.message.includes('already registered') || 
          error.message.includes('subdomain')) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create custom domain' });
    }
  }

  /**
   * Create a subdomain
   * POST /api/domains/subdomain
   */
  static async createSubdomain(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { subdomain } = req.body;

      if (!subdomain) {
        res.status(400).json({ error: 'Subdomain is required' });
        return;
      }

      const domain = await DomainService.createSubdomain(userId, { subdomain });

      res.status(201).json({
        message: 'Subdomain created and activated successfully.',
        domain
      });
    } catch (error: any) {
      console.error('Create subdomain error:', error);
      
      if (error.message.includes('already taken') || 
          error.message.includes('reserved') ||
          error.message.includes('Invalid')) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create subdomain' });
    }
  }

  /**
   * Get all user domains
   * GET /api/domains
   */
  static async getUserDomains(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const domains = await DomainService.getUserDomains(userId);

      res.json({ domains });
    } catch (error) {
      console.error('Get user domains error:', error);
      res.status(500).json({ error: 'Failed to retrieve domains' });
    }
  }

  /**
   * Get domain by ID
   * GET /api/domains/:id
   */
  static async getDomainById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const domainId = parseInt(req.params.id);

      if (isNaN(domainId)) {
        res.status(400).json({ error: 'Invalid domain ID' });
        return;
      }

      const domain = await DomainService.getDomainById(domainId, userId);

      if (!domain) {
        res.status(404).json({ error: 'Domain not found' });
        return;
      }

      res.json({ domain });
    } catch (error) {
      console.error('Get domain error:', error);
      res.status(500).json({ error: 'Failed to retrieve domain' });
    }
  }

  /**
   * Verify domain
   * POST /api/domains/:id/verify
   */
  static async verifyDomain(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const domainId = parseInt(req.params.id);

      if (isNaN(domainId)) {
        res.status(400).json({ error: 'Invalid domain ID' });
        return;
      }

      const domain = await DomainService.verifyDomain(domainId, userId);

      let message = 'Domain verification initiated';
      let isFullyActive = false;
      let nextStep = null;

      if (domain.status === 'ACTIVE' && domain.sslStatus === 'ACTIVE') {
        message = 'Congratulations! Your domain is fully configured and active.';
        isFullyActive = true;
      } else if (domain.sslValidationRecords) {
        nextStep = domain.sslValidationRecords;
        message = 'Domain ownership verified. Please add the SSL validation records to complete setup.';
      }

      res.json({
        message,
        domain,
        isFullyActive,
        nextStep
      });
    } catch (error: any) {
      console.error('Verify domain error:', error);
      
      if (error.message === 'Domain not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.message === 'Domain is already active') {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to verify domain' });
    }
  }

  /**
   * Delete domain
   * DELETE /api/domains/:id
   */
  static async deleteDomain(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const domainId = parseInt(req.params.id);

      if (isNaN(domainId)) {
        res.status(400).json({ error: 'Invalid domain ID' });
        return;
      }

      await DomainService.deleteDomain(domainId, userId);

      res.json({ message: 'Domain deleted successfully' });
    } catch (error: any) {
      console.error('Delete domain error:', error);
      
      if (error.message === 'Domain not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to delete domain' });
    }
  }

  /**
   * Link funnel to domain
   * POST /api/domains/:domainId/funnels/:funnelId/link
   */
  static async linkFunnelToDomain(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const domainId = parseInt(req.params.domainId);
      const funnelId = parseInt(req.params.funnelId);

      if (isNaN(domainId) || isNaN(funnelId)) {
        res.status(400).json({ error: 'Invalid domain ID or funnel ID' });
        return;
      }

      await DomainService.linkFunnelToDomain(funnelId, domainId, userId);

      res.json({ message: 'Funnel linked to domain successfully' });
    } catch (error: any) {
      console.error('Link funnel to domain error:', error);
      
      if (error.message.includes('not found') || 
          error.message.includes('already linked')) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to link funnel to domain' });
    }
  }

  /**
   * Unlink funnel from domain
   * DELETE /api/domains/:domainId/funnels/:funnelId/link
   */
  static async unlinkFunnelFromDomain(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const domainId = parseInt(req.params.domainId);
      const funnelId = parseInt(req.params.funnelId);

      if (isNaN(domainId) || isNaN(funnelId)) {
        res.status(400).json({ error: 'Invalid domain ID or funnel ID' });
        return;
      }

      await DomainService.unlinkFunnelFromDomain(funnelId, domainId, userId);

      res.json({ message: 'Funnel unlinked from domain successfully' });
    } catch (error: any) {
      console.error('Unlink funnel from domain error:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to unlink funnel from domain' });
    }
  }

  /**
   * Get verification instructions
   * GET /api/domains/:id/verification
   */
  static async getVerificationInstructions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const domainId = parseInt(req.params.id);

      if (isNaN(domainId)) {
        res.status(400).json({ error: 'Invalid domain ID' });
        return;
      }

      const instructions = await DomainService.getVerificationInstructions(domainId, userId);

      res.json({ instructions });
    } catch (error: any) {
      console.error('Get verification instructions error:', error);
      
      if (error.message === 'Domain not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to get verification instructions' });
    }
  }

  /**
   * Get public funnel (public endpoint)
   * GET /api/domains/public/:hostname/funnels/:funnelId
   */
  static async getPublicFunnel(req: Request, res: Response): Promise<void> {
    try {
      const { hostname, funnelId } = req.params;

      if (!hostname || !funnelId) {
        res.status(400).json({ error: 'Hostname and funnel ID are required' });
        return;
      }

      const funnel = await DomainService.getPublicFunnel(hostname, parseInt(funnelId));

      res.json({ 
        funnel,
        message: 'Funnel data retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get public funnel error:', error);
      
      if (error.message.includes('not found') || 
          error.message.includes('not verified') ||
          error.message.includes('not linked') ||
          error.message.includes('not live')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Failed to retrieve funnel' });
    }
  }
}