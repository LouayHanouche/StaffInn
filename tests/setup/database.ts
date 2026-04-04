import { execSync } from 'node:child_process';
import path from 'node:path';
import { prisma } from '../../server/src/db/prisma.js';
import { hashPassword } from '../../server/src/services/auth.js';

const projectRoot = path.resolve(process.cwd(), '..');

export const resetDatabase = (): void => {
  execSync('npm run prisma:generate --workspace server', {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  execSync('npx prisma db push --force-reset --schema server/prisma/schema.prisma', {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: 'file:./prisma/test.db',
    },
  });
};

export const seedTestData = async (): Promise<void> => {
  const adminPassword = await hashPassword('AdminPass123');
  const hotelPassword = await hashPassword('HotelPass123');
  const candidatePassword = await hashPassword('CandidatePass123');

  const admin = await prisma.user.create({
    data: {
      role: 'ADMIN',
      email: 'admin@test.local',
      passwordHash: adminPassword,
    },
  });

  const hotelUser = await prisma.user.create({
    data: {
      role: 'HOTEL',
      email: 'hotel@test.local',
      passwordHash: hotelPassword,
      hotel: {
        create: {
          name: 'Test Hotel',
          address: 'Casablanca',
          description: 'Test hotel profile',
        },
      },
    },
    include: {
      hotel: true,
    },
  });

  await prisma.user.create({
    data: {
      role: 'CANDIDATE',
      email: 'candidate@test.local',
      passwordHash: candidatePassword,
      candidate: {
        create: {
          fullName: 'Candidate Test',
          position: 'Receptionist',
          experienceYears: 3,
          skills: 'reception,english',
        },
      },
    },
  });

  await prisma.jobOffer.create({
    data: {
      hotelId: hotelUser.hotel!.id,
      title: 'Receptionist',
      description: 'Handle check-in and guest support',
      requiredSkills: 'reception,english',
      requiredExperience: 2,
      status: 'ACTIVE',
    },
  });

  await prisma.user.update({
    where: { id: admin.id },
    data: { isActive: true },
  });
};
