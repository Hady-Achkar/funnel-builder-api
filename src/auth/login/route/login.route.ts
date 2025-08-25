import { Router } from "express";
import { LoginController } from "../controller/login.controller";

const router = Router();

router.post("/", LoginController.login);

export { router as loginRoute };