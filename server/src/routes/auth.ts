import { Router, type Response } from 'express';
import { loginSchema, registerSchema } from '@staffinn/shared';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rate-limit.js';
import {
  hashPassword,
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from '../services/auth.js';
import { env } from '../config/env.js';

export const authRouter = Router();

const refreshCookieName = 'staffinn_refresh_token';

const asKnownRole = (role: string): 'HOTEL' | 'CANDIDATE' | 'ADMIN' | null => {
  if (role === 'HOTEL' || role === 'CANDIDATE' || role === 'ADMIN') {
    return role;
  }
  return null;
};

const setRefreshCookie = (response: Response, token: string): void => {
  response.cookie(refreshCookieName, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.COOKIE_SECURE,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
};

authRouter.post('/register', authRateLimiter, async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    response
      .status(400)
      .json({ message: 'Invalid register payload', errors: parsed.error.flatten() });
    return;
  }

  const input = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    response.status(409).json({ message: 'Email is already registered' });
    return;
  }

  const passwordHash = await hashPassword(input.password);

  const created = await prisma.user.create({
    data: {
      role: input.role,
      email: input.email.toLowerCase(),
      passwordHash,
      hotel:
        input.role === 'HOTEL'
          ? {
              create: {
                name: input.hotelName ?? 'Hotel',
                address: 'Not set',
              },
            }
          : undefined,
      candidate:
        input.role === 'CANDIDATE'
          ? {
              create: {
                fullName: input.fullName ?? 'Candidate',
                position: 'Not set',
                experienceYears: 0,
                skills: '',
              },
            }
          : undefined,
    },
  });

  const session = await prisma.session.create({
    data: {
      userId: created.id,
      refreshTokenHash: '',
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  const refreshToken = signRefreshToken({ userId: created.id, sessionId: session.id });
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashRefreshToken(refreshToken),
    },
  });

  const createdRole = asKnownRole(created.role);
  if (!createdRole) {
    response.status(500).json({ message: 'Invalid role detected for created user' });
    return;
  }

  const accessToken = signAccessToken({
    userId: created.id,
    email: created.email,
    role: createdRole,
    sessionId: session.id,
  });

  setRefreshCookie(response, refreshToken);
  response.status(201).json({
    accessToken,
    user: {
      id: created.id,
      email: created.email,
      role: created.role,
    },
  });
});

authRouter.post('/login', authRateLimiter, async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid login payload', errors: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) {
    response.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  if (!user.isActive) {
    response.status(403).json({ message: 'Compte suspendu' });
    return;
  }

  const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    response.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: '',
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  const refreshToken = signRefreshToken({ userId: user.id, sessionId: session.id });
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashRefreshToken(refreshToken) },
  });

  const loginRole = asKnownRole(user.role);
  if (!loginRole) {
    response.status(500).json({ message: 'Invalid role detected for login user' });
    return;
  }

  const accessToken = signAccessToken({
    userId: user.id,
    role: loginRole,
    email: user.email,
    sessionId: session.id,
  });

  setRefreshCookie(response, refreshToken);
  response.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

authRouter.post('/refresh', async (request, response) => {
  const refreshToken = request.cookies[refreshCookieName] as string | undefined;
  if (!refreshToken) {
    response.status(401).json({ message: 'Missing refresh token' });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt.getTime() < Date.now() ||
      session.refreshTokenHash !== hashRefreshToken(refreshToken)
    ) {
      response.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    const nextSession = await prisma.session.create({
      data: {
        userId: session.userId,
        refreshTokenHash: '',
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    const nextRefreshToken = signRefreshToken({
      userId: session.userId,
      sessionId: nextSession.id,
    });
    await prisma.$transaction([
      prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
      prisma.session.update({
        where: { id: nextSession.id },
        data: {
          refreshTokenHash: hashRefreshToken(nextRefreshToken),
        },
      }),
    ]);

    const refreshRole = asKnownRole(session.user.role);
    if (!refreshRole) {
      response.status(500).json({ message: 'Invalid role detected during refresh' });
      return;
    }

    const accessToken = signAccessToken({
      userId: session.user.id,
      role: refreshRole,
      email: session.user.email,
      sessionId: nextSession.id,
    });

    setRefreshCookie(response, nextRefreshToken);
    response.json({ accessToken });
  } catch {
    response.status(401).json({ message: 'Invalid refresh token' });
  }
});

authRouter.post('/logout', async (request, response) => {
  const refreshToken = request.cookies[refreshCookieName] as string | undefined;
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.session.update({
        where: { id: payload.sessionId },
        data: { revokedAt: new Date() },
      });
    } catch {
      response.clearCookie(refreshCookieName);
    }
  }
  response.clearCookie(refreshCookieName);
  response.status(204).send();
});

authRouter.get('/me', requireAuth, async (request, response) => {
  if (!request.user) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: request.user.sub },
    include: { hotel: true, candidate: true },
  });

  if (!user) {
    response.status(404).json({ message: 'User not found' });
    return;
  }

  response.json({
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
      isActive: user.isActive,
      hotel: user.hotel,
      candidate: user.candidate
        ? {
            ...user.candidate,
            skills: user.candidate.skills
              .split(',')
              .map((skill) => skill.trim())
              .filter(Boolean),
          }
        : null,
    },
  });
});
