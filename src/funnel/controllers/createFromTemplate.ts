import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { createFunnelFromTemplate } from "../services/create-from-template.service";
import { CreateFunnelFromTemplateRequest } from "../types/create-from-template.types";
import { BadRequestError } from "../../errors";

export const createFunnelFromTemplateController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new BadRequestError("Authentication required");
    }

    const { templateId } = req.params;
    const { name } = req.body;
    
    if (!templateId || isNaN(parseInt(templateId))) {
      throw new BadRequestError("Valid template ID is required");
    }
    
    if (!name) {
      throw new BadRequestError("Funnel name is required");
    }

    const requestData: CreateFunnelFromTemplateRequest & { userId: number } = {
      templateId: parseInt(templateId),
      name,
      userId: req.userId
    };

    const result = await createFunnelFromTemplate(requestData);

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};