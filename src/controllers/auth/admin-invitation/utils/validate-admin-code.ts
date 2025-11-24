import { isValidAdminCode } from "../../../../constants/admin-codes";

export function validateAdminCode(code: string): boolean {
  return isValidAdminCode(code);
}
