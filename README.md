# StaffInn

StaffInn is our recruitment platform project for the hospitality and tourism field. The idea is simple: candidates can build a profile and apply to offers, hotels can publish offers and browse candidates, and admins can manage the platform.

This repo is a monorepo with a React/Electron client, an Express API, a Prisma database layer, and a separate test workspace.

## What we used

- **Frontend:** React + Vite
- **Desktop shell:** Electron
- **Backend:** Node.js + Express
- **Database:** Prisma + SQLite
- **Validation:** Zod
- **Authentication:** JWT access token + refresh token in httpOnly cookie
- **Testing:** Vitest, Supertest, Playwright

## Features by role

### Admin

- Manage users (list, update role/status, delete)
- Create users manually (HOTEL / CANDIDATE / ADMIN)
- Moderate offers (approve/reject/close)
- View moderation history for offers
- Access and manage reports (list, detail, create, update status/resolution)
- Edit candidate and hotel profile data from admin side

### Hotel (Recruiter)

- Create, update, and delete job offers
- View all applications for hotel offers
- Update application status (ex: pending/interview/accepted/rejected)
- Browse/search candidate profiles with filters (skills, experience, position)
- Create applications directly for a candidate on a hotel offer
- Access candidate CV files (when available)

### Candidate

- Create and update profile (name, skills, position, experience)
- Upload CV (PDF/DOCX)
- Browse/search job offers with filters and sorting
- Apply to active offers
- View own applications and application statuses

## Project structure

```text
StaffInn/
├── client/     # React app + Electron desktop shell
├── server/     # Express API + Prisma schema/seed
├── shared/     # Shared schemas and types
├── tests/      # Unit, integration, security, and e2e tests
└── .env.example
```



# Before you run it

### 1) Install dependencies

```bash
npm install
```

### 2) Create your env file

Copy the example file:

```bash
cp .env.example .env
```

Make sure your `.env` has at least these variables:

- `PORT`
- `CLIENT_ORIGIN`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_TTL`
- `REFRESH_TOKEN_TTL_DAYS`
- `COOKIE_SECURE`
- `VITE_API_BASE_URL`

## Database setup

The easiest way is:

```bash
npm run db:setup
```

That command will:

- generate the Prisma client
- push the schema to the database
- run the seed script

If you want to do it step by step:

```bash
npm run prisma:generate --workspace server
npx prisma db push --schema server/prisma/schema.prisma
npm run prisma:seed --workspace server
```

## Running the project

### Web mode

This starts the backend and the React client together:

```bash
npm run dev
```

### Desktop mode

This starts the backend, the React client, and the Electron shell:

```bash
npm run dev:desktop
```

## Linux note for Electron

If Electron fails with something like `libnspr4.so` missing, install these packages:

```bash
sudo apt update
sudo apt install -y libnss3 libnspr4 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libgtk-3-0
```

Then run again:

```bash
npm run dev:desktop
```

## Seed accounts

After seeding, you can use these accounts:

- **Admin:** `admin@staffinn.local` / `AdminPass123`
- **Hotel:** `hotel1@staffinn.local` / `HotelPass123`
- **Candidate:** `candidate1@staffinn.local` / `CandidatePass123`


### Shared / platform-wide

- Authentication with access + refresh token flow
- Role-based access control on protected routes
- Validation with shared Zod schemas
- Offer/candidate search with pagination and caching

## Security / production notes

This is still a student project, but we still tried to keep some good practices:

- passwords are hashed with bcrypt
- protected routes use role-based access control
- refresh tokens are stored in cookies
- uploads are restricted to allowed file types
- input validation is handled with Zod

If this ever became a real production project, the main next steps would be:

- move from SQLite to PostgreSQL
- review deployment secrets properly
- improve logging and monitoring
- harden the upload/storage side more
