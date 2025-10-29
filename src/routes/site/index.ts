import express, { Router } from "express";
import { GetPublicSiteController } from "../../controllers/site/get-public-site";
import { checkFunnelAccess } from "../../middleware/funnelAccess";

const router: Router = express.Router();

// Public endpoint - with password protection check via middleware
router.get("/public", checkFunnelAccess, GetPublicSiteController.getPublicSite);

export default router;
