import { Request, Response, NextFunction } from "express";
import { getAllCategories } from "../../../services/template-category/get-all";
import { GetAllCategoriesQuery } from "../../../types/template-category/get-all";

export const getAllCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query as GetAllCategoriesQuery;
    const result = await getAllCategories(query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
