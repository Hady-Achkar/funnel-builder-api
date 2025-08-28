import express, { Router } from "express";
import { verifyEmailController } from "../controller";

const router: Router = express.Router();

router.post("/", verifyEmailController);

export { router as verifyRoute };