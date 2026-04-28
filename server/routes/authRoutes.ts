import { Router, type NextFunction, type Request, type Response } from 'express';
import { login, me, register } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

const asyncHandler = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));

export default router;