import express, { Router } from "express";
import { createInsightSubmissionController } from "../controller/create.controller";

const router: Router = express.Router();

router.post("/", createInsightSubmissionController);

export default router;