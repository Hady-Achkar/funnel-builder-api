import { describe, it, expect, beforeEach } from 'vitest';
import { FunnelService, setPrismaClient } from '../../services/funnel.service';
import { TestHelpers, testPrisma } from '../helpers';

describe('FunnelService', () => {
  let testUserId: number;

  beforeEach(async () => {
    // Set test Prisma client for funnel service
    setPrismaClient(testPrisma);
    
    // Clean up before each test
    await testPrisma.page.deleteMany();
    await testPrisma.funnel.deleteMany();
    await testPrisma.user.deleteMany();

    // Create a test user
    const testUser = await testPrisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword'
      }
    });
    testUserId = testUser.id;
  });

  describe('createFunnel', () => {
    it('should create a funnel successfully', async () => {
      const funnelData = {
        name: 'Test Funnel',
        status: 'draft'
      };

      const result = await FunnelService.createFunnel(testUserId, funnelData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(funnelData.name);
      expect(result.status).toBe(funnelData.status);
      expect(result.userId).toBe(testUserId);
      expect(result.pages).toEqual([]);
    });

    it('should create a funnel with default status', async () => {
      const funnelData = {
        name: 'Test Funnel'
      };

      const result = await FunnelService.createFunnel(testUserId, funnelData);

      expect(result.status).toBe('draft');
    });
  });

  describe('duplicateFunnel', () => {
    it('should duplicate a funnel successfully', async () => {
      // Create original funnel with pages
      const originalFunnel = await testPrisma.funnel.create({
        data: {
          name: 'Original Funnel',
          status: 'live',
          userId: testUserId,
          pages: {
            create: [
              {
                name: 'Landing Page',
                content: '<h1>Welcome</h1>',
                order: 1,
                linkingId: 'landing'
              },
              {
                name: 'Thank You Page',
                content: '<h1>Thanks!</h1>',
                order: 2,
                linkingId: 'thankyou'
              }
            ]
          }
        },
        include: {
          pages: {
            orderBy: { order: 'asc' }
          }
        }
      });

      const duplicatedFunnel = await FunnelService.duplicateFunnel(originalFunnel.id, testUserId);

      // Check funnel properties
      expect(duplicatedFunnel).toHaveProperty('id');
      expect(duplicatedFunnel.id).not.toBe(originalFunnel.id);
      expect(duplicatedFunnel.name).toBe('Original Funnel (Copy)');
      expect(duplicatedFunnel.status).toBe(originalFunnel.status);
      expect(duplicatedFunnel.userId).toBe(testUserId);

      // Check pages were duplicated
      expect(duplicatedFunnel.pages).toHaveLength(2);
      
      const page1 = duplicatedFunnel.pages.find(p => p.order === 1);
      const page2 = duplicatedFunnel.pages.find(p => p.order === 2);
      
      expect(page1).toBeTruthy();
      expect(page1!.name).toBe('Landing Page');
      expect(page1!.content).toBe('<h1>Welcome</h1>');
      expect(page1!.linkingId).toBe('landing');
      expect(page1!.id).not.toBe(originalFunnel.pages[0].id);

      expect(page2).toBeTruthy();
      expect(page2!.name).toBe('Thank You Page');
      expect(page2!.content).toBe('<h1>Thanks!</h1>');
      expect(page2!.linkingId).toBe('thankyou');
      expect(page2!.id).not.toBe(originalFunnel.pages[1].id);
    });

    it('should duplicate a funnel without pages', async () => {
      // Create original funnel without pages
      const originalFunnel = await testPrisma.funnel.create({
        data: {
          name: 'Empty Funnel',
          status: 'draft',
          userId: testUserId
        }
      });

      const duplicatedFunnel = await FunnelService.duplicateFunnel(originalFunnel.id, testUserId);

      expect(duplicatedFunnel.name).toBe('Empty Funnel (Copy)');
      expect(duplicatedFunnel.status).toBe('draft');
      expect(duplicatedFunnel.pages).toHaveLength(0);
    });

    it('should throw error when funnel not found', async () => {
      await expect(
        FunnelService.duplicateFunnel(99999, testUserId)
      ).rejects.toThrow('Funnel not found');
    });

    it('should throw error when user does not own the funnel', async () => {
      // Create another user
      const otherUser = await testPrisma.user.create({
        data: {
          email: 'other@example.com',
          name: 'Other User',
          password: 'hashedpassword'
        }
      });

      // Create funnel owned by testUserId
      const funnel = await testPrisma.funnel.create({
        data: {
          name: 'Test Funnel',
          status: 'draft',
          userId: testUserId
        }
      });

      // Try to duplicate with different user
      await expect(
        FunnelService.duplicateFunnel(funnel.id, otherUser.id)
      ).rejects.toThrow('Funnel not found');
    });

    it('should handle funnels with null content pages', async () => {
      const originalFunnel = await testPrisma.funnel.create({
        data: {
          name: 'Funnel with Null Content',
          status: 'draft',
          userId: testUserId,
          pages: {
            create: [
              {
                name: 'Page with Null Content',
                content: null,
                order: 1,
                linkingId: null
              }
            ]
          }
        },
        include: {
          pages: true
        }
      });

      const duplicatedFunnel = await FunnelService.duplicateFunnel(originalFunnel.id, testUserId);

      expect(duplicatedFunnel.pages).toHaveLength(1);
      expect(duplicatedFunnel.pages[0].content).toBeNull();
      expect(duplicatedFunnel.pages[0].linkingId).toBeNull();
    });
  });

  describe('getUserFunnels', () => {
    it('should return user funnels ordered by creation date', async () => {
      // Create multiple funnels
      const funnel1 = await testPrisma.funnel.create({
        data: {
          name: 'First Funnel',
          status: 'draft',
          userId: testUserId
        }
      });

      const funnel2 = await testPrisma.funnel.create({
        data: {
          name: 'Second Funnel',
          status: 'live',
          userId: testUserId
        }
      });

      const funnels = await FunnelService.getUserFunnels(testUserId);

      expect(funnels).toHaveLength(2);
      // Should be ordered by createdAt desc (newest first)
      expect(funnels[0].id).toBe(funnel2.id);
      expect(funnels[1].id).toBe(funnel1.id);
    });
  });

  describe('getFunnelById', () => {
    it('should return funnel when user owns it', async () => {
      const funnel = await testPrisma.funnel.create({
        data: {
          name: 'Test Funnel',
          status: 'draft',
          userId: testUserId
        }
      });

      const result = await FunnelService.getFunnelById(funnel.id, testUserId);

      expect(result).toBeTruthy();
      expect(result!.id).toBe(funnel.id);
      expect(result!.name).toBe('Test Funnel');
    });

    it('should return null when user does not own funnel', async () => {
      const otherUser = await testPrisma.user.create({
        data: {
          email: 'other@example.com',
          name: 'Other User',
          password: 'hashedpassword'
        }
      });

      const funnel = await testPrisma.funnel.create({
        data: {
          name: 'Test Funnel',
          status: 'draft',
          userId: otherUser.id
        }
      });

      const result = await FunnelService.getFunnelById(funnel.id, testUserId);

      expect(result).toBeNull();
    });
  });

  describe('updateFunnel', () => {
    it('should update funnel successfully', async () => {
      const funnel = await testPrisma.funnel.create({
        data: {
          name: 'Original Name',
          status: 'draft',
          userId: testUserId
        }
      });

      const updateData = {
        name: 'Updated Name',
        status: 'live'
      };

      const result = await FunnelService.updateFunnel(funnel.id, testUserId, updateData);

      expect(result.name).toBe('Updated Name');
      expect(result.status).toBe('live');
    });
  });

  describe('deleteFunnel', () => {
    it('should delete funnel successfully', async () => {
      const funnel = await testPrisma.funnel.create({
        data: {
          name: 'Test Funnel',
          status: 'draft',
          userId: testUserId
        }
      });

      await FunnelService.deleteFunnel(funnel.id, testUserId);

      const deletedFunnel = await testPrisma.funnel.findUnique({
        where: { id: funnel.id }
      });

      expect(deletedFunnel).toBeNull();
    });
  });
});