import { Response } from "express";
import { $Enums } from "../../generated/prisma-client";

export const sendErrorResponse = (res: Response, error: any): void => {
  console.error("Funnel controller error:", error);

  if (
    error.message.includes("required") ||
    error.message.includes("empty") ||
    error.message.includes("exceed") ||
    error.message.includes("Status must be") ||
    error.message.includes("must be unique") ||
    error.message.includes("Maximum funnel limit reached") ||
    error.message.includes("Cannot delete a live funnel")
  ) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
    return;
  }

  if (error.message.includes("User not found")) {
    res.status(404).json({
      success: false,
      error: "User not found",
    });
    return;
  }

  if (error.message.includes("not found") || error.code === "P2025") {
    res.status(404).json({
      success: false,
      error: error.message.includes("Funnel") ? "Funnel not found" : error.message,
    });
    return;
  }

  if (error.message.includes("already exists")) {
    res.status(409).json({
      success: false,
      error: error.message,
    });
    return;
  }

  if (error.message.includes("Access denied")) {
    res.status(403).json({
      success: false,
      error: "Access denied",
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
};

export const validateFunnelId = (id: string): number | null => {
  const funnelId = parseInt(id);
  return isNaN(funnelId) ? null : funnelId;
};

export const validateDomainId = (domainId: any): number | null => {
  if (domainId === undefined || domainId === null) return domainId;
  const parsed = parseInt(domainId);
  return isNaN(parsed) ? null : parsed;
};

export const validateQueryParams = (query: any) => {
  const errors: string[] = [];
  
  const allowedSortFields = ["name", "status", "createdAt", "updatedAt"];
  if (query.sortBy && !allowedSortFields.includes(query.sortBy)) {
    errors.push(`Invalid sortBy parameter. Allowed values: ${allowedSortFields.join(", ")}`);
  }

  if (query.sortOrder && !["asc", "desc"].includes(query.sortOrder)) {
    errors.push("Invalid sortOrder parameter. Allowed values: asc, desc");
  }

  const allowedStatuses = Object.values($Enums.FunnelStatus);
  if (query.status && !allowedStatuses.includes(query.status.toUpperCase() as $Enums.FunnelStatus)) {
    errors.push(`Invalid status parameter. Allowed values: ${allowedStatuses.join(", ")}`);
  }

  return errors;
};

export const parseListQuery = (query: any) => {
  return {
    page: query.page ? parseInt(query.page as string) : undefined,
    limit: query.limit ? parseInt(query.limit as string) : undefined,
    status: query.status as string,
    sortBy: query.sortBy as "name" | "status" | "createdAt" | "updatedAt",
    sortOrder: query.sortOrder as "asc" | "desc",
  };
};