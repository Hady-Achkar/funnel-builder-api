import { updateTheme } from "./update";
import { setPrismaClient } from "../../lib/prisma";

export class ThemeService {
  static updateTheme = updateTheme;
}

// Export individual functions for direct import
export { updateTheme };

// Export for test environments
export { setPrismaClient };
