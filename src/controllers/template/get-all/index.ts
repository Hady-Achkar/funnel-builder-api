import { Request, Response, NextFunction } from "express";
import { getAllTemplates } from "../../../services/template/get-all";

export const getAllTemplatesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getAllTemplates(req.query as any);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};