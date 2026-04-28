import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './auth';

// In-memory store: "actionKey:userId" -> last action timestamp (ms)
const lastActionTime = new Map<string, number>();

// Generic rate-limit middleware factory
// cooldownMs: minimum ms between requests for the same user
export function rateLimit(actionKey: string, cooldownMs: number, customMessage?: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Let requireAuth handle unauthenticated requests
    if (!req.userId) return next();

    const key  = `${actionKey}:${req.userId}`;
    const now  = Date.now();
    const last = lastActionTime.get(key) ?? 0;
    const elapsed = now - last;

    if (elapsed < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - elapsed) / 1000);
      return res.status(429).json({
        message: customMessage
          ?? `Please wait ${waitSec} second${waitSec !== 1 ? 's' : ''} before posting again.`,
        retryAfter: waitSec,
      });
    }

    lastActionTime.set(key, now);
    return next();
  };
}
