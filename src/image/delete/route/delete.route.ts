import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { deleteImageController } from "../controller/delete.controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.delete("/:imageId", deleteImageController);

export default router;