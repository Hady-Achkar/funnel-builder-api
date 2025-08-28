import express, { Router } from "express";
import { resetPasswordController } from "../controller";

const router: Router = express.Router();

router.post("/", resetPasswordController);

export { router as resetPasswordRoute };