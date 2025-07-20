import { PrismaClient } from '../generated/prisma-client';

// Allow prisma client to be injected for testing
let prisma = new PrismaClient();

// Function to set Prisma client for testing
export const setPrismaClient = (client: PrismaClient) => {
  prisma = client;
};

export interface CreatePageData {
  name: string;
  content?: string;
  order: number;
  linkingId?: string;
}

export interface UpdatePageData {
  name?: string;
  content?: string;
  order?: number;
  linkingId?: string;
}

export interface PageData {
  id: number;
  name: string;
  content: string | null;
  order: number;
  linkingId: string | null;
  funnelId: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PageService {
  static async createPage(funnelId: number, userId: number, data: CreatePageData): Promise<PageData> {
    // Verify funnel belongs to user
    const funnel = await prisma.funnel.findFirst({
      where: { 
        id: funnelId,
        userId
      }
    });

    if (!funnel) {
      throw new Error('Funnel not found');
    }

    const page = await prisma.page.create({
      data: {
        name: data.name,
        content: data.content,
        order: data.order,
        linkingId: data.linkingId,
        funnelId
      }
    });

    return page;
  }

  static async getFunnelPages(funnelId: number, userId: number): Promise<PageData[]> {
    // Verify funnel belongs to user
    const funnel = await prisma.funnel.findFirst({
      where: { 
        id: funnelId,
        userId
      }
    });

    if (!funnel) {
      throw new Error('Funnel not found');
    }

    const pages = await prisma.page.findMany({
      where: { funnelId },
      orderBy: { order: 'asc' }
    });

    return pages;
  }

  static async getPageById(pageId: number, userId: number): Promise<PageData | null> {
    const page = await prisma.page.findFirst({
      where: { 
        id: pageId,
        funnel: {
          userId
        }
      }
    });

    return page;
  }

  static async getPageByLinkingId(linkingId: string): Promise<PageData | null> {
    const page = await prisma.page.findUnique({
      where: { linkingId }
    });

    return page;
  }

  static async updatePage(pageId: number, userId: number, data: UpdatePageData): Promise<PageData> {
    // Verify page belongs to user's funnel
    const existingPage = await prisma.page.findFirst({
      where: { 
        id: pageId,
        funnel: {
          userId
        }
      }
    });

    if (!existingPage) {
      throw new Error('Page not found');
    }

    const page = await prisma.page.update({
      where: { id: pageId },
      data
    });

    return page;
  }

  static async deletePage(pageId: number, userId: number): Promise<void> {
    // Verify page belongs to user's funnel
    const existingPage = await prisma.page.findFirst({
      where: { 
        id: pageId,
        funnel: {
          userId
        }
      }
    });

    if (!existingPage) {
      throw new Error('Page not found');
    }

    await prisma.page.delete({
      where: { id: pageId }
    });
  }

  static async reorderPages(funnelId: number, userId: number, pageOrders: { id: number; order: number }[]): Promise<void> {
    // Verify funnel belongs to user
    const funnel = await prisma.funnel.findFirst({
      where: { 
        id: funnelId,
        userId
      }
    });

    if (!funnel) {
      throw new Error('Funnel not found');
    }

    // Update all page orders in a transaction
    await prisma.$transaction(
      pageOrders.map(({ id, order }) =>
        prisma.page.update({
          where: { id },
          data: { order }
        })
      )
    );
  }
}