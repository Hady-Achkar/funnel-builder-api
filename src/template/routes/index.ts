import express, { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../../middleware/auth";
import { 
  createTemplateController, 
  getAllTemplatesController,
  getTemplateByIdController,
  updateTemplateController,
  deleteTemplateController
} from "../";

const router: Router = express.Router();

// Create multer instance for file uploads
// File validation is handled in the service layer helpers
const upload = multer({
  storage: multer.memoryStorage(),
});

// Public routes
router.get("/", getAllTemplatesController);
router.get("/:id", getTemplateByIdController);

// Protected routes
router.use(authenticateToken);

router.post("/", upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'preview_images', maxCount: 10 }
]), createTemplateController);

// More flexible upload configuration for from-funnel endpoint
// File validation is handled in the service layer helpers
const fromFunnelUpload = multer({
  storage: multer.memoryStorage(),
}).any(); // Accept any fields temporarily for debugging

router.post("/from-funnel", fromFunnelUpload, createTemplateController);

router.put("/:id", upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), updateTemplateController);
router.delete("/:id", deleteTemplateController);

export default router;