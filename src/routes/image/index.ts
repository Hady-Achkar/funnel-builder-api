import express, { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../../middleware/auth";
import { uploadImagesController } from "../../controllers/image/upload";
import { uploadSingleImageController } from "../../controllers/image/upload-single";
import { deleteImageController } from "../../controllers/image/delete";
import { bulkDeleteImagesController } from "../../controllers/image/bulk-delete";
import { updateImageController } from "../../controllers/image/update";
import { moveImageController } from "../../controllers/image/move";

const router: Router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB in bytes
  },
});

router.use(authenticateToken);

router.post(
  "/folder/:folderId",
  upload.array("images"),
  uploadImagesController
);

router.post(
  "/upload-single",
  upload.single("image"),
  uploadSingleImageController
);

router.delete("/:imageId", deleteImageController);

router.delete("/bulk", bulkDeleteImagesController);

router.put(
  "/:imageId",
  upload.fields([{ name: "image", maxCount: 1 }]),
  updateImageController
);

router.patch("/:imageId/move", moveImageController);

export default router;
