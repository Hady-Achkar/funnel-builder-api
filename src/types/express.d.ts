import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export interface AuthRequest extends Request {
  userId?: number;
}