import { Router } from 'express';
import {
  applicationSchema,
  applicationStatusUpdateSchema,
  offerSearchQuerySchema,
  offerCreateSchema,
  offerUpdateSchema,
} from '@staffinn/shared';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { offerWhereFromFilters } from '../services/filter.js';
import { buildPagination } from '../utils/pagination.js';
import { cacheKeyFrom, searchCache } from '../services/cache.js';
import { normalizeSkills, sanitizeText, skillsToText } from '../utils/sanitize.js';

export const offersRouter = Router();

offersRouter.get('/filters', requireAuth, requireRole('CANDIDATE'), async (_request, response) => {
  const activeOffers = await prisma.jobOffer.findMany({
    where: { status: 'ACTIVE' },
    select: {
      title: true,
      requiredSkills: true,
      requiredExperience: true,
    },
  });

  const titleMap = new Map<string, string>();
  const skillSet = new Set<string>();
  const experienceSet = new Set<number>();

  for (const offer of activeOffers) {
    const normalizedTitle = offer.title.trim().toLowerCase();
    if (normalizedTitle && !titleMap.has(normalizedTitle)) {
      titleMap.set(normalizedTitle, offer.title.trim());
    }

    for (const skill of offer.requiredSkills
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)) {
      skillSet.add(skill);
    }

    experienceSet.add(offer.requiredExperience);
  }

  response.json({
    titles: Array.from(titleMap.values()).sort((left, right) => left.localeCompare(right)),
    skills: Array.from(skillSet).sort((left, right) => left.localeCompare(right)),
    experienceLevels: Array.from(experienceSet).sort((left, right) => left - right),
  });
});

