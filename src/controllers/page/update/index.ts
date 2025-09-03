import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { updatePage } from "../../../services/page/update";

export const updatePageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User ID is required" });
    }

    const params = { id: req.params.id };
    const requestData = req.body;

    const result = await updatePage(params, requestData, userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};