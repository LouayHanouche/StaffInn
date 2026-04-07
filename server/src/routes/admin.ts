import { Router } from 'express';
import {
  adminModerationSchemaExtended,
  adminUserUpdateSchema,
  adminCreateUserSchema,
  adminCandidateProfileUpdateSchema,
  adminHotelProfileUpdateSchema,
  filterQuerySchema,
  reportQuerySchema,
  reportCreateSchema,
  reportUpdateSchema,
} from '@staffinn/shared';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { buildPagination } from '../utils/pagination.js';
import { hashPassword } from '../services/auth.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/users', async (request, response) => {
  const parsed = filterQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid query', errors: parsed.error.flatten() });
    return;
  }

  const { page, pageSize } = parsed.data;
  const [total, items] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
  ]);

  response.json({
    items,
    pagination: buildPagination(page, pageSize, total),
  });
});

adminRouter.put('/users/:id', async (request, response) => {
  const parsed = adminUserUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.update({
    where: { id: request.params.id },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  response.json({ user });
});

adminRouter.delete('/users/:id', async (request, response) => {
  await prisma.user.delete({ where: { id: request.params.id } });
  response.status(204).send();
});

adminRouter.get('/offers', async (request, response) => {
  const parsed = filterQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid query', errors: parsed.error.flatten() });
    return;
  }

  const { page, pageSize } = parsed.data;

  const [total, items] = await Promise.all([
    prisma.jobOffer.count(),
    prisma.jobOffer.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        hotel: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  response.json({
    items,
    pagination: buildPagination(page, pageSize, total),
  });
});

adminRouter.put('/offers/:id', async (request, response) => {
  const parsed = adminModerationSchemaExtended.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const { action, reason } = parsed.data;
  const adminId = request.user?.sub;

  if (!adminId) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const statusByAction = {
    approve: 'ACTIVE',
    reject: 'CLOSED',
    close: 'CLOSED',
  } as const;

  // Use transaction to update offer and record moderation decision
  const [offer] = await prisma.$transaction([
    prisma.jobOffer.update({
      where: { id: request.params.id },
      data: {
        status: statusByAction[action],
      },
    }),
    prisma.moderationDecision.create({
      data: {
        offerId: request.params.id,
        action,
        reason: reason ?? null,
        adminId,
      },
    }),
  ]);

  response.json({ offer });
});

adminRouter.delete('/offers/:id', async (request, response) => {
  await prisma.jobOffer.delete({ where: { id: request.params.id } });
  response.status(204).send();
});

// === Wave 2.1: POST /admin/users - Create new user ===
adminRouter.post('/users', async (request, response) => {
  const parsed = adminCreateUserSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const { role, email, password, hotelName, fullName } = parsed.data;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    response.status(409).json({ message: 'Email already registered' });
    return;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      ...(role === 'HOTEL' && hotelName
        ? {
            hotel: {
              create: {
                name: hotelName,
                address: '',
              },
            },
          }
        : {}),
      ...(role === 'CANDIDATE' && fullName
        ? {
            candidate: {
              create: {
                fullName,
                skills: '',
                position: '',
                experienceYears: 0,
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  response.status(201).json({ user });
});

// === Wave 2.2: PATCH /admin/users/:id/profile - Update user profile ===
adminRouter.patch('/users/:id/profile', async (request, response) => {
  const userId = request.params.id;

  // First get the user to determine role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    response.status(404).json({ message: 'User not found' });
    return;
  }

  if (user.role === 'CANDIDATE') {
    const parsed = adminCandidateProfileUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
      return;
    }

    const { fullName, skills, experienceYears, position } = parsed.data;

    const candidate = await prisma.candidate.update({
      where: { userId },
      data: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(skills !== undefined ? { skills: skills.join(',') } : {}),
        ...(experienceYears !== undefined ? { experienceYears } : {}),
        ...(position !== undefined ? { position } : {}),
      },
    });

    response.json({ profile: candidate });
  } else if (user.role === 'HOTEL') {
    const parsed = adminHotelProfileUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
      return;
    }

    const { name, address, description } = parsed.data;

    const hotel = await prisma.hotel.update({
      where: { userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    response.json({ profile: hotel });
  } else {
    response.status(400).json({ message: 'Admin users do not have profiles' });
  }
});

// === Wave 2.3: GET /admin/offers/:id/moderation-history ===
adminRouter.get('/offers/:id/moderation-history', async (request, response) => {
  const offerId = request.params.id;

  const decisions = await prisma.moderationDecision.findMany({
    where: { offerId },
    orderBy: { createdAt: 'desc' },
  });

  response.json({ items: decisions });
});

// === Wave 2.4: Report Management Endpoints ===
adminRouter.get('/reports', async (request, response) => {
  const parsed = reportQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid query', errors: parsed.error.flatten() });
    return;
  }

  const { page, pageSize, status, targetType } = parsed.data;

  const where = {
    ...(status ? { status } : {}),
    ...(targetType ? { targetType } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  response.json({
    items,
    pagination: buildPagination(page, pageSize, total),
  });
});

adminRouter.get('/reports/:id', async (request, response) => {
  const report = await prisma.report.findUnique({
    where: { id: request.params.id },
  });

  if (!report) {
    response.status(404).json({ message: 'Report not found' });
    return;
  }

  response.json({ report });
});

adminRouter.post('/reports', async (request, response) => {
  const parsed = reportCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const { targetType, targetId, reason } = parsed.data;
  const reporterId = request.user?.sub;

  if (!reporterId) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const report = await prisma.report.create({
    data: {
      reporterId,
      targetType,
      targetId,
      reason,
    },
  });

  response.status(201).json({ report });
});

adminRouter.patch('/reports/:id', async (request, response) => {
  const parsed = reportUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const { status, resolution } = parsed.data;
  const adminId = request.user?.sub;

  const report = await prisma.report.update({
    where: { id: request.params.id },
    data: {
      status,
      ...(resolution !== undefined ? { resolution } : {}),
      ...(status === 'RESOLVED' || status === 'DISMISSED'
        ? { resolvedBy: adminId, resolvedAt: new Date() }
        : {}),
    },
  });

  response.json({ report });
});
