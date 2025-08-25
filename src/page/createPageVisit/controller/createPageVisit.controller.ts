import { Request, Response } from "express";
import { createPageVisit } from "../service";

export const createPageVisitController = async (
  req: Request,
  res: Response
) => {
  try {
    const pageId = Number(req.params.pageId);
    
    const result = await createPageVisit(
      { pageId },
      req.body
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred",
    });
  }
};