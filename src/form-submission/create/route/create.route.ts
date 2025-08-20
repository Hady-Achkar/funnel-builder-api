import express, { Router } from "express";
import { createFormSubmissionController } from "../controller";

const router: Router = express.Router();

router.post("/", createFormSubmissionController);

export default router;