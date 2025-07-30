import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FunnelService } from '../services/funnel.service';

export class FunnelController {
  static async createFunnel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { name, status } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Funnel name is required' });
        return;
      }

      const funnel = await FunnelService.createFunnel(userId, { name, status });
      res.status(201).json({ funnel });
    } catch (error) {
      console.error('Create funnel error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserFunnels(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const funnels = await FunnelService.getUserFunnels(userId);
      res.json({ funnels });
    } catch (error) {
      console.error('Get funnels error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFunnelById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const funnelId = parseInt(req.params.id);

      if (isNaN(funnelId)) {
        res.status(400).json({ error: 'Invalid funnel ID' });
        return;
      }

      const funnel = await FunnelService.getFunnelById(funnelId, userId);

      if (!funnel) {
        res.status(404).json({ error: 'Funnel not found' });
        return;
      }

      res.json({ funnel });
    } catch (error) {
      console.error('Get funnel error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateFunnel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const funnelId = parseInt(req.params.id);
      const { name, status } = req.body;

      if (isNaN(funnelId)) {
        res.status(400).json({ error: 'Invalid funnel ID' });
        return;
      }

      const funnel = await FunnelService.updateFunnel(funnelId, userId, { name, status });
      res.json({ funnel });
    } catch (error: any) {
      console.error('Update funnel error:', error);
      
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Funnel not found' });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteFunnel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const funnelId = parseInt(req.params.id);

      if (isNaN(funnelId)) {
        res.status(400).json({ error: 'Invalid funnel ID' });
        return;
      }

      await FunnelService.deleteFunnel(funnelId, userId);
      res.json({ message: 'Funnel deleted successfully' });
    } catch (error: any) {
      console.error('Delete funnel error:', error);
      
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Funnel not found' });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async duplicateFunnel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const funnelId = parseInt(req.params.id);

      if (isNaN(funnelId)) {
        res.status(400).json({ error: 'Invalid funnel ID' });
        return;
      }

      const duplicatedFunnel = await FunnelService.duplicateFunnel(funnelId, userId);
      res.status(201).json({ funnel: duplicatedFunnel });
    } catch (error: any) {
      console.error('Duplicate funnel error:', error);
      
      if (error.message === 'Funnel not found') {
        res.status(404).json({ error: 'Funnel not found' });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}