import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { createImageFolderController } from "../../controllers/image-folder/create";
import { getUserImageFoldersController } from "../../controllers/image-folder/get-user-folders";
import { getImageFolderByIdController } from "../../controllers/image-folder/get-folder-by-id";
import { updateImageFolderController } from "../../controllers/image-folder/update";
import { deleteImageFolderController } from "../../controllers/image-folder/delete";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", createImageFolderController);

router.get("/", getUserImageFoldersController);

router.get("/:id", getImageFolderByIdController);

router.put("/:id", updateImageFolderController);

router.delete("/:id", deleteImageFolderController);

export default router;