import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const currentFilePath = fileURLToPath(import.meta.url);
const configDirectoryPath = path.dirname(currentFilePath);
const serverDirectoryPath = path.resolve(configDirectoryPath, '..', '..');
const repositoryDirectoryPath = path.resolve(serverDirectoryPath, '..');

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(serverDirectoryPath, '.env'),
  path.resolve(repositoryDirectoryPath, '.env'),
  path.resolve(repositoryDirectoryPath, '.env.example'),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CLIENT_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  COOKIE_SECURE: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;
