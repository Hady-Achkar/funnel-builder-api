import { Response } from "express";

export interface CookieOptions {
  name: string;
  value: string;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  path?: string;
}

export const setAuthCookie = (
  res: Response,
  token: string,
  options: Partial<CookieOptions> = {}
): void => {
  const isProduction = process.env.NODE_ENV === "production";

  const defaultOptions: CookieOptions = {
    name: "authToken",
    value: token,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
  };

  const finalOptions = { ...defaultOptions, ...options };

  res.cookie(finalOptions.name, finalOptions.value, {
    maxAge: finalOptions.maxAge,
    httpOnly: finalOptions.httpOnly,
    secure: finalOptions.secure,
    sameSite: finalOptions.sameSite,
    path: finalOptions.path,
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
};

export const setRefreshCookie = (res: Response, refreshToken: string): void => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("refreshToken", refreshToken, {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/api/auth/refresh",
  });
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/refresh",
  });
};
