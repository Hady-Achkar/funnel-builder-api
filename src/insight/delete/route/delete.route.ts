import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { deleteInsightController } from "../controller/delete.controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.delete("/:id", deleteInsightController);

export default router;