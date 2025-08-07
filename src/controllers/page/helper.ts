import { Response } from "express";

export const sendErrorResponse = (res: Response, error: any): void => {
  console.error("Page controller error:", error);

  if (error.message === "Funnel not found" || error.message === "Funnel not found or you don't have access to it") {
    res.status(404).json({
      success: false,
      error: "The specified funnel could not be found or you don't have access to it",
    });
    return;
  }

  if (error.message === "Page not found" || error.message === "Page not found or you don't have access to it") {
    res.status(404).json({
      success: false,
      error: "The specified page could not be found or you don't have access to it",
    });
    return;
  }

  if (error.message === "Target funnel not found") {
    res.status(404).json({
      success: false,
      error: error.message,
    });
    return;
  }

  if (error.code === "P2002" || error.message.includes("already exists")) {
    res.status(409).json({
      success: false,
      error: error.message.includes("linking ID") 
        ? "A page with this linking ID already exists"
        : error.message,
    });
    return;
  }

  if (error.message.includes("Cannot delete the last page")) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
    return;
  }

  if (
    error.message.includes("Page orders array is required") ||
    error.message.includes("Invalid order value") ||
    error.message.includes("Duplicate order values") ||
    error.message.includes("Must provide order for all pages") ||
    error.message.includes("not found in funnel") ||
    error.message.includes("No pages found in funnel")
  ) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: "An unexpected error occurred",
  });
};

export const validatePageId = (id: string): number | null => {
  const pageId = parseInt(id);
  return isNaN(pageId) ? null : pageId;
};

export const validateFunnelId = (id: string): number | null => {
  const funnelId = parseInt(id);
  return isNaN(funnelId) ? null : funnelId;
};

export const sendSuccessResponse = (res: Response, data: any, message?: string) => {
  const response: any = {
    success: true,
    data,
  };
  
  if (message) {
    response.message = message;
  }
  
  res.status(200).json(response);
};

export const sendCreatedResponse = (res: Response, data: any, message?: string) => {
  const response: any = {
    success: true,
    data,
  };
  
  if (message) {
    response.message = message;
  }
  
  res.status(201).json(response);
};