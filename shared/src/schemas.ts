import { z } from 'zod';

const emailSchema = z.string().email().max(255);

const passwordSchema = z
  .string()
  .min(10)
  .max(128)
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/[0-9]/, 'Password must include at least one number');

const skillsSchema = z
  .array(z.string().trim().min(1).max(50))
  .max(30)
  .transform((skills) =>
    Array.from(new Set(skills.map((item) => item.trim().toLowerCase()))),
  );

const safeTextSchema = z.string().trim().max(2000);

export const registerSchema = z
  .object({
    role: z.enum(['HOTEL', 'CANDIDATE']),
    email: emailSchema,
    password: passwordSchema,
    hotelName: z.string().trim().min(2).max(150).optional(),
    fullName: z.string().trim().min(2).max(150).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === 'HOTEL' && !value.hotelName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'hotelName is required for HOTEL role',
        path: ['hotelName'],
      });
    }
    if (value.role === 'CANDIDATE' && !value.fullName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fullName is required for CANDIDATE role',
        path: ['fullName'],
      });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const offerCreateSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: safeTextSchema.min(20),
  requiredSkills: skillsSchema,
  requiredExperience: z.number().int().min(0).max(60),
});

export const offerUpdateSchema = offerCreateSchema.partial();

export const candidateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  skills: skillsSchema,
  experienceYears: z.number().int().min(0).max(60),
  position: z.string().trim().min(2).max(120),
});

export const filterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  skills: z
    .string()
    .optional()
    .transform((skills) =>
      skills
        ? Array.from(
            new Set(
              skills
                .split(',')
                .map((value) => value.trim().toLowerCase())
                .filter(Boolean),
            ),
          )
        : [],
    ),
  experience_min: z.coerce.number().int().min(0).max(60).optional(),
  position: z.string().trim().max(120).optional(),
});

export const adminUserUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['HOTEL', 'CANDIDATE', 'ADMIN']).optional(),
});

export const adminModerationSchema = z.object({
  action: z.enum(['approve', 'reject', 'close']),
});

export const applicationSchema = z.object({
  coverLetter: z.string().trim().max(2000).optional(),
});

export const applicationStatusSchema = z.enum(['PENDING', 'INTERVIEW', 'ACCEPTED', 'REJECTED']);

export const applicationStatusUpdateSchema = z.object({
  status: applicationStatusSchema,
});

export const hotelApplicationCreateSchema = z.object({
  candidateId: z.string().trim().min(1),
  offerId: z.string().trim().min(1),
  status: applicationStatusSchema.optional(),
});
