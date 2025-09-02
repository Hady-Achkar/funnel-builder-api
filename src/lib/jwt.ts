import jwt from "jsonwebtoken";
import { Response } from "express";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface FunnelAccessTokenPayload {
  funnelId: number;
  hasAccess: boolean;
  type: "funnel_access";
}

export const generateFunnelAccessToken = (funnelId: number): string => {
  const payload: FunnelAccessTokenPayload = {
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
  funnelId: number
): void => {
  const token = generateFunnelAccessToken(funnelId);
  const cookieName = `funnel_access_${funnelId}`;
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
};

export const clearFunnelAccessCookie = (
  res: Response,
  funnelId: number
): void => {
  const cookieName = `funnel_access_${funnelId}`;
  res.clearCookie(cookieName, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

export const getFunnelAccessFromCookies = (
  cookies: any,
  funnelId: number
): boolean => {
  const cookieName = `funnel_access_${funnelId}`;
  const token = cookies[cookieName];

  if (!token) {
    return false;
  }

  const decoded = verifyFunnelAccessToken(token);
  return decoded !== null && decoded.funnelId === funnelId && decoded.hasAccess;
};
