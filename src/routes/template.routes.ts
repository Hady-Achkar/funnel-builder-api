import { Router } from 'express';
import { templateController, TemplateController } from '../controllers/template.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/templates', templateController.getTemplates);
router.get('/templates/categories', templateController.getTemplateCategories);
router.get('/templates/:id', templateController.getTemplateById);
router.get('/templates/slug/:slug', templateController.getTemplateBySlug);
router.get('/templates/:id/preview', templateController.getTemplatePreview);
router.get('/templates/:id/validate', templateController.validateTemplate);

// Authenticated routes
router.post('/templates/:id/create-funnel', authenticateToken, templateController.createFunnelFromTemplate);

// Admin-only routes
router.post('/templates', authenticateToken, templateController.createTemplate);
router.post(
  '/templates/:id/images',
  authenticateToken,
  TemplateController.uploadMiddleware,
  templateController.uploadTemplateImage
);
router.post('/funnels/:id/duplicate-as-template', authenticateToken, templateController.duplicateFunnelAsTemplate);

export default router;