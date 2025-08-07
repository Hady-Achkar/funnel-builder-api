import { describe, it, expect, vi } from 'vitest';
import { getPageByLinkingId } from '../../../controllers/page';
import { setupPageControllerTest } from './test-setup';
import { PageService } from '../../../services/page';

// Mock the PageService
vi.mock('../../../services/page', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../services/page')>();
  return {
    ...actual,
    PageService: {
      ...actual.PageService,
      getPageByLinkingId: vi.fn()
    }
  };
});

describe('getPageByLinkingId Controller', () => {
  const { getMockReq, getMockRes, setMockReq } = setupPageControllerTest();

  describe('getPageByLinkingId', () => {
    it('should return page data with funnelId for valid public pages', async () => {
      const mockPageData = {
        id: 1,
        name: 'Public Test Page',
        content: '<h1>Public Content</h1>',
        linkingId: 'public-test-id',
        funnelId: 1,
        funnelName: 'Test Funnel',
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null
      };

      vi.mocked(PageService.getPageByLinkingId).mockResolvedValue(mockPageData);

      setMockReq({
        params: { funnelId: '1', linkingId: 'public-test-id' }
      });

      await getPageByLinkingId(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(200);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: true,
        data: mockPageData
      });
    });

    it('should return 400 for invalid funnel ID', async () => {
      setMockReq({
        params: { funnelId: 'invalid', linkingId: 'test-id' }
      });

      await getPageByLinkingId(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(400);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: 'Please provide a valid funnel ID'
      });
    });

    it('should return 400 for missing linking ID', async () => {
      setMockReq({
        params: { funnelId: '1' } // Missing linkingId
      });

      await getPageByLinkingId(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(400);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: 'Please provide a valid linking ID'
      });
    });

    it('should return 404 for non-existent pages', async () => {
      vi.mocked(PageService.getPageByLinkingId).mockResolvedValue(null);

      setMockReq({
        params: { funnelId: '1', linkingId: 'non-existent-id' }
      });

      await getPageByLinkingId(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(404);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: 'Page not found or not publicly accessible'
      });
    });

    it('should handle service errors', async () => {
      vi.mocked(PageService.getPageByLinkingId).mockRejectedValue(new Error('Database error'));

      setMockReq({
        params: { funnelId: '1', linkingId: 'test-id' }
      });

      await getPageByLinkingId(getMockReq(), getMockRes());

      expect(getMockRes().status).toHaveBeenCalledWith(500);
      expect(getMockRes().json).toHaveBeenCalledWith({
        success: false,
        error: 'An unexpected error occurred'
      });
    });
  });
});