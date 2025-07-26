import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DomainService, setPrismaClient } from '../../services/domain.service';
import { CloudFlareAPIService } from '../../services/cloudflare/cloudflare-api.service';
import { cacheService } from '../../services/cache/cache.service';
import { TestHelpers, testPrisma } from '../helpers';
import { DomainType, DomainStatus, SslStatus } from '../../generated/prisma-client';

// Mock CloudFlare API service
const mockCloudFlareService = {
  isConfigured: vi.fn().mockReturnValue(true),
  createCustomHostname: vi.fn(),
  getCustomHostname: vi.fn(),
  getConfig: vi.fn(),
  createSubdomainRecord: vi.fn(),
  deleteCustomHostname: vi.fn(),
  deleteDNSRecord: vi.fn()
};

vi.mock('../../services/cloudflare/cloudflare-api.service', () => {
  return {
    CloudFlareAPIService: vi.fn().mockImplementation(() => mockCloudFlareService)
  };
});

vi.mock('../../services/cache/cache.service');

describe('DomainService', () => {
  let user: any;
  let mockCloudFlare: any;
  let mockCache: any;

  beforeEach(async () => {
    // Set test Prisma client for domain service
    setPrismaClient(testPrisma);

    // Clean up database
    await testPrisma.funnelDomain.deleteMany();
    await testPrisma.domain.deleteMany();
    await testPrisma.funnel.deleteMany();
    await testPrisma.user.deleteMany();

    // Create test user
    user = await TestHelpers.createTestUser();

    // Setup mocks
    mockCloudFlare = mockCloudFlareService;
    mockCache = vi.mocked(cacheService);

    // Reset all mock functions
    vi.clearAllMocks();
    
    // Reset default return values for each test
    mockCloudFlare.isConfigured.mockReturnValue(true);
  });

  describe('createCustomDomain', () => {
    it('should create custom domain successfully', async () => {
      const hostname = 'www.example.com';
      const mockHostname = TestHelpers.mockCloudFlareHostname('cf-123', hostname);
      
      mockCloudFlare.createCustomHostname.mockResolvedValue(mockHostname);
      mockCloudFlare.getCustomHostname.mockResolvedValue(mockHostname);
      mockCloudFlare.getConfig.mockReturnValue({
        apiToken: 'test',
        accountId: 'test',
        zoneId: 'zone-123',
        saasTarget: 'fallback.digitalsite.ai',
        platformMainDomain: 'digitalsite.ai'
      });

      const result = await DomainService.createCustomDomain(user.id, {
        hostname,
        type: DomainType.CUSTOM_DOMAIN
      });

      expect(result.hostname).toBe(hostname);
      expect(result.type).toBe(DomainType.CUSTOM_DOMAIN);
      expect(result.status).toBe(DomainStatus.PENDING);
      expect(result.cloudflareHostnameId).toBe('cf-123');
      expect(mockCache.invalidateUserCache).toHaveBeenCalledWith(user.id);
    });

    it('should throw error for domain without subdomain', async () => {
      await expect(
        DomainService.createCustomDomain(user.id, {
          hostname: 'example.com',
          type: DomainType.CUSTOM_DOMAIN
        })
      ).rejects.toThrow('Please provide a subdomain');
    });

    it('should throw error for existing domain', async () => {
      const hostname = 'www.example.com';
      
      // Create domain first
      await testPrisma.domain.create({
        data: {
          hostname,
          type: DomainType.CUSTOM_DOMAIN,
          status: DomainStatus.PENDING,
          userId: user.id
        }
      });

      await expect(
        DomainService.createCustomDomain(user.id, {
          hostname,
          type: DomainType.CUSTOM_DOMAIN
        })
      ).rejects.toThrow('This domain name is already registered');
    });

    it('should handle CloudFlare API errors', async () => {
      const hostname = 'www.example.com';
      
      mockCloudFlare.createCustomHostname.mockRejectedValue(new Error('CloudFlare API error'));

      await expect(
        DomainService.createCustomDomain(user.id, {
          hostname,
          type: DomainType.CUSTOM_DOMAIN
        })
      ).rejects.toThrow('Failed to create custom domain');
    });

    it('should throw error when CloudFlare is not configured', async () => {
      const hostname = 'www.example.com';
      
      // Mock CloudFlare as not configured
      mockCloudFlare.isConfigured.mockReturnValue(false);

      await expect(
        DomainService.createCustomDomain(user.id, {
          hostname,
          type: DomainType.CUSTOM_DOMAIN
        })
      ).rejects.toThrow('CloudFlare is not configured for custom domain creation');
    });
  });

  describe('createSubdomain', () => {
    it('should create subdomain successfully', async () => {
      const subdomain = 'mystore';
      const mockRecord = TestHelpers.mockCloudFlareDNSRecord('record-123', subdomain);
      
      mockCloudFlare.createSubdomainRecord.mockResolvedValue(mockRecord);
      mockCloudFlare.getConfig.mockReturnValue({
        apiToken: 'test',
        accountId: 'test',
        zoneId: 'zone-123',
        saasTarget: 'fallback.digitalsite.ai',
        platformMainDomain: 'digitalsite.ai'
      });

      const result = await DomainService.createSubdomain(user.id, { subdomain });

      expect(result.hostname).toBe('mystore.digitalsite.ai');
      expect(result.type).toBe(DomainType.SUBDOMAIN);
      expect(result.status).toBe(DomainStatus.ACTIVE);
      expect(result.cloudflareRecordId).toBe('record-123');
      expect(mockCache.invalidateUserCache).toHaveBeenCalledWith(user.id);
    });

    it('should throw error for existing subdomain', async () => {
      const subdomain = 'mystore';
      const hostname = `${subdomain}.digitalsite.ai`;
      
      // Mock config
      mockCloudFlare.getConfig.mockReturnValue({
        platformMainDomain: 'digitalsite.ai'
      });

      // Create subdomain first
      await testPrisma.domain.create({
        data: {
          hostname,
          type: DomainType.SUBDOMAIN,
          status: DomainStatus.ACTIVE,
          userId: user.id
        }
      });

      await expect(
        DomainService.createSubdomain(user.id, { subdomain })
      ).rejects.toThrow('This subdomain is already taken');
    });

    it('should handle invalid subdomain names', async () => {
      await expect(
        DomainService.createSubdomain(user.id, { subdomain: 'www' })
      ).rejects.toThrow('reserved subdomain name');
    });

    it('should throw error when CloudFlare is not configured for subdomains', async () => {
      // Mock CloudFlare as not configured
      mockCloudFlare.isConfigured.mockReturnValue(false);

      await expect(
        DomainService.createSubdomain(user.id, { subdomain: 'mystore' })
      ).rejects.toThrow('CloudFlare is not configured for subdomain creation');
    });
  });

  describe('getUserDomains', () => {
    it('should get user domains with caching', async () => {
      const domain = await TestHelpers.createTestDomain(user.id);
      
      // Mock cache miss first
      mockCache.memoize.mockImplementation(async (key: string, fn: () => any) => fn());

      const result = await DomainService.getUserDomains(user.id);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(domain.id);
      expect(mockCache.memoize).toHaveBeenCalledWith(
        'domains',
        expect.any(Function),
        { prefix: `user:${user.id}`, ttl: 300 }
      );
    });
  });

  describe('verifyDomain', () => {
    it('should verify domain and update status', async () => {
      const domain = await TestHelpers.createTestDomain(user.id, {
        cloudflareHostnameId: 'cf-123'
      });

      const mockHostname = TestHelpers.mockCloudFlareHostname('cf-123');
      mockCloudFlare.getCustomHostname.mockResolvedValue(mockHostname);

      const result = await DomainService.verifyDomain(domain.id, user.id);

      expect(result.status).toBe(DomainStatus.ACTIVE);
      expect(result.sslStatus).toBe(SslStatus.ACTIVE);
      expect(result.lastVerifiedAt).toBeTruthy();
    });

    it('should return cached status when CloudFlare is not configured', async () => {
      const domain = await TestHelpers.createTestDomain(user.id, {
        cloudflareHostnameId: 'cf-123',
        status: DomainStatus.PENDING
      });

      // Mock CloudFlare as not configured
      mockCloudFlare.isConfigured.mockReturnValue(false);

      const result = await DomainService.verifyDomain(domain.id, user.id);

      // Should return the domain without making CloudFlare calls
      expect(result.status).toBe(DomainStatus.PENDING);
      expect(mockCloudFlare.getCustomHostname).not.toHaveBeenCalled();
    });

    it('should throw error for domain not found', async () => {
      await expect(
        DomainService.verifyDomain(999, user.id)
      ).rejects.toThrow('Domain not found');
    });

    it('should throw error for already active domain', async () => {
      const domain = await TestHelpers.createTestDomain(user.id, {
        status: DomainStatus.ACTIVE
      });

      await expect(
        DomainService.verifyDomain(domain.id, user.id)
      ).rejects.toThrow('Domain is already active');
    });

    it('should throw error for domain without CloudFlare hostname ID', async () => {
      const domain = await TestHelpers.createTestDomain(user.id, {
        cloudflareHostnameId: null
      });

      await expect(
        DomainService.verifyDomain(domain.id, user.id)
      ).rejects.toThrow('Domain is not configured correctly');
    });
  });

  describe('deleteDomain', () => {
    it('should delete custom domain and CloudFlare resources', async () => {
      const domain = await TestHelpers.createTestDomain(user.id, {
        cloudflareHostnameId: 'cf-123'
      });

      mockCloudFlare.deleteCustomHostname.mockResolvedValue(undefined);

      await DomainService.deleteDomain(domain.id, user.id);

      // Verify domain is deleted from database
      const deletedDomain = await testPrisma.domain.findUnique({
        where: { id: domain.id }
      });
      expect(deletedDomain).toBeNull();

      // Verify CloudFlare cleanup was called
      expect(mockCloudFlare.deleteCustomHostname).toHaveBeenCalledWith('cf-123');
    });

    it('should delete subdomain and DNS record', async () => {
      const domain = await TestHelpers.createTestDomain(user.id, {
        type: DomainType.SUBDOMAIN,
        cloudflareRecordId: 'record-123',
        cloudflareZoneId: 'zone-123'
      });

      mockCloudFlare.deleteDNSRecord.mockResolvedValue(undefined);

      await DomainService.deleteDomain(domain.id, user.id);

      expect(mockCloudFlare.deleteDNSRecord).toHaveBeenCalledWith('zone-123', 'record-123');
    });

    it('should continue deletion even if CloudFlare cleanup fails', async () => {
      const domain = await TestHelpers.createTestDomain(user.id, {
        cloudflareHostnameId: 'cf-123'
      });

      mockCloudFlare.deleteCustomHostname.mockRejectedValue(new Error('CloudFlare error'));

      // Should not throw error
      await DomainService.deleteDomain(domain.id, user.id);

      // Verify domain is still deleted from database
      const deletedDomain = await testPrisma.domain.findUnique({
        where: { id: domain.id }
      });
      expect(deletedDomain).toBeNull();
    });

    it('should skip CloudFlare cleanup when not configured', async () => {
      const domain = await TestHelpers.createTestDomain(user.id, {
        cloudflareHostnameId: 'cf-123'
      });

      // Mock CloudFlare as not configured
      mockCloudFlare.isConfigured.mockReturnValue(false);

      await DomainService.deleteDomain(domain.id, user.id);

      // Should not call CloudFlare cleanup methods
      expect(mockCloudFlare.deleteCustomHostname).not.toHaveBeenCalled();

      // Domain should still be deleted
      const deletedDomain = await testPrisma.domain.findUnique({
        where: { id: domain.id }
      });
      expect(deletedDomain).toBeNull();
    });

    it('should throw error for domain not found', async () => {
      await expect(
        DomainService.deleteDomain(999, user.id)
      ).rejects.toThrow('Domain not found');
    });
  });

  describe('linkFunnelToDomain', () => {
    it('should link funnel to domain successfully', async () => {
      const funnel = await TestHelpers.createTestFunnel(user.id);
      const domain = await TestHelpers.createTestDomain(user.id);

      await DomainService.linkFunnelToDomain(funnel.id, domain.id, user.id);

      // Verify connection exists
      const connection = await testPrisma.funnelDomain.findUnique({
        where: {
          funnelId_domainId: {
            funnelId: funnel.id,
            domainId: domain.id
          }
        }
      });
      expect(connection).toBeTruthy();
      expect(connection!.isActive).toBe(true);
    });

    it('should throw error for non-existent funnel', async () => {
      const domain = await TestHelpers.createTestDomain(user.id);

      await expect(
        DomainService.linkFunnelToDomain(999, domain.id, user.id)
      ).rejects.toThrow('Funnel not found');
    });

    it('should throw error for already linked funnel', async () => {
      const funnel = await TestHelpers.createTestFunnel(user.id);
      const domain = await TestHelpers.createTestDomain(user.id);

      // Link first time
      await DomainService.linkFunnelToDomain(funnel.id, domain.id, user.id);

      // Try to link again
      await expect(
        DomainService.linkFunnelToDomain(funnel.id, domain.id, user.id)
      ).rejects.toThrow('Funnel is already linked to this domain');
    });
  });

  describe('getPublicFunnel', () => {
    it('should get public funnel for active domain', async () => {
      const funnel = await TestHelpers.createTestFunnel(user.id, { status: 'live' });
      const domain = await TestHelpers.createTestDomain(user.id, {
        hostname: 'example.com',
        status: DomainStatus.ACTIVE
      });

      // Create pages
      await testPrisma.page.createMany({
        data: [
          { name: 'Page 1', order: 1, funnelId: funnel.id },
          { name: 'Page 2', order: 2, funnelId: funnel.id }
        ]
      });

      // Link funnel to domain
      await testPrisma.funnelDomain.create({
        data: {
          funnelId: funnel.id,
          domainId: domain.id,
          isActive: true
        }
      });

      const result = await DomainService.getPublicFunnel('example.com', funnel.id);

      expect(result.id).toBe(funnel.id);
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].order).toBe(1);
      expect(result.pages[1].order).toBe(2);
    });

    it('should throw error for non-existent domain', async () => {
      await expect(
        DomainService.getPublicFunnel('nonexistent.com', 123)
      ).rejects.toThrow('Domain not found or not verified');
    });

    it('should throw error for non-live funnel', async () => {
      const funnel = await TestHelpers.createTestFunnel(user.id, { status: 'draft' });
      const domain = await TestHelpers.createTestDomain(user.id, {
        hostname: 'example.com',
        status: DomainStatus.ACTIVE
      });

      await testPrisma.funnelDomain.create({
        data: {
          funnelId: funnel.id,
          domainId: domain.id,
          isActive: true
        }
      });

      await expect(
        DomainService.getPublicFunnel('example.com', funnel.id)
      ).rejects.toThrow('Funnel is not live');
    });
  });
});