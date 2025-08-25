import express, { Router } from "express";
import { updateThemeRoute } from "../update";

const router: Router = express.Router();

router.use("/", updateThemeRoute);

export default router;
