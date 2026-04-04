import { Router } from 'express';
import { adminModerationSchema, adminUserUpdateSchema, filterQuerySchema } from '@staffinn/shared';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { buildPagination } from '../utils/pagination.js';

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
  const parsed = adminModerationSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const statusByAction = {
    approve: 'ACTIVE',
    reject: 'CLOSED',
    close: 'CLOSED',
  } as const;

  const offer = await prisma.jobOffer.update({
    where: { id: request.params.id },
    data: {
      status: statusByAction[parsed.data.action],
    },
  });

  response.json({ offer });
});

adminRouter.delete('/offers/:id', async (request, response) => {
  await prisma.jobOffer.delete({ where: { id: request.params.id } });
  response.status(204).send();
});
