import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { DomainController } from '../../controllers/domain.controller';
import { DomainService } from '../../services/domain.service';
import { authenticateToken, AuthRequest } from '../../middleware/auth';
import { DomainType, DomainStatus } from '../../generated/prisma-client';

// Mock DomainService
vi.mock('../../services/domain.service');

// Mock auth middleware
vi.mock('../../middleware/auth', () => ({
  authenticateToken: vi.fn((req: any, res: any, next: any) => {
    req.userId = 1; // Mock authenticated user
    next();
  })
}));

const app = express();
app.use(express.json());

// Routes
app.post('/domains/custom', authenticateToken, DomainController.createCustomDomain);
app.post('/domains/subdomain', authenticateToken, DomainController.createSubdomain);
app.get('/domains', authenticateToken, DomainController.getUserDomains);
app.get('/domains/:id', authenticateToken, DomainController.getDomainById);
app.post('/domains/:id/verify', authenticateToken, DomainController.verifyDomain);
app.delete('/domains/:id', authenticateToken, DomainController.deleteDomain);
app.post('/domains/:domainId/funnels/:funnelId/link', authenticateToken, DomainController.linkFunnelToDomain);
app.get('/domains/public/:hostname/funnels/:funnelId', DomainController.getPublicFunnel);

describe('DomainController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /domains/custom', () => {
    it('should create custom domain successfully', async () => {
      const domainData = { hostname: 'www.example.com' };
      const mockDomain = {
        id: 1,
        hostname: domainData.hostname,
        type: DomainType.CUSTOM_DOMAIN,
        status: DomainStatus.PENDING,
        ownershipVerification: { type: 'TXT', name: '_verify', value: 'test' },
        dnsInstructions: { type: 'CNAME', name: 'www', value: 'fallback.digitalsite.ai' }
      };

      vi.mocked(DomainService.createCustomDomain).mockResolvedValue(mockDomain as any);

      const response = await request(app)
        .post('/domains/custom')
        .send(domainData)
        .expect(201);

      expect(response.body.message).toContain('Custom domain created');
      expect(response.body.domain).toEqual(mockDomain);
      expect(response.body.setupInstructions.records).toHaveLength(2);
      expect(DomainService.createCustomDomain).toHaveBeenCalledWith(1, {
        hostname: domainData.hostname,
        type: DomainType.CUSTOM_DOMAIN
      });
    });

    it('should return 400 if hostname is missing', async () => {
      const response = await request(app)
        .post('/domains/custom')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Hostname is required');
      expect(DomainService.createCustomDomain).not.toHaveBeenCalled();
    });

    it('should return 400 for domain validation errors', async () => {
      vi.mocked(DomainService.createCustomDomain).mockRejectedValue(
        new Error('Please provide a subdomain')
      );

      const response = await request(app)
        .post('/domains/custom')
        .send({ hostname: 'example.com' })
        .expect(400);

      expect(response.body.error).toBe('Please provide a subdomain');
    });

    it('should return 500 for internal server errors', async () => {
      vi.mocked(DomainService.createCustomDomain).mockRejectedValue(
        new Error('CloudFlare API error')
      );

      const response = await request(app)
        .post('/domains/custom')
        .send({ hostname: 'www.example.com' })
        .expect(500);

      expect(response.body.error).toBe('Failed to create custom domain');
    });
  });

  describe('POST /domains/subdomain', () => {
    it('should create subdomain successfully', async () => {
      const subdomainData = { subdomain: 'mystore' };
      const mockDomain = {
        id: 1,
        hostname: 'mystore.digitalsite.ai',
        type: DomainType.SUBDOMAIN,
        status: DomainStatus.ACTIVE
      };

      vi.mocked(DomainService.createSubdomain).mockResolvedValue(mockDomain as any);

      const response = await request(app)
        .post('/domains/subdomain')
        .send(subdomainData)
        .expect(201);

      expect(response.body.message).toContain('Subdomain created and activated');
      expect(response.body.domain).toEqual(mockDomain);
      expect(DomainService.createSubdomain).toHaveBeenCalledWith(1, subdomainData);
    });

    it('should return 400 if subdomain is missing', async () => {
      const response = await request(app)
        .post('/domains/subdomain')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Subdomain is required');
      expect(DomainService.createSubdomain).not.toHaveBeenCalled();
    });

    it('should return 400 for reserved subdomain names', async () => {
      vi.mocked(DomainService.createSubdomain).mockRejectedValue(
        new Error('"www" is a reserved subdomain name')
      );

      const response = await request(app)
        .post('/domains/subdomain')
        .send({ subdomain: 'www' })
        .expect(400);

      expect(response.body.error).toContain('reserved subdomain name');
    });
  });

  describe('GET /domains', () => {
    it('should get user domains successfully', async () => {
      const mockDomains = [
        { id: 1, hostname: 'www.example.com', type: DomainType.CUSTOM_DOMAIN },
        { id: 2, hostname: 'mystore.digitalsite.ai', type: DomainType.SUBDOMAIN }
      ];

      vi.mocked(DomainService.getUserDomains).mockResolvedValue(mockDomains as any);

      const response = await request(app)
        .get('/domains')
        .expect(200);

      expect(response.body.domains).toEqual(mockDomains);
      expect(DomainService.getUserDomains).toHaveBeenCalledWith(1);
    });

    it('should return empty array if no domains', async () => {
      vi.mocked(DomainService.getUserDomains).mockResolvedValue([]);

      const response = await request(app)
        .get('/domains')
        .expect(200);

      expect(response.body.domains).toEqual([]);
    });
  });

  describe('GET /domains/:id', () => {
    it('should get domain by ID successfully', async () => {
      const mockDomain = {
        id: 1,
        hostname: 'www.example.com',
        type: DomainType.CUSTOM_DOMAIN
      };

      vi.mocked(DomainService.getDomainById).mockResolvedValue(mockDomain as any);

      const response = await request(app)
        .get('/domains/1')
        .expect(200);

      expect(response.body.domain).toEqual(mockDomain);
      expect(DomainService.getDomainById).toHaveBeenCalledWith(1, 1);
    });

    it('should return 400 for invalid domain ID', async () => {
      const response = await request(app)
        .get('/domains/invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid domain ID');
      expect(DomainService.getDomainById).not.toHaveBeenCalled();
    });

    it('should return 404 if domain not found', async () => {
      vi.mocked(DomainService.getDomainById).mockResolvedValue(null);

      const response = await request(app)
        .get('/domains/999')
        .expect(404);

      expect(response.body.error).toBe('Domain not found');
    });
  });

  describe('POST /domains/:id/verify', () => {
    it('should verify domain successfully', async () => {
      const mockDomain = {
        id: 1,
        hostname: 'www.example.com',
        status: DomainStatus.ACTIVE,
        sslStatus: 'ACTIVE'
      };

      vi.mocked(DomainService.verifyDomain).mockResolvedValue(mockDomain as any);

      const response = await request(app)
        .post('/domains/1/verify')
        .expect(200);

      expect(response.body.message).toContain('Congratulations');
      expect(response.body.isFullyActive).toBe(true);
      expect(response.body.domain).toEqual(mockDomain);
      expect(DomainService.verifyDomain).toHaveBeenCalledWith(1, 1);
    });

    it('should return verification in progress status', async () => {
      const mockDomain = {
        id: 1,
        hostname: 'www.example.com',
        status: DomainStatus.PENDING,
        sslStatus: 'PENDING',
        sslValidationRecords: [{ type: 'TXT', name: '_acme', value: 'test' }]
      };

      vi.mocked(DomainService.verifyDomain).mockResolvedValue(mockDomain as any);

      const response = await request(app)
        .post('/domains/1/verify')
        .expect(200);

      expect(response.body.message).toBe('Domain ownership verified. Please add the SSL validation records to complete setup.');
      expect(response.body.isFullyActive).toBe(false);
      expect(response.body.nextStep).toEqual(mockDomain.sslValidationRecords);
    });

    it('should return 404 for domain not found', async () => {
      vi.mocked(DomainService.verifyDomain).mockRejectedValue(new Error('Domain not found'));

      const response = await request(app)
        .post('/domains/999/verify')
        .expect(404);

      expect(response.body.error).toBe('Domain not found');
    });

    it('should return 400 for already active domain', async () => {
      vi.mocked(DomainService.verifyDomain).mockRejectedValue(
        new Error('Domain is already active')
      );

      const response = await request(app)
        .post('/domains/1/verify')
        .expect(400);

      expect(response.body.error).toBe('Domain is already active');
    });
  });

  describe('DELETE /domains/:id', () => {
    it('should delete domain successfully', async () => {
      vi.mocked(DomainService.deleteDomain).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/domains/1')
        .expect(200);

      expect(response.body.message).toBe('Domain deleted successfully');
      expect(DomainService.deleteDomain).toHaveBeenCalledWith(1, 1);
    });

    it('should return 404 for domain not found', async () => {
      vi.mocked(DomainService.deleteDomain).mockRejectedValue(new Error('Domain not found'));

      const response = await request(app)
        .delete('/domains/999')
        .expect(404);

      expect(response.body.error).toBe('Domain not found');
    });
  });

  describe('POST /domains/:domainId/funnels/:funnelId/link', () => {
    it('should link funnel to domain successfully', async () => {
      vi.mocked(DomainService.linkFunnelToDomain).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/domains/1/funnels/2/link')
        .expect(200);

      expect(response.body.message).toBe('Funnel linked to domain successfully');
      expect(DomainService.linkFunnelToDomain).toHaveBeenCalledWith(2, 1, 1);
    });

    it('should return 400 for invalid IDs', async () => {
      const response = await request(app)
        .post('/domains/invalid/funnels/invalid/link')
        .expect(400);

      expect(response.body.error).toBe('Invalid domain ID or funnel ID');
      expect(DomainService.linkFunnelToDomain).not.toHaveBeenCalled();
    });

    it('should return 400 for already linked funnel', async () => {
      vi.mocked(DomainService.linkFunnelToDomain).mockRejectedValue(
        new Error('Funnel is already linked to this domain')
      );

      const response = await request(app)
        .post('/domains/1/funnels/2/link')
        .expect(400);

      expect(response.body.error).toBe('Funnel is already linked to this domain');
    });
  });

  describe('GET /domains/public/:hostname/funnels/:funnelId', () => {
    it('should get public funnel successfully', async () => {
      const mockFunnel = {
        id: 1,
        name: 'Test Funnel',
        status: 'live',
        pages: [
          { id: 1, name: 'Page 1', order: 1 },
          { id: 2, name: 'Page 2', order: 2 }
        ]
      };

      vi.mocked(DomainService.getPublicFunnel).mockResolvedValue(mockFunnel);

      const response = await request(app)
        .get('/domains/public/example.com/funnels/1')
        .expect(200);

      expect(response.body.funnel).toEqual(mockFunnel);
      expect(response.body.message).toBe('Funnel data retrieved successfully');
      expect(DomainService.getPublicFunnel).toHaveBeenCalledWith('example.com', 1);
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/domains/public//funnels/')
        .expect(404); // Express returns 404 for missing route params

      expect(DomainService.getPublicFunnel).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent domain', async () => {
      vi.mocked(DomainService.getPublicFunnel).mockRejectedValue(
        new Error('Domain not found or not verified')
      );

      const response = await request(app)
        .get('/domains/public/nonexistent.com/funnels/1')
        .expect(404);

      expect(response.body.error).toBe('Domain not found or not verified');
    });

    it('should return 404 for non-live funnel', async () => {
      vi.mocked(DomainService.getPublicFunnel).mockRejectedValue(
        new Error('Funnel is not live')
      );

      const response = await request(app)
        .get('/domains/public/example.com/funnels/1')
        .expect(404);

      expect(response.body.error).toBe('Funnel is not live');
    });
  });
});