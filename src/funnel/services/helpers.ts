import { $Enums } from "../../generated/prisma-client";
import { CreateFunnelData, UpdateFunnelData } from "../types";
import { getPrisma } from "../../lib/prisma";

export const validateCreateInput = (
  userId: number,
  data: CreateFunnelData
): void => {
  if (!userId) {
    throw new Error("Invalid user ID provided");
  }

  if (!data.name) {
    throw new Error("Funnel name is required");
  }

  const trimmedName = data.name.trim();
  if (trimmedName.length === 0) {
    throw new Error("Funnel name cannot be empty");
  }

  if (
    data.status &&
    !Object.values($Enums.FunnelStatus).includes(
      data.status as $Enums.FunnelStatus
    )
  ) {
    const allowedStatuses = Object.values($Enums.FunnelStatus);
    throw new Error(`Status must be one of: ${allowedStatuses.join(", ")}`);
  }
};

export const validateStatusQuery = (status?: string): void => {
  if (status) {
    const statusUpper = status.toUpperCase();
    if (
      !Object.values($Enums.FunnelStatus).includes(
        statusUpper as $Enums.FunnelStatus
      )
    ) {
      throw new Error(
        `Invalid status. Must be one of: ${Object.values($Enums.FunnelStatus).join(", ")}`
      );
    }
  }
};

export const validateUpdateInput = (data: UpdateFunnelData): void => {
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Funnel name cannot be empty");
    }
  }

  if (data.status !== undefined) {
    const allowedStatuses = Object.values($Enums.FunnelStatus);
    if (!allowedStatuses.includes(data.status)) {
      throw new Error(`Status must be one of: ${allowedStatuses.join(", ")}`);
    }
  }
};

export const verifyFunnelAccess = async (
  funnelId: number,
  userId: number
): Promise<boolean> => {
  const funnelExists = await getPrisma().funnel.findUnique({
    where: { id: funnelId },
    select: { id: true, userId: true },
  });

  if (!funnelExists) {
    return false;
  }

  if (funnelExists.userId !== userId) {
    throw new Error("Access denied");
  }

  return true;
};

export const verifyFunnelOwnership = async (
  funnelId: number,
  userId: number
): Promise<void> => {
  const funnelExists = await getPrisma().funnel.findUnique({
    where: { id: funnelId },
    select: { id: true, userId: true },
  });

  if (!funnelExists) {
    throw new Error("Funnel not found");
  }

  if (funnelExists.userId !== userId) {
    throw new Error("Access denied");
  }
};

export const verifyDomainOwnership = async (
  domainId: number,
  userId: number
): Promise<void> => {
  const domain = await getPrisma().domain.findFirst({
    where: { id: domainId, userId },
  });

  if (!domain) {
    throw new Error("Domain not found");
  }
};

export const handleDomainConnection = async (
  transactionalPrisma: any,
  funnelId: number,
  domainId: number | null
): Promise<void> => {
  if (domainId === null) {
    await transactionalPrisma.funnelDomain.deleteMany({
      where: { funnelId },
    });
  } else {
    await transactionalPrisma.funnelDomain.updateMany({
      where: { funnelId },
      data: { isActive: false },
    });

    const existingConnection = await transactionalPrisma.funnelDomain.findFirst(
      {
        where: { funnelId, domainId },
      }
    );

    if (existingConnection) {
      await transactionalPrisma.funnelDomain.update({
        where: { id: existingConnection.id },
        data: { isActive: true },
      });
    } else {
      await transactionalPrisma.funnelDomain.create({
        data: { funnelId, domainId, isActive: true },
      });
    }
  }
};

export const handleCreateError = (error: any): Error => {
  if (error.code === "P2002") {
    return new Error("A funnel with this configuration already exists");
  }

  if (error.code === "P2003") {
    return new Error("Invalid user reference provided");
  }

  if (error.code === "P2025") {
    return new Error("User not found in database");
  }

  if (
    error.message.includes("Invalid user ID") ||
    error.message.includes("Funnel name") ||
    error.message.includes("User not found") ||
    error.message.includes("Status must be") ||
    error.message.includes("required") ||
    error.message.includes("Maximum funnel limit reached")
  ) {
    return error;
  }

  if (error.message.includes("Failed to create theme")) {
    return new Error("Failed to create funnel due to theme creation error");
  }

  return new Error("Failed to create funnel. Please try again later.");
};

export const handleUpdateError = (error: any): Error => {
  if (
    error.message.includes("Funnel name") ||
    error.message.includes("Status must be") ||
    error.message.includes("not found") ||
    error.message.includes("Access denied") ||
    error.message.includes("empty")
  ) {
    return error;
  }

  if (error.code === "P2002") {
    return new Error("A funnel with this name already exists");
  }

  if (error.code === "P2025") {
    return new Error("Funnel not found");
  }

  return new Error("Failed to update funnel. Please try again later.");
};
