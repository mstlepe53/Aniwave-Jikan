import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(503).json({ message: 'Authentication is not configured.' });
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please log in to continue.' });
  }

  try {
    const payload = jwt.verify(header.slice(7), secret) as { id?: string };
    if (!payload.id) {
      return res.status(403).json({ message: 'Your session is invalid. Please log in again.' });
    }
    req.userId = payload.id;
    return next();
  } catch {
    return res.status(403).json({ message: 'Your session has expired. Please log in again.' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const secret = process.env.JWT_SECRET;
  const header = req.headers.authorization;

  if (secret && header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), secret) as { id?: string };
      if (payload.id) req.userId = payload.id;
    } catch {
      // token invalid — proceed unauthenticated
    }
  }
  return next();
}
