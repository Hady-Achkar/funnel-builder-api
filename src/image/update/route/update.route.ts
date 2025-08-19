import express, { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../../../middleware/auth";
import { updateImageController } from "../controller/update.controller";

const router: Router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.use(authenticateToken);

router.put("/:imageId", upload.fields([{ name: "image", maxCount: 1 }]), updateImageController);

export default router;