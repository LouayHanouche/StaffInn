import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../services/auth.js';

export const requireAuth = (request: Request, response: Response, next: NextFunction): void => {
  const authHeader = request.headers.authorization;
  const [type, token] = authHeader ? authHeader.split(' ') : [];

  if (type !== 'Bearer' || !token) {
    response.status(401).json({ message: 'Missing or invalid authorization header' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    request.user = {
      sub: payload.sub,
      role: payload.role,
      email: payload.email,
      sessionId: payload.sessionId,
    };
    next();
  } catch {
    response.status(401).json({ message: 'Invalid or expired access token' });
  }
};

export const requireRole = (...roles: Array<'HOTEL' | 'CANDIDATE' | 'ADMIN'>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    if (!request.user) {
      response.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (!roles.includes(request.user.role)) {
      response.status(403).json({ message: 'Forbidden for current role' });
      return;
    }
    next();
  };
