// Legacy interface - deprecated, use create-page-visit.types.ts instead

export interface PageVisitSummary {
  id: number;
  name: string;
  linkingId: string | null;
  visits: number;
}

export interface GetFunnelPageVisitsResponse {
  success: boolean;
  data: PageVisitSummary[];
  message: string;
}