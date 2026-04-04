import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

interface AccessTokenInput {
  userId: string;
  role: 'HOTEL' | 'CANDIDATE' | 'ADMIN';
  email: string;
  sessionId: string;
}

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, 12);

export const verifyPassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

export const signAccessToken = (input: AccessTokenInput): string =>
  jwt.sign(
    {
      sub: input.userId,
      role: input.role,
      email: input.email,
      sessionId: input.sessionId,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL },
  );

export const signRefreshToken = (input: { userId: string; sessionId: string }): string =>
  jwt.sign(
    {
      sub: input.userId,
      sessionId: input.sessionId,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
    },
  );

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as {
    sub: string;
    role: 'HOTEL' | 'CANDIDATE' | 'ADMIN';
    email: string;
    sessionId: string;
  };

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as {
    sub: string;
    sessionId: string;
  };

export const hashRefreshToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');
