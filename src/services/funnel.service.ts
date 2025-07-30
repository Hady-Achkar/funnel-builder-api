import { PrismaClient } from '../generated/prisma-client';

// Allow prisma client to be injected for testing
let prisma = new PrismaClient();

// Function to set Prisma client for testing
export const setPrismaClient = (client: PrismaClient) => {
  prisma = client;
};

export interface CreateFunnelData {
  name: string;
  status?: string;
}

export interface UpdateFunnelData {
  name?: string;
  status?: string;
}

export interface FunnelWithPages {
  id: number;
  name: string;
  status: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  pages: {
    id: number;
    name: string;
    content: string | null;
    order: number;
    linkingId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export class FunnelService {
  static async createFunnel(userId: number, data: CreateFunnelData): Promise<FunnelWithPages> {
    const funnel = await prisma.funnel.create({
      data: {
        name: data.name,
        status: data.status || 'draft',
        userId
      },
      include: {
        pages: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return funnel;
  }

  static async getUserFunnels(userId: number): Promise<FunnelWithPages[]> {
    const funnels = await prisma.funnel.findMany({
      where: { userId },
      include: {
        pages: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return funnels;
  }

  static async getFunnelById(funnelId: number, userId: number): Promise<FunnelWithPages | null> {
    const funnel = await prisma.funnel.findFirst({
      where: { 
        id: funnelId,
        userId
      },
      include: {
        pages: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return funnel;
  }

  static async updateFunnel(funnelId: number, userId: number, data: UpdateFunnelData): Promise<FunnelWithPages> {
    const funnel = await prisma.funnel.update({
      where: { 
        id: funnelId,
        userId
      },
      data,
      include: {
        pages: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return funnel;
  }

  static async deleteFunnel(funnelId: number, userId: number): Promise<void> {
    await prisma.funnel.delete({
      where: { 
        id: funnelId,
        userId
      }
    });
  }

  static async duplicateFunnel(funnelId: number, userId: number): Promise<FunnelWithPages> {
    const originalFunnel = await prisma.funnel.findFirst({
      where: { 
        id: funnelId,
        userId
      },
      include: {
        pages: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!originalFunnel) {
      throw new Error('Funnel not found');
    }

    const duplicatedFunnel = await prisma.funnel.create({
      data: {
        name: `${originalFunnel.name} (Copy)`,
        status: originalFunnel.status,
        userId,
        pages: {
          create: originalFunnel.pages.map(page => ({
            name: page.name,
            content: page.content,
            order: page.order,
            linkingId: page.linkingId
          }))
        }
      },
      include: {
        pages: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return duplicatedFunnel;
  }
}