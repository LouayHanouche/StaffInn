import { Prisma } from '@prisma/client';

interface CandidateFilterInput {
  skills: string[];
  experienceMin?: number;
  position?: string;
}

interface OfferFilterInput {
  skills: string[];
  experienceMin?: number;
  title?: string;
}

const escapeLike = (value: string): string => value.replace(/[%_]/g, '\\$&');

export const candidateWhereFromFilters = (
  filters: CandidateFilterInput,
): Prisma.CandidateWhereInput => ({
  AND: [
    typeof filters.experienceMin === 'number'
      ? { experienceYears: { gte: filters.experienceMin } }
      : {},
    filters.position
      ? {
          position: {
            contains: escapeLike(filters.position),
          },
        }
      : {},
    ...filters.skills.map((skill) => ({
      skills: {
        contains: escapeLike(skill.toLowerCase()),
      },
    })),
  ],
});

export const offerWhereFromFilters = (filters: OfferFilterInput): Prisma.JobOfferWhereInput => ({
  AND: [
    { status: 'ACTIVE' },
    typeof filters.experienceMin === 'number'
      ? { requiredExperience: { gte: filters.experienceMin } }
      : {},
    filters.title
      ? {
          title: {
            contains: escapeLike(filters.title),
          },
        }
      : {},
    ...filters.skills.map((skill) => ({
      requiredSkills: {
        contains: escapeLike(skill.toLowerCase()),
      },
    })),
  ],
});
