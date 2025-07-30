import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { FunnelController } from '../../controllers/funnel.controller';
import { FunnelService } from '../../services/funnel.service';
import { authenticateToken } from '../../middleware/auth';

// Mock FunnelService
vi.mock('../../services/funnel.service');

// Mock authentication middleware
vi.mock('../../middleware/auth', () => ({
  authenticateToken: vi.fn((req, res, next) => {
    req.userId = 1; // Mock authenticated user
    next();
  })
}));

const app = express();
app.use(express.json());
app.use(authenticateToken);

// Setup routes
app.post('/funnels', FunnelController.createFunnel);
app.get('/funnels', FunnelController.getUserFunnels);
app.get('/funnels/:id', FunnelController.getFunnelById);
app.put('/funnels/:id', FunnelController.updateFunnel);
app.delete('/funnels/:id', FunnelController.deleteFunnel);
app.post('/funnels/:id/duplicate', FunnelController.duplicateFunnel);

describe('FunnelController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /funnels/:id/duplicate', () => {
    it('should duplicate funnel successfully', async () => {
      const mockDuplicatedFunnel = {
        id: 2,
        name: 'Test Funnel (Copy)',
        status: 'draft',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        pages: [
          {
            id: 3,
            name: 'Landing Page',
            content: '<h1>Welcome</h1>',
            order: 1,
            linkingId: 'landing',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      vi.mocked(FunnelService.duplicateFunnel).mockResolvedValue(mockDuplicatedFunnel);

      const response = await request(app)
        .post('/funnels/1/duplicate')
        .expect(201);

      expect(response.body).toEqual({ funnel: mockDuplicatedFunnel });
      expect(FunnelService.duplicateFunnel).toHaveBeenCalledWith(1, 1);
    });

    it('should return 400 for invalid funnel ID', async () => {
      const response = await request(app)
        .post('/funnels/invalid/duplicate')
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid funnel ID' });
      expect(FunnelService.duplicateFunnel).not.toHaveBeenCalled();
    });

    it('should return 404 when funnel not found', async () => {
      vi.mocked(FunnelService.duplicateFunnel).mockRejectedValue(new Error('Funnel not found'));

      const response = await request(app)
        .post('/funnels/999/duplicate')
        .expect(404);

      expect(response.body).toEqual({ error: 'Funnel not found' });
      expect(FunnelService.duplicateFunnel).toHaveBeenCalledWith(999, 1);
    });

    it('should return 500 for internal server errors', async () => {
      vi.mocked(FunnelService.duplicateFunnel).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/funnels/1/duplicate')
        .expect(500);

      expect(response.body).toEqual({ error: 'Internal server error' });
      expect(FunnelService.duplicateFunnel).toHaveBeenCalledWith(1, 1);
    });

    it('should handle Prisma P2025 error codes', async () => {
      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';
      
      vi.mocked(FunnelService.duplicateFunnel).mockRejectedValue(prismaError);

      const response = await request(app)
        .post('/funnels/1/duplicate')
        .expect(500);

      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('POST /funnels', () => {
    it('should create funnel successfully', async () => {
      const mockFunnel = {
        id: 1,
        name: 'Test Funnel',
        status: 'draft',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        pages: []
      };

      vi.mocked(FunnelService.createFunnel).mockResolvedValue(mockFunnel);

      const response = await request(app)
        .post('/funnels')
        .send({ name: 'Test Funnel', status: 'draft' })
        .expect(201);

      expect(response.body).toEqual({ funnel: mockFunnel });
      expect(FunnelService.createFunnel).toHaveBeenCalledWith(1, { name: 'Test Funnel', status: 'draft' });
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/funnels')
        .send({ status: 'draft' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Funnel name is required' });
      expect(FunnelService.createFunnel).not.toHaveBeenCalled();
    });
  });

  describe('GET /funnels', () => {
    it('should get user funnels successfully', async () => {
      const mockFunnels = [
        {
          id: 1,
          name: 'Funnel 1',
          status: 'draft',
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          pages: []
        }
      ];

      vi.mocked(FunnelService.getUserFunnels).mockResolvedValue(mockFunnels);

      const response = await request(app)
        .get('/funnels')
        .expect(200);

      expect(response.body).toEqual({ funnels: mockFunnels });
      expect(FunnelService.getUserFunnels).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /funnels/:id', () => {
    it('should get funnel by ID successfully', async () => {
      const mockFunnel = {
        id: 1,
        name: 'Test Funnel',
        status: 'draft',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        pages: []
      };

      vi.mocked(FunnelService.getFunnelById).mockResolvedValue(mockFunnel);

      const response = await request(app)
        .get('/funnels/1')
        .expect(200);

      expect(response.body).toEqual({ funnel: mockFunnel });
      expect(FunnelService.getFunnelById).toHaveBeenCalledWith(1, 1);
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/funnels/invalid')
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid funnel ID' });
    });

    it('should return 404 when funnel not found', async () => {
      vi.mocked(FunnelService.getFunnelById).mockResolvedValue(null);

      const response = await request(app)
        .get('/funnels/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Funnel not found' });
    });
  });

  describe('PUT /funnels/:id', () => {
    it('should update funnel successfully', async () => {
      const mockUpdatedFunnel = {
        id: 1,
        name: 'Updated Funnel',
        status: 'live',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        pages: []
      };

      vi.mocked(FunnelService.updateFunnel).mockResolvedValue(mockUpdatedFunnel);

      const response = await request(app)
        .put('/funnels/1')
        .send({ name: 'Updated Funnel', status: 'live' })
        .expect(200);

      expect(response.body).toEqual({ funnel: mockUpdatedFunnel });
      expect(FunnelService.updateFunnel).toHaveBeenCalledWith(1, 1, { name: 'Updated Funnel', status: 'live' });
    });

    it('should return 404 for Prisma P2025 error', async () => {
      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';
      
      vi.mocked(FunnelService.updateFunnel).mockRejectedValue(prismaError);

      const response = await request(app)
        .put('/funnels/1')
        .send({ name: 'Updated Funnel' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Funnel not found' });
    });
  });

  describe('DELETE /funnels/:id', () => {
    it('should delete funnel successfully', async () => {
      vi.mocked(FunnelService.deleteFunnel).mockResolvedValue();

      const response = await request(app)
        .delete('/funnels/1')
        .expect(200);

      expect(response.body).toEqual({ message: 'Funnel deleted successfully' });
      expect(FunnelService.deleteFunnel).toHaveBeenCalledWith(1, 1);
    });

    it('should return 404 for Prisma P2025 error', async () => {
      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';
      
      vi.mocked(FunnelService.deleteFunnel).mockRejectedValue(prismaError);

      const response = await request(app)
        .delete('/funnels/1')
        .expect(404);

      expect(response.body).toEqual({ error: 'Funnel not found' });
    });
  });
});