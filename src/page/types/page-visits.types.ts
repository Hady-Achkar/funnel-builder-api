export interface CreatePageVisitResponse {
  success: boolean;
  message: string;
}

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