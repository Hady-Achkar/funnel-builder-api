import { $Enums } from "../../generated/prisma-client";
import { PageSummary } from "../../page/types";
import { ThemeData } from "./get-funnel-by-id.types";

export interface CachedFunnelData {
  id: number;
  name: string;
  status: $Enums.FunnelStatus;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  theme: ThemeData | null;
}

export interface CachedFunnelDataWithPages {
  id: number;
  name: string;
  status: $Enums.FunnelStatus;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  theme: ThemeData | null;
  pages: PageSummary[];
}

export interface CachedFunnelWithPages {
  id: number;
  name: string;
  status: $Enums.FunnelStatus;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  pages: PageSummary[];
  theme: ThemeData | null;
}
