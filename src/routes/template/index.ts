import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { CreateTemplateFromFunnelController } from "../../controllers/template/create-from-funnel";
import { ReplaceTemplateFromFunnelController } from "../../controllers/template/replace-from-funnel";
import { getAllTemplatesController } from "../../controllers/template/get-all";
import { searchTemplatesController } from "../../controllers/template/search";
import { getTemplatePagesController } from "../../controllers/template/get-pages";
import { getTemplatePageController } from "../../controllers/template/get-page";
import { updateTemplateController } from "../../controllers/template/update";
import { deleteTemplateController } from "../../controllers/template/delete";

const router: Router = express.Router();

// Public routes
router.get("/", getAllTemplatesController);
router.get("/summary", searchTemplatesController);
router.get("/:templateSlug/pages", getTemplatePagesController);
router.get("/:templateSlug/pages/:linkingId", getTemplatePageController);

// Protected routes
router.use(authenticateToken);

// Create template from funnel - JSON body, images as URLs
router.post("/from-funnel", CreateTemplateFromFunnelController.create);

// Replace template pages from funnel - Admin only
router.put(
  "/:templateSlug/from-funnel",
  ReplaceTemplateFromFunnelController.replace
);

router.put("/:templateSlug", updateTemplateController);
router.delete("/:templateSlug", deleteTemplateController);

export default router;
