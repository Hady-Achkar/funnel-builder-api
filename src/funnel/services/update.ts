import { z } from "zod";
import { getPrisma } from "../../lib/prisma";
import { updateFunnelCache } from "./cache-helpers";
import {
  UpdateFunnelBody,
  UpdateFunnelBodySchema,
  UpdateFunnelParamsSchema,
  UpdateFunnelResponse,
} from "../types/update-funnel.types";

export const updateFunnel = async (
  funnelId: number,
  userId: number,
  data: UpdateFunnelBody
): Promise<UpdateFunnelResponse> => {
  try {
    if (!userId) throw new Error("Please provide userId.");

    const validatedParams = UpdateFunnelParamsSchema.parse({ funnelId });
    const validatedData = UpdateFunnelBodySchema.parse(data);
    const validFunnelId = validatedParams.funnelId;

    if (!validatedData.name && !validatedData.status) {
      throw new Error("Nothing to update.");
    }

    const prisma = getPrisma();

    const existingFunnel = await prisma.funnel.findUnique({
      where: { id: validFunnelId },
      select: { userId: true, name: true, status: true },
    });

    if (!existingFunnel) throw new Error("Funnel not found.");
    if (existingFunnel.userId !== userId)
      throw new Error("You can't update this funnel.");

    const updates: any = {};
    const changed: string[] = [];

    const fieldsToCheck: {
      key: keyof typeof validatedData;
      displayName: string;
      transform?: (v: any) => any;
    }[] = [
      { key: "name", displayName: "name", transform: (v: string) => v.trim() },
      { key: "status", displayName: "status" },
    ];

    fieldsToCheck.forEach(({ key, displayName, transform }) => {
      const value = validatedData[key as keyof typeof validatedData];
      const existingValue = existingFunnel[key as keyof typeof existingFunnel];

      if (value !== undefined && value !== null) {
        const processedValue = transform ? transform(value as any) : value;
        if (processedValue !== existingValue) {
          updates[key] = processedValue;
          changed.push(displayName);
        }
      }
    });

    if (changed.length === 0) {
      throw new Error("Nothing to update.");
    }

    const updated = await prisma.funnel.update({
      where: { id: validFunnelId, userId },
      data: updates,
      include: {
        theme: true,
        pages: {
          omit: { content: true },
          orderBy: { order: "asc" },
        },
      },
    });

    try {
      await updateFunnelCache(userId, validFunnelId, updated, validatedData);
    } catch (e) {
      console.warn("Funnel updated, but cache couldn't be refreshed:", e);
    }

    const response = {
      data: {
        id: updated.id,
        name: updated.name,
      },
    };

    return response as UpdateFunnelResponse;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to update funnel: ${error.message}`);
    }
    throw new Error("Couldn't update the funnel. Please try again.");
  }
};
