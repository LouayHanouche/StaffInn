import { Router } from 'express';
import { filterQuerySchema, hotelApplicationCreateSchema } from '@staffinn/shared';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { cacheKeyFrom, searchCache } from '../services/cache.js';
import { candidateWhereFromFilters } from '../services/filter.js';
import { buildPagination } from '../utils/pagination.js';

export const hotelRouter = Router();

hotelRouter.get('/candidates', requireAuth, requireRole('HOTEL', 'ADMIN'), async (request, response) => {
  const parsed = filterQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid filters', errors: parsed.error.flatten() });
    return;
  }

  const { page, pageSize, skills, experience_min: experienceMin, position } = parsed.data;
  const cacheKey = cacheKeyFrom('hotel-candidates', { page, pageSize, skills, experienceMin, position });
  const cached = searchCache.get(cacheKey);
  if (cached) {
    response.json(cached);
    return;
  }

  const where = candidateWhereFromFilters({ skills, experienceMin, position });
  const [total, items] = await Promise.all([
    prisma.candidate.count({ where }),
    prisma.candidate.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        position: true,
        experienceYears: true,
        skills: true,
        cvPath: true,
        user: {
          select: {
            email: true,
            isActive: true,
          },
        },
      },
    }),
  ]);

  const payload = {
    items: items.map((candidate) => ({
      id: candidate.id,
      fullName: candidate.fullName,
      position: candidate.position,
      experienceYears: candidate.experienceYears,
      cvPath: candidate.cvPath,
      email: candidate.user.email,
      isActive: candidate.user.isActive,
      skills: candidate.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
    })),
    pagination: buildPagination(page, pageSize, total),
  };
  searchCache.set(cacheKey, payload);
  response.json(payload);
});

hotelRouter.get('/hotel/applications', requireAuth, requireRole('HOTEL'), async (request, response) => {
  if (!request.user) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const hotel = await prisma.hotel.findUnique({ where: { userId: request.user.sub } });
  if (!hotel) {
    response.status(404).json({ message: 'Hotel profile not found' });
    return;
  }

  const applications = await prisma.application.findMany({
    where: {
      jobOffer: {
        hotelId: hotel.id,
      },
    },
    include: {
      candidate: {
        select: {
          id: true,
          fullName: true,
          position: true,
          experienceYears: true,
          skills: true,
          cvPath: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
      jobOffer: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { appliedAt: 'desc' },
  });

  response.json({
    items: applications.map((application) => ({
      ...application,
      candidate: {
        id: application.candidate.id,
        fullName: application.candidate.fullName,
        position: application.candidate.position,
        experienceYears: application.candidate.experienceYears,
        cvPath: application.candidate.cvPath,
        email: application.candidate.user.email,
        skills: application.candidate.skills
          .split(',')
          .map((skill: string) => skill.trim())
          .filter(Boolean),
      },
    })),
  });
});

hotelRouter.post('/hotel/applications', requireAuth, requireRole('HOTEL'), async (request, response) => {
  if (!request.user) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsed = hotelApplicationCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const hotel = await prisma.hotel.findUnique({ where: { userId: request.user.sub } });
  if (!hotel) {
    response.status(404).json({ message: 'Hotel profile not found' });
    return;
  }

  const offer = await prisma.jobOffer.findUnique({ where: { id: parsed.data.offerId } });
  if (!offer || offer.hotelId !== hotel.id) {
    response.status(404).json({ message: 'Offer not found' });
    return;
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: parsed.data.candidateId } });
  if (!candidate) {
    response.status(404).json({ message: 'Candidate not found' });
    return;
  }

  const existing = await prisma.application.findFirst({
    where: {
      candidateId: candidate.id,
      jobOfferId: offer.id,
    },
  });

  if (existing) {
    response.status(409).json({ message: 'Application already exists for this offer' });
    return;
  }

  const application = await prisma.application.create({
    data: {
      candidateId: candidate.id,
      jobOfferId: offer.id,
      status: parsed.data.status ?? 'INTERVIEW',
    },
  });

  response.status(201).json(application);
});
