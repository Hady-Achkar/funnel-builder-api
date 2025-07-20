import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PageService } from '../services/page.service';

export class PageController {
  static async createPage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const funnelId = parseInt(req.params.funnelId);
      const { name, content, order, linkingId } = req.body;

      if (isNaN(funnelId)) {
        res.status(400).json({ error: 'Invalid funnel ID' });
        return;
      }

      if (!name || order === undefined) {
        res.status(400).json({ error: 'Page name and order are required' });
        return;
      }

      const page = await PageService.createPage(funnelId, userId, { name, content, order, linkingId });
      res.status(201).json({ page });
    } catch (error: any) {
      console.error('Create page error:', error);
      
      if (error.message === 'Funnel not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'Linking ID already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFunnelPages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const funnelId = parseInt(req.params.funnelId);

      if (isNaN(funnelId)) {
        res.status(400).json({ error: 'Invalid funnel ID' });
        return;
      }

      const pages = await PageService.getFunnelPages(funnelId, userId);
      res.json({ pages });
    } catch (error: any) {
      console.error('Get pages error:', error);
      
      if (error.message === 'Funnel not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getPageById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const pageId = parseInt(req.params.id);

      if (isNaN(pageId)) {
        res.status(400).json({ error: 'Invalid page ID' });
        return;
      }

      const page = await PageService.getPageById(pageId, userId);

      if (!page) {
        res.status(404).json({ error: 'Page not found' });
        return;
      }

      res.json({ page });
    } catch (error) {
      console.error('Get page error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getPageByLinkingId(req: Request, res: Response): Promise<void> {
    try {
      const { linkingId } = req.params;

      const page = await PageService.getPageByLinkingId(linkingId);

      if (!page) {
        res.status(404).json({ error: 'Page not found' });
        return;
      }

      res.json({ page });
    } catch (error) {
      console.error('Get page by linking ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updatePage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const pageId = parseInt(req.params.id);
      const { name, content, order, linkingId } = req.body;

      if (isNaN(pageId)) {
        res.status(400).json({ error: 'Invalid page ID' });
        return;
      }

      const page = await PageService.updatePage(pageId, userId, { name, content, order, linkingId });
      res.json({ page });
    } catch (error: any) {
      console.error('Update page error:', error);
      
      if (error.message === 'Page not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'Linking ID already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deletePage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const pageId = parseInt(req.params.id);

      if (isNaN(pageId)) {
        res.status(400).json({ error: 'Invalid page ID' });
        return;
      }

      await PageService.deletePage(pageId, userId);
      res.json({ message: 'Page deleted successfully' });
    } catch (error: any) {
      console.error('Delete page error:', error);
      
      if (error.message === 'Page not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async reorderPages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const funnelId = parseInt(req.params.funnelId);
      const { pageOrders } = req.body;

      if (isNaN(funnelId)) {
        res.status(400).json({ error: 'Invalid funnel ID' });
        return;
      }

      if (!Array.isArray(pageOrders)) {
        res.status(400).json({ error: 'Page orders must be an array' });
        return;
      }

      await PageService.reorderPages(funnelId, userId, pageOrders);
      res.json({ message: 'Pages reordered successfully' });
    } catch (error: any) {
      console.error('Reorder pages error:', error);
      
      if (error.message === 'Funnel not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}