import { Router } from "express";
import { RegisterController } from "../controller/register.controller";

const router = Router();

router.post("/", RegisterController.register);

export { router as registerRoute };