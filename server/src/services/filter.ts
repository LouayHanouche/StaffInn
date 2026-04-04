import { Prisma } from '@prisma/client';

interface FilterInput {
  skills: string[];
  experienceMin?: number;
  position?: string;
}

const escapeLike = (value: string): string => value.replace(/[%_]/g, '\\$&');

export const candidateWhereFromFilters = (filters: FilterInput): Prisma.CandidateWhereInput => ({
  AND: [
    typeof filters.experienceMin === 'number' ? { experienceYears: { gte: filters.experienceMin } } : {},
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

export const offerWhereFromFilters = (filters: FilterInput): Prisma.JobOfferWhereInput => ({
  AND: [
    { status: 'ACTIVE' },
    typeof filters.experienceMin === 'number' ? { requiredExperience: { gte: filters.experienceMin } } : {},
    filters.position
      ? {
          title: {
            contains: escapeLike(filters.position),
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
