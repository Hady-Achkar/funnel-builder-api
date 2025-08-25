import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { getPageController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.get("/:id", getPageController);

export default router;