offersRouter.get('/', requireAuth, async (request, response) => {
  if (!request.user) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (request.user.role === 'HOTEL') {
    const hotel = await prisma.hotel.findUnique({ where: { userId: request.user.sub } });
    if (!hotel) {
      response.status(404).json({ message: 'Hotel profile not found' });
      return;
    }

    const offers = await prisma.jobOffer.findMany({
      where: { hotelId: hotel.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
    response.json({
      items: offers.map((offer) => ({
        ...offer,
        requiredSkills: offer.requiredSkills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      })),
    });
    return;
  }

  const parsed = offerSearchQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid filters', errors: parsed.error.flatten() });
    return;
  }

  const {
    page,
    pageSize,
    skills,
    experience_min: experienceMin,
    position,
    title,
    q,
    sort,
  } = parsed.data;
  const titleFilter = title?.trim() || position?.trim();

  const cacheKey = cacheKeyFrom('candidate-offers', {
    page,
    pageSize,
    skills,
    experienceMin,
    title: titleFilter,
    q,
    sort,
  });

  const cached = searchCache.get(cacheKey);
  if (cached) {
    response.json(cached);
    return;
  }

  const where = offerWhereFromFilters({
    skills,
    experienceMin,
    title: titleFilter,
  });
  const whereWithSearch =
    q && q.trim()
      ? {
          AND: [
            where,
            {
              OR: [{ title: { contains: q.trim() } }, { description: { contains: q.trim() } }],
            },
          ],
        }
      : where;

  const orderBy =
    sort === 'experience_asc'
      ? { requiredExperience: 'asc' as const }
      : sort === 'experience_desc'
        ? { requiredExperience: 'desc' as const }
        : { createdAt: 'desc' as const };

  const [total, items] = await Promise.all([
    prisma.jobOffer.count({ where: whereWithSearch }),
    prisma.jobOffer.findMany({
      where: whereWithSearch,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      include: {
        hotel: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    }),
  ]);

  const payload = {
    items: items.map((item) => ({
      ...item,
      requiredSkills: item.requiredSkills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    })),
    pagination: buildPagination(page, pageSize, total),
  };

  searchCache.set(cacheKey, payload);
  response.json(payload);
});

offersRouter.post('/', requireAuth, requireRole('HOTEL'), async (request, response) => {
  if (!request.user) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsed = offerCreateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const hotel = await prisma.hotel.findUnique({ where: { userId: request.user.sub } });
  if (!hotel) {
    response.status(404).json({ message: 'Hotel profile not found' });
    return;
  }

  const normalizedSkills = normalizeSkills(parsed.data.requiredSkills);
  const offer = await prisma.jobOffer.create({
    data: {
      hotelId: hotel.id,
      title: sanitizeText(parsed.data.title),
      description: sanitizeText(parsed.data.description),
      requiredSkills: skillsToText(normalizedSkills),
      requiredExperience: parsed.data.requiredExperience,
      status: 'PENDING',
    },
  });

  response.status(201).json({
    ...offer,
    requiredSkills: offer.requiredSkills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
  });
});

offersRouter.put('/:id', requireAuth, requireRole('HOTEL'), async (request, response) => {
  if (!request.user) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const parsed = offerUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const hotel = await prisma.hotel.findUnique({ where: { userId: request.user.sub } });
  if (!hotel) {
    response.status(404).json({ message: 'Hotel profile not found' });
    return;
  }

  const existing = await prisma.jobOffer.findUnique({ where: { id: request.params.id } });
  if (!existing || existing.hotelId !== hotel.id) {
    response.status(404).json({ message: 'Offer not found' });
    return;
  }

  const skills = parsed.data.requiredSkills
    ? normalizeSkills(parsed.data.requiredSkills)
    : undefined;
  const updated = await prisma.jobOffer.update({
    where: { id: request.params.id },
    data: {
      title: parsed.data.title ? sanitizeText(parsed.data.title) : undefined,
      description: parsed.data.description ? sanitizeText(parsed.data.description) : undefined,
      requiredExperience: parsed.data.requiredExperience,
      requiredSkills: skills ? skillsToText(skills) : undefined,
      status: 'PENDING',
    },
  });

  response.json({
    ...updated,
    requiredSkills: updated.requiredSkills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
  });
});

offersRouter.delete('/:id', requireAuth, requireRole('HOTEL'), async (request, response) => {
  if (!request.user) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const hotel = await prisma.hotel.findUnique({ where: { userId: request.user.sub } });
  if (!hotel) {
    response.status(404).json({ message: 'Hotel profile not found' });
    return;
  }

  const existing = await prisma.jobOffer.findUnique({ where: { id: request.params.id } });
  if (!existing || existing.hotelId !== hotel.id) {
    response.status(404).json({ message: 'Offer not found' });
    return;
  }

  await prisma.jobOffer.delete({ where: { id: request.params.id } });
  response.status(204).send();
});

offersRouter.post(
  '/:id/apply',
  requireAuth,
  requireRole('CANDIDATE'),
  async (request, response) => {
    if (!request.user) {
      response.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const parsed = applicationSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
      return;
    }

    const candidate = await prisma.candidate.findUnique({ where: { userId: request.user.sub } });
    if (!candidate) {
      response.status(404).json({ message: 'Candidate profile not found' });
      return;
    }

    const offer = await prisma.jobOffer.findUnique({ where: { id: request.params.id } });
    if (!offer || offer.status !== 'ACTIVE') {
      response.status(404).json({ message: 'Active offer not found' });
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
        coverLetter: parsed.data.coverLetter ? sanitizeText(parsed.data.coverLetter) : undefined,
      },
    });
    response.status(201).json(application);
  },
);

offersRouter.get(
  '/:id/applications',
  requireAuth,
  requireRole('HOTEL'),
  async (request, response) => {
    if (!request.user) {
      response.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const hotel = await prisma.hotel.findUnique({ where: { userId: request.user.sub } });
    if (!hotel) {
      response.status(404).json({ message: 'Hotel profile not found' });
      return;
    }

    const offer = await prisma.jobOffer.findUnique({ where: { id: request.params.id } });
    if (!offer || offer.hotelId !== hotel.id) {
      response.status(404).json({ message: 'Offer not found' });
      return;
    }

    const applications = await prisma.application.findMany({
      where: { jobOfferId: offer.id },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            position: true,
            experienceYears: true,
            skills: true,
            cvPath: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    response.json({
      items: applications.map((application) => ({
        ...application,
        candidate: {
          ...application.candidate,
          skills: application.candidate.skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
        },
      })),
    });
  },
);

offersRouter.patch(
  '/:id/applications/:applicationId',
  requireAuth,
  requireRole('HOTEL'),
  async (request, response) => {
    if (!request.user) {
      response.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const parsed = applicationStatusUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
      return;
    }

    const hotel = await prisma.hotel.findUnique({ where: { userId: request.user.sub } });
    if (!hotel) {
      response.status(404).json({ message: 'Hotel profile not found' });
      return;
    }

    const offer = await prisma.jobOffer.findUnique({ where: { id: request.params.id } });
    if (!offer || offer.hotelId !== hotel.id) {
      response.status(404).json({ message: 'Offer not found' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id: request.params.applicationId },
    });

    if (!application || application.jobOfferId !== offer.id) {
      response.status(404).json({ message: 'Application not found' });
      return;
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: parsed.data.status },
    });

    response.json(updated);
  },
);
