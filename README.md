# ScanMitra

ScanMitra is a full-stack diagnostic booking and queue management platform built with Next.js 14.
It supports two roles:

- `USER`: discover diagnostic centers, book slots, track queue status, manage bookings
- `CENTER`: manage services, run live queue operations, handle walk-ins, broadcast delays

## Tech Stack

- `Next.js 14` (App Router) + `TypeScript`
- `Prisma` + `PostgreSQL` (Neon)
- `NextAuth.js` (Credentials-based auth with role support)
- `Socket.io` (real-time queue and delay updates)
- `BullMQ` + `Redis` (background scheduling and queue jobs)
- `Cloudinary` (file uploads for identity proof and reports)
- `Tailwind CSS` + Radix/shadcn-style UI primitives

## Core Features

- Role-based onboarding and dashboards (`USER` / `CENTER`)
- Center profile setup and diagnostic service management
- Slot-based booking with token generation
- Real-time queue tracking (center room + booking room socket events)
- Queue actions: call next, complete, skip/no-show, delay broadcast
- Walk-in patient support
- Uploads via Cloudinary (identity proof + reports)
- Form validation with Zod and stricter email/password constraints

## Performance Optimizations Included

- Prisma query indexing and selective field fetching (`select`)
- Paginated list endpoints (`skip` / `take`)
- Parallelized independent async work with `Promise.all`
- Redis caching for center list, center detail, and slot availability
- Cache invalidation on write paths (center/service/booking updates)
- Room-based socket emits (`io.to(room).emit`) instead of global broadcasts
- Optimistic UI for center queue actions
- Lazy loading for heavy center components
- API cache headers (`Cache-Control`) tuned by endpoint type

## Project Structure (High Level)

- `app/` - routes, pages, API handlers
- `app/api/` - REST-style API routes
- `lib/` - auth, prisma, queue, socket, scheduler, cache utilities
- `components/` - shared, center, and user UI components
- `prisma/` - schema and database model definitions
- `public/` - static assets (logos/images)

## Environment Variables

Copy `.env.example` to `.env` and fill values:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# BullMQ needs TCP Redis URL
REDIS_URL=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_BULLMQ_URL=

# Upstash REST (used for app-level caching)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Local Development

Install dependencies:

```bash
npm install
```

Sync database schema:

```bash
npm run db:push
```

Run development server (custom server for Socket.io support):

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start custom dev server (`tsx server.ts`)
- `npm run dev:next` - start Next.js dev server directly
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - run ESLint
- `npm run db:push` - push Prisma schema to DB
- `npm run db:generate` - generate Prisma client
- `npm run db:studio` - open Prisma Studio

## Notes

- Keep Redis configured for full real-time scheduling + caching performance.
- If Prisma client generation fails on Windows due to file lock, stop running dev server and re-run `npm run db:generate`.
