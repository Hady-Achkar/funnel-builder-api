import express, { Router } from "express";
import { forgotPasswordController } from "../controller";

const router: Router = express.Router();

router.post("/", forgotPasswordController);

export { router as forgotPasswordRoute };