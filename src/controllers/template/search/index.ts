import { Request, Response, NextFunction } from "express";
import { searchTemplates } from "../../../services/template/search";
import { searchTemplatesQuery } from "../../../types/template/search";

export const searchTemplatesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = searchTemplatesQuery.parse(req.query);
    const result = await searchTemplates(query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
