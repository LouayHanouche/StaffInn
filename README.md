# StaffInn

StaffInn is a desktop-oriented recruitment platform for the hospitality and tourism domain.
It uses a client-server architecture with role-based workflows for hotels, candidates, and admins.

## Stack Decision

- Desktop shell: Electron + React (client)
- Backend API: Node.js + Express + Prisma
- Database: SQLite (dev/test), with a clean migration path to PostgreSQL
- Auth: JWT access token + rotating refresh token in httpOnly cookie
- Validation: Zod shared schemas
- Tests: Vitest + Supertest + Playwright (API E2E flows)

## Monorepo Structure

```text
StaffInn/
├── client/     # React UI + Electron shell
├── server/     # Express API + Prisma schema and seed
├── shared/     # Shared schemas and types
├── tests/      # Unit, integration, security, and e2e suites
└── .env.example
```

## Environment Setup

1. Copy environment template:

```bash
cp .env.example .env
```

2. Ensure required values exist in `.env`:

- `PORT`
- `CLIENT_ORIGIN`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_TTL`
- `REFRESH_TOKEN_TTL_DAYS`
- `COOKIE_SECURE`
- `VITE_API_BASE_URL`

## Install

```bash
npm install
```

## Database

Generate Prisma client, apply schema, and seed realistic data:

```bash
npm run prisma:generate --workspace server
npx prisma db push --schema server/prisma/schema.prisma
npm run prisma:seed --workspace server
```

## Run in Development

Run API + React client:

```bash
npm run dev
```

Run API + React + Electron desktop shell:

```bash
npm run dev:desktop
```

### Linux desktop dependencies (Electron)

If Electron fails with `libnspr4.so` or similar shared-library errors, install:

```bash
sudo apt update
sudo apt install -y libnss3 libnspr4 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libgtk-3-0
```

After installing dependencies, rerun:

```bash
npm run dev:desktop
```

### Env loading behavior

The server now loads environment values in this order:

1. current working directory `.env`
2. `server/.env`
3. repository root `.env`
4. repository root `.env.example` (fallback defaults)

## Build, Lint, and Test

Build all packages:

```bash
npm run build
```

Lint all packages:

```bash
npm run lint
```

Run all tests:

```bash
npm run test
```

### Single test commands

Unit or integration file with Vitest:

```bash
npm run test:integration --workspace tests -- offers.integration.test.ts
```

Playwright single spec:

```bash
npm run test:e2e --workspace tests -- e2e/candidate-flow.spec.ts
```

## Default Seed Accounts

- Admin: `admin@staffinn.local` / `AdminPass123`
- Hotel: `hotel1@staffinn.local` / `HotelPass123`
- Candidate: `candidate1@staffinn.local` / `CandidatePass123`

## Security Highlights

- bcrypt password hashing with 12 rounds
- Access token (15 min) + refresh token rotation (7 days)
- RBAC middleware on protected routes
- Auth route rate limiting (10 req/min)
- Multer file hardening (PDF/DOCX only, max 5MB, traversal checks)
- Helmet + CORS restrictions + compression

## Production Notes

- For real multi-user deployment, switch `DATABASE_URL` to PostgreSQL.
- Keep CV files in protected storage outside public web roots.
- Rotate secrets and review dependency vulnerabilities regularly.
