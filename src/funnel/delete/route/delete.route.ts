import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { deleteFunnelController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.delete("/:id", deleteFunnelController);

export default router;