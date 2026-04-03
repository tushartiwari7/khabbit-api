# khabbit-api

NestJS backend for the Khabbit carpool app. Deployed on Railway.

## Stack

- **NestJS** + TypeScript
- **Neon PostgreSQL** + PostGIS (via Drizzle ORM)
- **Firebase Admin** (auth token verification)
- **Socket.IO** (realtime chat)
- **Expo Push** (notifications)
- **PostHog** (analytics)

## Modules

| Module | Endpoints |
|--------|-----------|
| `auth` | Firebase JWT guard (no custom endpoints) |
| `profiles` | `GET/PUT /api/profile`, `POST /api/profile/signup` |
| `vehicles` | `GET/POST/DELETE /api/vehicles` |
| `rides` | `POST /api/rides`, `GET /api/rides/available`, `POST /api/rides/:id/offer` |
| `ride-requests` | `POST /api/ride-requests`, `GET /api/ride-requests/:id/matches` |
| `ride-matches` | `POST /api/ride-matches/:id/accept`, `POST /api/ride-matches/:id/payment` |
| `chat` | Socket.IO gateway (`joinRoom`, `sendMessage`, `leaveRoom`) |
| `notifications` | Expo push notification service (internal) |
| `analytics` | PostHog interceptor + event service (internal) |

## Setup

```bash
cp .env.example .env          # fill in your keys
npm install
npm run db:push               # push Drizzle schema to Neon
npm run start:dev             # http://localhost:3000
```

## Database Migrations

```bash
npm run db:generate           # generate SQL from schema changes
npm run db:migrate            # apply migrations
npm run db:studio             # open Drizzle Studio
```

## Deploy to Railway

1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Railway auto-deploys on push to `main`
