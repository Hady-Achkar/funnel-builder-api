import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { duplicateFunnelController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/:id/duplicate", duplicateFunnelController);

export default router;