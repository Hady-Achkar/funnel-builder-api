import express, { Router } from "express";
import { getAllWorkspacesController } from "../controller";

const router: Router = express.Router();

router.get("/", getAllWorkspacesController);

export default router;