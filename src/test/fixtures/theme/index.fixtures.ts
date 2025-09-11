import { Theme } from "../../../generated/prisma-client";

export type CreateThemePayload = Pick<
  Theme,
  | "id"
  | "name"
  | "backgroundColor"
  | "textColor"
  | "buttonColor"
  | "buttonTextColor"
  | "borderColor"
  | "optionColor"
  | "fontFamily"
  | "borderRadius"
  | "createdAt"
  | "updatedAt"
>;
