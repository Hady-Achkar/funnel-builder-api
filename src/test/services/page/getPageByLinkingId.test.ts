import { describe, it, expect, vi } from 'vitest';
import { PageService } from '../../../services/page';
import { 
  mockPrisma, 
  createMockFunnel, 
  createMockPage, 
  setupPageServiceTest,
  mockCacheService
} from './test-setup';

describe('getPageByLinkingId Service', () => {
  setupPageServiceTest();

  describe('getPageByLinkingId', () => {
    it('should return page data with funnelId for public pages', async () => {
      const mockFunnel = createMockFunnel({ id: 1, name: 'Test Funnel', status: 'LIVE' });
      const mockPage = createMockPage({
        id: 1,
        name: 'Test Public Page',
        content: '<h1>Test Content</h1>',
        linkingId: 'test-linking-id',
        funnelId: 1
      });

      mockPrisma.page.findUnique = vi.fn().mockResolvedValue({
        ...mockPage,
        funnel: mockFunnel
      });
      mockCacheService.get.mockResolvedValue(null); // No cache initially

      const result = await PageService.getPageByLinkingId(1, 'test-linking-id');

      expect(result).toBeTruthy();
      expect(result).toMatchObject({
        id: 1,
        name: 'Test Public Page',
        content: '<h1>Test Content</h1>',
        linkingId: 'test-linking-id',
        funnelId: 1, // This is the key addition we're testing
        funnelName: 'Test Funnel',
      });
    });

    it('should return null for pages in non-live funnels', async () => {
      const draftFunnel = createMockFunnel({ status: 'DRAFT' });
      const mockPage = createMockPage({ linkingId: 'draft-linking-id' });

      mockPrisma.page.findUnique = vi.fn().mockResolvedValue({
        ...mockPage,
        funnel: draftFunnel
      });

      const result = await PageService.getPageByLinkingId(1, 'draft-linking-id');

      expect(result).toBeNull();
    });

    it('should return null for non-existent pages', async () => {
      mockPrisma.page.findUnique = vi.fn().mockResolvedValue(null);

      const result = await PageService.getPageByLinkingId(1, 'non-existent-id');

      expect(result).toBeNull();
    });

    it('should return cached data with funnelId on subsequent calls', async () => {
      const mockFunnel = createMockFunnel({ id: 1, name: 'Test Funnel', status: 'LIVE' });
      const mockPage = createMockPage({
        id: 1,
        name: 'Cached Page',
        content: '<h1>Cached</h1>',
        linkingId: 'cached-id',
        funnelId: 1
      });

      const cachedPageData = {
        id: 1,
        name: 'Cached Page',
        content: '<h1>Cached</h1>',
        linkingId: 'cached-id',
        funnelId: 1,
        funnelName: 'Test Funnel',
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null
      };

      // Setup prisma mock for both calls
      mockPrisma.page.findUnique = vi.fn()
        .mockResolvedValueOnce({ ...mockPage, funnel: mockFunnel }) // First call
        .mockResolvedValueOnce({ ...mockPage, funnel: mockFunnel }); // Second call

      // First call has no cache, second call has cache
      mockCacheService.get
        .mockResolvedValueOnce(null) // First call - no cache
        .mockResolvedValueOnce(cachedPageData); // Second call - has cache

      // First call - should populate cache
      const firstResult = await PageService.getPageByLinkingId(1, 'cached-id');
      
      // Second call - should return cached data
      const secondResult = await PageService.getPageByLinkingId(1, 'cached-id');

      expect(firstResult?.funnelId).toBe(1);
      expect(secondResult).toEqual(cachedPageData);
      expect(secondResult?.funnelId).toBe(1);
    });
  });
});