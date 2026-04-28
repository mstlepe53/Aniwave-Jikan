import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest } from '../middleware/auth';
import { createUser, findUserByEmail, findUserById, toSafeUser } from '../models/userModel';
import { validateLogin, validateRegistration } from '../utils/validation';
import { getConnectionError } from '../config/db';

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing authentication configuration: JWT_SECRET');
  }
  return process.env.JWT_SECRET;
}

function createToken(userId: string) {
  return jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: '7d' });
}

function configurationError() {
  return getConnectionError() || (!process.env.JWT_SECRET ? 'Missing authentication configuration: JWT_SECRET' : null);
}

export async function register(req: AuthenticatedRequest, res: Response) {
  const configError = configurationError();
  if (configError) return res.status(503).json({ message: configError });

  const { errors, values } = validateRegistration(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  const existing = await findUserByEmail(values.email);
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(values.password, 12);
  const user = await createUser(values.username, values.email, passwordHash);
  const token = createToken(user.id);

  return res.status(201).json({ token, user: toSafeUser(user) });
}

export async function login(req: AuthenticatedRequest, res: Response) {
  const configError = configurationError();
  if (configError) return res.status(503).json({ message: configError });

  const { errors, values } = validateLogin(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  const user = await findUserByEmail(values.email);
  if (!user) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }

  const valid = await bcrypt.compare(values.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }

  return res.json({ token: createToken(user.id), user: toSafeUser(user) });
}

export async function me(req: AuthenticatedRequest, res: Response) {
  const configError = configurationError();
  if (configError) return res.status(503).json({ message: configError });

  if (!req.userId) {
    return res.status(401).json({ message: 'Please log in to continue.' });
  }

  const user = await findUserById(req.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({ user: toSafeUser(user) });
}
