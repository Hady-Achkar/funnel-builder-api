/**
 * Migration Routes
 *
 * Public routes for migrating users from old database
 */

import { Router } from 'express';
import { migrateUser } from '../../controllers/migration/migrate-user';

const router = Router();

/**
 * POST /api/migration/migrate-user
 * Migrates a single user from old database
 * Public route (no authentication required)
 */
router.post('/migrate-user', migrateUser);

export default router;
