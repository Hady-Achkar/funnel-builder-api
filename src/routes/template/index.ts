import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { CreateTemplateFromFunnelController } from "../../controllers/template/create-from-funnel";
import { ReplaceTemplateFromFunnelController } from "../../controllers/template/replace-from-funnel";
import { getAllTemplatesController } from "../../controllers/template/get-all";
import { getTemplateByIdController } from "../../controllers/template/get-by-id";
import { updateTemplateController } from "../../controllers/template/update";
import { deleteTemplateController } from "../../controllers/template/delete";

const router: Router = express.Router();

// Public routes
router.get("/", getAllTemplatesController);
router.get("/:id", getTemplateByIdController);

// Protected routes
router.use(authenticateToken);

// Create template from funnel - JSON body, images as URLs
router.post("/from-funnel", CreateTemplateFromFunnelController.create);

// Replace template pages from funnel - Admin only
router.put("/:templateSlug/from-funnel", ReplaceTemplateFromFunnelController.replace);

router.put("/:id", updateTemplateController);
router.delete("/:id", deleteTemplateController);

export default router;
