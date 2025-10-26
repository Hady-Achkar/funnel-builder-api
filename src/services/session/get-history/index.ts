import { getPrisma } from "../../../lib/prisma";
import {
  GetSessionHistoryParams,
  GetSessionHistoryResponse,
} from "../../../types/session/get-history";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";

export const getSessionHistory = async (
  params: GetSessionHistoryParams,
  userId: number
): Promise<GetSessionHistoryResponse> => {
  const prisma = getPrisma();

  // Check if funnel exists and get workspace info
  const funnel = await prisma.funnel.findUnique({
    where: { id: params.funnelId },
    select: {
      id: true,
      workspaceId: true,
    },
  });

  if (!funnel) {
    throw new Error("Funnel not found");
  }

  // Check permission
  const permissionCheck = await PermissionManager.can({
    userId,
    workspaceId: funnel.workspaceId,
    action: PermissionAction.VIEW_FUNNEL,
  });

  if (!permissionCheck.allowed) {
    throw new Error(
      permissionCheck.reason ||
        `You don't have permission to view this funnel's sessions. Please contact your workspace admin.`
    );
  }

  // Build where clause with date filters
  const whereClause: {
    funnelId: number;
    updatedAt?: {
      gte?: Date;
      lte?: Date;
    };
  } = {
    funnelId: params.funnelId,
  };

  // Date range filtering on updatedAt
  if (params.startDate || params.endDate) {
    whereClause.updatedAt = {};
    if (params.startDate) {
      // Set to start of day (00:00:00)
      const startOfDay = new Date(params.startDate);
      startOfDay.setHours(0, 0, 0, 0);
      whereClause.updatedAt.gte = startOfDay;
    }
    if (params.endDate) {
      // Set to end of day (23:59:59.999) to include entire day
      const endOfDay = new Date(params.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.updatedAt.lte = endOfDay;
    }
  }

  // If search is provided, we need to fetch all sessions and filter in memory
  // Otherwise, use database pagination for better performance
  let allSessions: Array<{
    id: string;
    sessionId: string;
    visitedPages: number[];
    interactions: unknown;
    createdAt: Date;
    updatedAt: Date;
    formSubmissions: Array<{ id: number }>;
  }>;

  if (params.search) {
    // Fetch all sessions matching date/funnel filters
    allSessions = await prisma.session.findMany({
      where: whereClause,
      select: {
        id: true,
        sessionId: true,
        visitedPages: true,
        interactions: true,
        createdAt: true,
        updatedAt: true,
        formSubmissions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { [params.sortBy]: params.sortOrder },
    });

    // Filter sessions based on search term
    const searchLower = params.search.toLowerCase();
    allSessions = allSessions.filter((session) => {
      // Search in sessionId
      if (session.sessionId.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in interactions JSON
      if (session.interactions) {
        const interactionsStr = JSON.stringify(session.interactions).toLowerCase();
        return interactionsStr.includes(searchLower);
      }

      return false;
    });
  } else {
    // Use database pagination when no search
    const skip = (params.page - 1) * params.limit;
    allSessions = await prisma.session.findMany({
      where: whereClause,
      select: {
        id: true,
        sessionId: true,
        visitedPages: true,
        interactions: true,
        createdAt: true,
        updatedAt: true,
        formSubmissions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { [params.sortBy]: params.sortOrder },
      skip: skip,
      take: params.limit,
    });
  }

  // Calculate totals from filtered sessions
  const totalFilteredSessions = allSessions.length;
  const completedSessionsCount = allSessions.filter(
    (s) => s.formSubmissions.length > 0
  ).length;

  // Apply pagination to filtered results if search was used
  let paginatedSessions = allSessions;
  if (params.search) {
    const skip = (params.page - 1) * params.limit;
    paginatedSessions = allSessions.slice(skip, skip + params.limit);
  }

  // Transform sessions and determine completion status
  const sessionsWithCompletion = paginatedSessions.map((session) => ({
    id: session.id,
    sessionId: session.sessionId,
    visitedPages: session.visitedPages,
    interactions: session.interactions,
    isCompleted: session.formSubmissions.length > 0, // Has form submission = completed
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  }));

  // Calculate CTR as integer percentage (0-100) based on all filtered sessions
  const ctr =
    totalFilteredSessions > 0
      ? Math.round((completedSessionsCount / totalFilteredSessions) * 100)
      : 0;

  // Calculate total pages
  const totalPages = Math.ceil(totalFilteredSessions / params.limit);

  return {
    sessions: sessionsWithCompletion,
    total: totalFilteredSessions,
    completedSessions: completedSessionsCount,
    ctr: ctr,
    page: params.page,
    limit: params.limit,
    totalPages: totalPages,
  };
};
