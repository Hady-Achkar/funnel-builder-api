import express, { Router } from "express";
import { GetPublicSiteController } from "../../controllers/site/get-public-site";

const router: Router = express.Router();

// Public endpoint - no authentication or password protection required
router.get("/public", GetPublicSiteController.getPublicSite);

export default router;
