import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { deleteFormController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.delete("/:id", deleteFormController);

export default router;