import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PageController } from '../controllers/page.controller';

const router: Router = express.Router();

// Routes for pages within funnels (protected)
router.post('/funnels/:funnelId/pages', authenticateToken, PageController.createPage);
router.get('/funnels/:funnelId/pages', authenticateToken, PageController.getFunnelPages);
router.put('/funnels/:funnelId/pages/reorder', authenticateToken, PageController.reorderPages);

// Routes for individual pages (protected)
router.get('/:id', authenticateToken, PageController.getPageById);
router.put('/:id', authenticateToken, PageController.updatePage);
router.delete('/:id', authenticateToken, PageController.deletePage);

// Public route for accessing pages by linking ID
router.get('/link/:linkingId', PageController.getPageByLinkingId);

export default router;