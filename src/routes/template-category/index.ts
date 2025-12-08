import express, { Router } from "express";
import { getAllCategoriesController } from "../../controllers/template-category/get-all";

const router: Router = express.Router();

router.get("/", getAllCategoriesController);

export default router;
