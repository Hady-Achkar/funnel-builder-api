import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createServer } from '../../app';
import { TestHelpers, testPrisma } from '../helpers';
import { redisService } from '../../services/cache/redis.service';
import { setPrismaClient as setAuthPrisma } from '../../services/auth.service';
import { setPrismaClient as setUserPrisma } from '../../services/user.service';
import { setPrismaClient as setFunnelPrisma } from '../../services/funnel.service';
import { setPrismaClient as setPagePrisma } from '../../services/page.service';
import { setPrismaClient as setDomainPrisma } from '../../services/domain.service';

// Mock CloudFlare API service for integration tests
vi.mock('../../services/cloudflare/cloudflare-api.service', () => ({
  CloudFlareAPIService: vi.fn().mockImplementation(() => ({
    isConfigured: vi.fn().mockReturnValue(true),
    createCustomHostname: vi.fn().mockResolvedValue({
      id: 'cf-hostname-123',
      hostname: 'test.example.com',
      status: 'active',
      ownership_verification: {
        type: 'txt',
        name: '_cf-custom-hostname.test.example.com',
        value: 'test-verification-value'
      },
      ssl: {
        status: 'active',
        validation_records: []
      }
    }),
    getCustomHostname: vi.fn().mockResolvedValue({
      id: 'cf-hostname-123',
      hostname: 'test.example.com',
      status: 'active',
      ssl: {
        status: 'active',
        validation_records: []
      }
    }),
    createDNSRecord: vi.fn().mockResolvedValue({
      id: 'dns-record-123',
      type: 'A',
      name: 'test',
      content: '1.2.3.4'
    }),
    createSubdomainRecord: vi.fn().mockResolvedValue({
      id: 'dns-record-123',
      type: 'A',
      name: 'test',
      content: '1.2.3.4'
    }),
    deleteDNSRecord: vi.fn().mockResolvedValue(undefined),
    deleteCustomHostname: vi.fn().mockResolvedValue(undefined),
    getConfig: vi.fn().mockReturnValue({
      apiToken: 'test-token',
      accountId: 'test-account',
      zoneId: 'test-zone',
      saasTarget: 'fallback.digitalsite.ai',
      platformMainDomain: 'digitalsite.ai'
    })
  }))
}));

