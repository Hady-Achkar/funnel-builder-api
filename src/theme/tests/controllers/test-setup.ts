import { vi } from "vitest";
import { Request, Response } from "express";

// Helper functions to create mock req/res objects
export const createMockRequest = (
  body: any = {},
  userId?: number,
  params: any = {}
): Partial<Request> & { userId?: number } => ({
  body,
  userId,
  params,
});

export const createMockResponse = (): Partial<Response> => {
  const res = {} as Partial<Response>;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};
