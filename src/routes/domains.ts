import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DomainController } from '../controllers/domain.controller';

const router: Router = express.Router();

// Domain management routes (protected)
router.post('/custom', authenticateToken, DomainController.createCustomDomain);
router.post('/subdomain', authenticateToken, DomainController.createSubdomain);
router.get('/', authenticateToken, DomainController.getUserDomains);
router.get('/:id', authenticateToken, DomainController.getDomainById);
router.post('/:id/verify', authenticateToken, DomainController.verifyDomain);
router.delete('/:id', authenticateToken, DomainController.deleteDomain);
router.get('/:id/verification', authenticateToken, DomainController.getVerificationInstructions);

// Funnel-Domain linking routes (protected)
router.post('/:domainId/funnels/:funnelId/link', authenticateToken, DomainController.linkFunnelToDomain);
router.delete('/:domainId/funnels/:funnelId/link', authenticateToken, DomainController.unlinkFunnelFromDomain);

// Public routes (no authentication required)
router.get('/public/:hostname/funnels/:funnelId', DomainController.getPublicFunnel);

export default router;