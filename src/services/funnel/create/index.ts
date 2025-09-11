import { User, Workspace, Funnel } from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import { CreateFunnelPayload } from "../../../test/fixtures/funnel/index.fixtures";
import { CreateFunnelSettingsPayload } from "../../../test/fixtures/funnelSettings/index.fixtures";
import { CreatePagePayload } from "../../../test/fixtures/page/index.fixtures";
import { CreateThemePayload } from "../../../test/fixtures/theme/index.fixtures";
import { CreateFunnelRequest } from "../../../types/funnel/create";

export const createFunnel = async (
  userId: Pick<User, "id">["id"],
  data: CreateFunnelRequest
): Promise<Funnel> => {
  try {
    const prisma = getPrisma();

    const workspace: Pick<Workspace, "id" | "slug"> | null =
      await prisma.workspace.findUnique({
        where: { slug: data.workspaceSlug },
      });

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const result = await prisma.$transaction(async (tx) => {
      const funnel: CreateFunnelPayload = await tx.funnel.create({
        data: {
          name: data.name,
          slug: data.slug,
          status: data.status,
          createdBy: userId,
          workspaceId: workspace.id,
        },
      });

      const page: CreatePagePayload = await tx.page.create({
        data: {
          name: "New Page",
          linkingId: "home",
          order: 1,
          funnelId: funnel.id,
          type: "PAGE",
        },
      });

      const funnelSettings: CreateFunnelSettingsPayload =
        await tx.funnelSettings.create({
          data: {
            funnelId: funnel.id,
          },
        });

      const theme: CreateThemePayload = await tx.theme.create({
        data: {
          funnelId: funnel.id,
        },
      });

      return {
        funnel,
        page,
        funnelSettings,
        theme,
      };
    });

    return result.funnel as Funnel;
  } catch (error) {
    throw error;
  }
};
