import express, { Router } from "express";
import { uploadImageRoute } from "./upload/route";
import deleteImageRoute from "./delete/route/delete.route";
import updateImageRoute from "./update/route/update.route";
import moveImageRoute from "./move/route/move.route";

const router: Router = express.Router();

router.use("/", uploadImageRoute);
router.use("/", deleteImageRoute);
router.use("/", updateImageRoute);
router.use("/", moveImageRoute);

export default router;
