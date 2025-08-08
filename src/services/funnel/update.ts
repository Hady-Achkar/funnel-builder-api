import {
  UpdateFunnelData,
  FunnelWithPagesAndTheme,
} from "../../types/funnel.types";
import { getPrisma } from "../../lib/prisma";
import { updateFunnelCache } from "./cache-helpers";

export const updateFunnel = async (
  funnelId: number,
  userId: number,
  data: UpdateFunnelData
): Promise<FunnelWithPagesAndTheme> => {
  try {
    if (!funnelId || !userId)
      throw new Error("Please provide funnelId and userId.");

    const hasName = data.name !== undefined;
    const hasStatus = data.status !== undefined;
    const hasDomain = data.domainId !== undefined;
    if (!hasName && !hasStatus && !hasDomain)
      throw new Error("Nothing to update.");

    const prisma = getPrisma();

    const owner = await prisma.funnel.findUnique({
      where: { id: funnelId },
      select: { userId: true },
    });

    if (!owner) throw new Error("Funnel not found.");
    if (owner.userId !== userId)
      throw new Error("You can't update this funnel.");

    const updates: any = {};

    if (hasName) {
      updates.name = (data.name ?? "").trim();
    }

    if (hasStatus) {
      const status = String(data.status).toUpperCase();
      const allowed = ["DRAFT", "LIVE", "ARCHIVED", "SHARED"];
      if (!allowed.includes(status)) {
        throw new Error("Status must be DRAFT, LIVE, ARCHIVED, or SHARED.");
      }
      updates.status = status;
    }

    if (hasDomain && data.domainId !== null) {
      const domain = await prisma.domain.findUnique({
        where: { id: data.domainId as number },
        select: { userId: true },
      });
      if (!domain) throw new Error("Domain not found.");
      if (domain.userId !== userId)
        throw new Error("You don't own this domain.");
      updates.domainId = data.domainId;
    } else if (hasDomain && data.domainId === null) {
      updates.domainId = null;
    }

    const updated = await prisma.funnel.update({
      where: { id: funnelId, userId },
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
      await updateFunnelCache(userId, funnelId, updated, data);
    } catch (e) {
      console.warn("Funnel updated, but cache couldn't be refreshed:", e);
    }

    return updated as FunnelWithPagesAndTheme;
  } catch (e) {
    console.error("Failed to update funnel:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't update the funnel. Please try again.");
  }
};