describe('API Integration Tests', () => {
  let app: any;
  let user: any;
  let authToken: string;

  beforeAll(async () => {
    app = createServer();
    
    // Connect to Redis for integration tests
    try {
      await redisService.connect();
    } catch (error) {
      console.warn('Redis not available for integration tests');
    }
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
    
    try {
      await redisService.disconnect();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Set test Prisma client for all services
    setAuthPrisma(testPrisma);
    setUserPrisma(testPrisma);
    setFunnelPrisma(testPrisma);
    setPagePrisma(testPrisma);
    setDomainPrisma(testPrisma);

    // Clean up database
    await testPrisma.funnelDomain.deleteMany();
    await testPrisma.page.deleteMany();
    await testPrisma.domain.deleteMany();
    await testPrisma.funnel.deleteMany();
    await testPrisma.user.deleteMany();

    // Clean up Redis
    try {
      await redisService.flush();
    } catch (error) {
      // Ignore if Redis is not available
    }

    // Create test user and get auth token
    user = await TestHelpers.createTestUser();
    authToken = TestHelpers.generateJWTToken(user.id);
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'password123'
        })
        .expect(201);

      expect(registerResponse.body.message).toBe('User created successfully');
      expect(registerResponse.body.token).toBeTruthy();
      expect(registerResponse.body.user.email).toBe('newuser@example.com');

      // Login with same credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.message).toBe('Login successful');
      expect(loginResponse.body.token).toBeTruthy();
      expect(loginResponse.body.user.email).toBe('newuser@example.com');

      // Access protected route
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(profileResponse.body.user.email).toBe('newuser@example.com');
    });

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should reject access without token', async () => {
      await request(app)
        .get('/api/users/profile')
        .expect(401);
    });
  });

  describe('Domain Management Flow', () => {
    it('should complete domain creation and management flow', async () => {
      // Create subdomain
      const subdomainResponse = await request(app)
        .post('/api/domains/subdomain')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subdomain: 'teststore' })
        .expect(201);

      expect(subdomainResponse.body.message).toContain('created and activated');
      const domainId = subdomainResponse.body.domain.id;

      // Get user domains
      const domainsResponse = await request(app)
        .get('/api/domains')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(domainsResponse.body.domains).toHaveLength(1);
      expect(domainsResponse.body.domains[0].id).toBe(domainId);

      // Get specific domain
      const domainResponse = await request(app)
        .get(`/api/domains/${domainId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(domainResponse.body.domain.id).toBe(domainId);

      // Delete domain
      await request(app)
        .delete(`/api/domains/${domainId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify domain is deleted
      await request(app)
        .get(`/api/domains/${domainId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle domain validation errors', async () => {
      // Try to create subdomain with reserved name
      await request(app)
        .post('/api/domains/subdomain')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subdomain: 'www' })
        .expect(400);

      // Try to create custom domain without subdomain
      await request(app)
        .post('/api/domains/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ hostname: 'example.com' })
        .expect(400);
    });
  });

  describe('Funnel and Domain Linking Flow', () => {
    it('should complete funnel-domain linking flow', async () => {
      // Create funnel
      const funnelResponse = await request(app)
        .post('/api/funnels')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Funnel', status: 'live' })
        .expect(201);

      const funnelId = funnelResponse.body.funnel.id;

      // Create domain
      const domainResponse = await request(app)
        .post('/api/domains/subdomain')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subdomain: 'testfunnel' })
        .expect(201);

      const domainId = domainResponse.body.domain.id;

      // Link funnel to domain
      await request(app)
        .post(`/api/domains/${domainId}/funnels/${funnelId}/link`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify link exists by getting domain
      const linkedDomainResponse = await request(app)
        .get(`/api/domains/${domainId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(linkedDomainResponse.body.domain.funnelConnections).toHaveLength(1);
      expect(linkedDomainResponse.body.domain.funnelConnections[0].funnelId).toBe(funnelId);

      // Try to link same funnel again (should fail)
      await request(app)
        .post(`/api/domains/${domainId}/funnels/${funnelId}/link`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Unlink funnel from domain
      await request(app)
        .delete(`/api/domains/${domainId}/funnels/${funnelId}/link`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify link is removed
      const unlinkedDomainResponse = await request(app)
        .get(`/api/domains/${domainId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unlinkedDomainResponse.body.domain.funnelConnections).toHaveLength(0);
    });
  });

  describe('Public Funnel Access Flow', () => {
    it('should allow public access to live funnels', async () => {
      // Create funnel with pages
      const funnelResponse = await request(app)
        .post('/api/funnels')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Public Funnel', status: 'live' })
        .expect(201);

      const funnelId = funnelResponse.body.funnel.id;

      // Create pages
      await request(app)
        .post(`/api/pages/funnels/${funnelId}/pages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Landing Page', order: 1, content: 'Welcome!' })
        .expect(201);

      await request(app)
        .post(`/api/pages/funnels/${funnelId}/pages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Thank You Page', order: 2, content: 'Thanks!' })
        .expect(201);

      // Create domain and link
      const domainResponse = await request(app)
        .post('/api/domains/subdomain')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subdomain: 'publicfunnel' })
        .expect(201);

      const domain = domainResponse.body.domain;
      
      // Update domain status to ACTIVE in database (simulating successful verification)
      await testPrisma.domain.update({
        where: { id: domain.id },
        data: { status: 'ACTIVE' }
      });

      await request(app)
        .post(`/api/domains/${domain.id}/funnels/${funnelId}/link`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Access public funnel (no auth required)
      const publicResponse = await request(app)
        .get(`/api/domains/public/${domain.hostname}/funnels/${funnelId}`)
        .expect(200);

      expect(publicResponse.body.funnel.id).toBe(funnelId);
      expect(publicResponse.body.funnel.pages).toHaveLength(2);
      expect(publicResponse.body.funnel.pages[0].order).toBe(1);
      expect(publicResponse.body.funnel.pages[1].order).toBe(2);
    });

    it('should deny access to non-live funnels', async () => {
      // Create draft funnel
      const funnelResponse = await request(app)
        .post('/api/funnels')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Draft Funnel', status: 'draft' })
        .expect(201);

      const funnelId = funnelResponse.body.funnel.id;

      // Create domain and link
      const domainResponse = await request(app)
        .post('/api/domains/subdomain')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subdomain: 'draftfunnel' })
        .expect(201);

      const domain = domainResponse.body.domain;

      await testPrisma.domain.update({
        where: { id: domain.id },
        data: { status: 'ACTIVE' }
      });

      await request(app)
        .post(`/api/domains/${domain.id}/funnels/${funnelId}/link`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to access draft funnel publicly (should fail)
      await request(app)
        .get(`/api/domains/public/${domain.hostname}/funnels/${funnelId}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in requests', async () => {
      await request(app)
        .post('/api/auth/register')
        .send('invalid json')
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' }) // missing password
        .expect(400);
    });

    it('should handle non-existent resources', async () => {
      await request(app)
        .get('/api/domains/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await request(app)
        .get('/api/funnels/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle unauthorized access attempts', async () => {
      const otherUser = await TestHelpers.createTestUser();
      const otherUserToken = TestHelpers.generateJWTToken(otherUser.id);

      // Create domain as first user
      const domainResponse = await request(app)
        .post('/api/domains/subdomain')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subdomain: 'mystore' })
        .expect(201);

      const domainId = domainResponse.body.domain.id;

      // Try to access as other user (should fail)
      await request(app)
        .get(`/api/domains/${domainId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);

      // Try to delete as other user (should fail)
      await request(app)
        .delete(`/api/domains/${domainId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);
    });
  });
});