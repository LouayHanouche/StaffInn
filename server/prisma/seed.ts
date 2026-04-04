import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const skillPools = [
  ['reception', 'english', 'night-shift'],
  ['cooking', 'food-safety', 'teamwork'],
  ['housekeeping', 'detail-oriented', 'time-management'],
  ['front-desk', 'customer-service', 'french'],
  ['reservation', 'excel', 'communication'],
];

const toSkillsText = (skills: string[]): string => skills.map((item) => item.toLowerCase()).join(',');

async function createUserWithProfile(input: {
  email: string;
  role: 'HOTEL' | 'CANDIDATE' | 'ADMIN';
  password: string;
  hotel?: { name: string; address: string; description: string };
  candidate?: { fullName: string; skills: string[]; position: string; experienceYears: number };
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      email: input.email,
      role: input.role,
      passwordHash,
      hotel: input.hotel
        ? {
            create: {
              ...input.hotel,
            },
          }
        : undefined,
      candidate: input.candidate
        ? {
            create: {
              fullName: input.candidate.fullName,
              position: input.candidate.position,
              experienceYears: input.candidate.experienceYears,
              skills: toSkillsText(input.candidate.skills),
            },
          }
        : undefined,
    },
    include: {
      hotel: true,
      candidate: true,
    },
  });
}

async function main() {
  await prisma.application.deleteMany();
  await prisma.jobOffer.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  await createUserWithProfile({
    email: 'admin@staffinn.local',
    role: 'ADMIN',
    password: 'AdminPass123',
  });

  const hotels = await Promise.all([
    createUserWithProfile({
      email: 'hotel1@staffinn.local',
      role: 'HOTEL',
      password: 'HotelPass123',
      hotel: {
        name: 'Atlas Grand Hotel',
        address: 'Marrakech, Morocco',
        description: 'Upscale city-center hotel with conference facilities.',
      },
    }),
    createUserWithProfile({
      email: 'hotel2@staffinn.local',
      role: 'HOTEL',
      password: 'HotelPass123',
      hotel: {
        name: 'Coastal Breeze Resort',
        address: 'Agadir, Morocco',
        description: 'Beach-front resort focused on tourism services.',
      },
    }),
    createUserWithProfile({
      email: 'hotel3@staffinn.local',
      role: 'HOTEL',
      password: 'HotelPass123',
      hotel: {
        name: 'Riad Medina Stay',
        address: 'Fes, Morocco',
        description: 'Boutique riad with traditional hospitality.',
      },
    }),
  ]);

  await Promise.all(
    Array.from({ length: 10 }).map((_, index) => {
      const skills = skillPools[index % skillPools.length];
      return createUserWithProfile({
        email: `candidate${index + 1}@staffinn.local`,
        role: 'CANDIDATE',
        password: 'CandidatePass123',
        candidate: {
          fullName: `Candidate ${index + 1}`,
          skills,
          position: index % 2 === 0 ? 'Receptionist' : 'Cook',
          experienceYears: (index % 6) + 1,
        },
      });
    }),
  );

  const offerTemplates = [
    {
      title: 'Receptionist - Day Shift',
      description: 'Handle guest check-in/out and reservation follow-up.',
      requiredSkills: ['reception', 'english', 'customer-service'],
      requiredExperience: 2,
      status: 'ACTIVE' as const,
    },
    {
      title: 'Commis Chef',
      description: 'Assist head chef with breakfast and lunch service.',
      requiredSkills: ['cooking', 'food-safety', 'teamwork'],
      requiredExperience: 1,
      status: 'ACTIVE' as const,
    },
    {
      title: 'Housekeeping Supervisor',
      description: 'Lead cleaning team and quality assurance checks.',
      requiredSkills: ['housekeeping', 'detail-oriented', 'time-management'],
      requiredExperience: 3,
      status: 'PENDING' as const,
    },
  ];

  const offers: Array<{ id: string }> = [];
  for (let index = 0; index < 15; index += 1) {
    const hotel = hotels[index % hotels.length].hotel;
    const template = offerTemplates[index % offerTemplates.length];
    if (!hotel) {
      continue;
    }

    const offer = await prisma.jobOffer.create({
      data: {
        hotelId: hotel.id,
        title: `${template.title} #${index + 1}`,
        description: template.description,
        requiredSkills: toSkillsText(template.requiredSkills),
        requiredExperience: template.requiredExperience,
        status: template.status,
      },
    });
    offers.push(offer);
  }

  const candidates = await prisma.candidate.findMany({ take: 8 });
  for (let index = 0; index < candidates.length; index += 1) {
    await prisma.application.create({
      data: {
        candidateId: candidates[index].id,
        jobOfferId: offers[index % offers.length].id,
        status: 'PENDING',
        coverLetter: 'I am interested in this hospitality opportunity.',
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
