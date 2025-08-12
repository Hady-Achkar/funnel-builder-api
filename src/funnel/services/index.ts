import { createFunnel } from "./create";
import { getUserFunnels } from "./getUserFunnels";
import { getFunnelById } from "./getFunnelById";
import { updateFunnel } from "./update";
import { deleteFunnel } from "./delete";
import { setPrismaClient } from "../../lib/prisma";

export class FunnelService {
  static createFunnel = createFunnel;
  static getUserFunnels = getUserFunnels;
  static getFunnelById = getFunnelById;
  static updateFunnel = updateFunnel;
  static deleteFunnel = deleteFunnel;
}

// Export for test environments
export { setPrismaClient };