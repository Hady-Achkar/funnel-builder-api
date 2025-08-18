import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { 
  createTemplateController, 
  upload,
  getAllTemplatesController,
  getTemplateByIdController,
  updateTemplateController,
  deleteTemplateController
} from "../";

const router: Router = express.Router();

// Public routes
router.get("/", getAllTemplatesController);
router.get("/:id", getTemplateByIdController);

// Protected routes
router.use(authenticateToken);

router.post("/", upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'previews', maxCount: 10 }
]), createTemplateController);

router.put("/:id", upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), updateTemplateController);
router.delete("/:id", deleteTemplateController);

export default router;