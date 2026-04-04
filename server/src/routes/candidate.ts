import { Router } from 'express';
import { candidateProfileSchema, filterQuerySchema } from '@staffinn/shared';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { cvUpload } from '../middleware/upload.js';
import { cacheKeyFrom, searchCache } from '../services/cache.js';
import { candidateWhereFromFilters } from '../services/filter.js';
import { buildPagination } from '../utils/pagination.js';
import { normalizeSkills, sanitizeText, skillsToText } from '../utils/sanitize.js';

export const candidateRouter = Router();

candidateRouter.get('/profile', requireAuth, requireRole('CANDIDATE'), async (request, response) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: request.user?.sub } });
  if (!candidate) {
    response.status(404).json({ message: 'Candidate profile not found' });
    return;
  }
  response.json({
    profile: {
      ...candidate,
      skills: candidate.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
    },
  });
});

candidateRouter.put('/profile', requireAuth, requireRole('CANDIDATE'), async (request, response) => {
  const parsed = candidateProfileSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    return;
  }

  const candidate = await prisma.candidate.findUnique({ where: { userId: request.user?.sub } });
  if (!candidate) {
    response.status(404).json({ message: 'Candidate profile not found' });
    return;
  }

  const skills = normalizeSkills(parsed.data.skills);
  const profile = await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      fullName: sanitizeText(parsed.data.fullName),
      position: sanitizeText(parsed.data.position),
      experienceYears: parsed.data.experienceYears,
      skills: skillsToText(skills),
    },
  });

  response.json({
    profile: {
      ...profile,
      skills,
    },
  });
});

candidateRouter.post(
  '/profile/cv',
  requireAuth,
  requireRole('CANDIDATE'),
  cvUpload.single('cv'),
  async (request, response) => {
    if (!request.file) {
      response.status(400).json({ message: 'No CV file was uploaded' });
      return;
    }

    const candidate = await prisma.candidate.findUnique({ where: { userId: request.user?.sub } });
    if (!candidate) {
      response.status(404).json({ message: 'Candidate profile not found' });
      return;
    }

    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        cvPath: request.file.filename,
      },
    });

    response.json({
      profile: {
        ...updated,
        skills: updated.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      },
    });
  },
);

candidateRouter.get('/applications', requireAuth, requireRole('CANDIDATE'), async (request, response) => {
  const candidate = await prisma.candidate.findUnique({ where: { userId: request.user?.sub } });
  if (!candidate) {
    response.status(404).json({ message: 'Candidate profile not found' });
    return;
  }

  const items = await prisma.application.findMany({
    where: { candidateId: candidate.id },
    include: {
      jobOffer: {
        include: {
          hotel: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { appliedAt: 'desc' },
  });

  response.json({
    items: items.map((item) => ({
      ...item,
      jobOffer: {
        ...item.jobOffer,
        requiredSkills: item.jobOffer.requiredSkills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      },
    })),
  });
});

candidateRouter.get('/search/candidates', requireAuth, requireRole('HOTEL', 'ADMIN'), async (request, response) => {
  const parsed = filterQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid filters', errors: parsed.error.flatten() });
    return;
  }

  const { page, pageSize, skills, experience_min: experienceMin, position } = parsed.data;
  const cacheKey = cacheKeyFrom('candidate-search', { page, pageSize, skills, experienceMin, position });
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
        skills: true,
        experienceYears: true,
        cvPath: true,
      },
    }),
  ]);

  const payload = {
    items: items.map((candidateItem) => ({
      ...candidateItem,
      skills: candidateItem.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
    })),
    pagination: buildPagination(page, pageSize, total),
  };
  searchCache.set(cacheKey, payload);
  response.json(payload);
});
