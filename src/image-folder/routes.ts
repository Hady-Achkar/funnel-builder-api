import express, { Router } from "express";
import { createImageFolderRoute } from "./create";
import { getUserImageFoldersRoute } from "./get-user-folders";
import { getImageFolderByIdRoute } from "./get-folder-by-id";
import { updateImageFolderRoute } from "./update";
import { deleteImageFolderRoute } from "./delete";

const router: Router = express.Router();

router.use("/", createImageFolderRoute);

router.use("/", getUserImageFoldersRoute);

router.use("/", getImageFolderByIdRoute);

router.use("/", updateImageFolderRoute);

router.use("/", deleteImageFolderRoute);

export default router;
