import express, { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../../../middleware/auth";
import { uploadImagesController } from "../controller";

const router: Router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.use(authenticateToken);

router.post(
  "/folder/:folderId",
  upload.array("images"),
  uploadImagesController
);

export default router;
