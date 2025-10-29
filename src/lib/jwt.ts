import jwt from "jsonwebtoken";
import { Response } from "express";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface FunnelAccessTokenPayload {
  funnelSlug: string;
  funnelId: number;
  hasAccess: boolean;
  type: "funnel_access";
}

export const generateFunnelAccessToken = (
  funnelSlug: string,
  funnelId: number
): string => {
  const payload: FunnelAccessTokenPayload = {
    funnelSlug,
    funnelId,
    hasAccess: true,
    type: "funnel_access",
  };
  return jwt.sign(payload, JWT_SECRET);
};

export const verifyFunnelAccessToken = (
  token: string
): FunnelAccessTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as FunnelAccessTokenPayload;
    if (decoded.type !== "funnel_access" || !decoded.hasAccess) {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

export const setFunnelAccessSessionCookie = (
  res: Response,
  funnelSlug: string,
  funnelId?: number
): void => {
  // funnelId is optional for backward compatibility, but not used in cookie name anymore
  const token = generateFunnelAccessToken(funnelSlug, funnelId || 0);
  const cookieName = `funnel_access_${funnelSlug}`;
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
};

export const clearFunnelAccessCookie = (
  res: Response,
  funnelSlug: string
): void => {
  const cookieName = `funnel_access_${funnelSlug}`;
  res.clearCookie(cookieName, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

export const getFunnelAccessFromCookies = (
  cookies: any,
  funnelSlug: string
): boolean => {
  const cookieName = `funnel_access_${funnelSlug}`;
  const token = cookies[cookieName];

  if (!token) {
    return false;
  }

  const decoded = verifyFunnelAccessToken(token);
  return decoded !== null && decoded.funnelSlug === funnelSlug && decoded.hasAccess;
};
