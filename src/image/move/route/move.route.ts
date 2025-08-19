import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { moveImageController } from "../controller/move.controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.patch("/:imageId/move", moveImageController);

export default router;