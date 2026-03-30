# khabbit-api

NestJS backend for the Khabbit carpool app. Deployed on Railway.

## Modules

| Module | Endpoints |
|--------|-----------|
| `auth` | Supabase JWT guard (no custom endpoints) |
| `profiles` | `GET/PUT /api/profile` |
| `vehicles` | `GET/POST/DELETE /api/vehicles` |
| `rides` | `POST /api/rides`, `GET /api/rides/available`, `POST /api/rides/:id/offer` |
| `ride-requests` | `POST /api/ride-requests`, `GET /api/ride-requests/:id/matches` |
| `ride-matches` | `POST /api/ride-matches/:id/accept`, `POST /api/ride-matches/:id/payment` |
| `notifications` | Expo push notification service (internal) |
| `analytics` | PostHog interceptor + event service (internal) |

## Setup

```bash
cp .env.example .env          # fill in your keys
npm install
npm run start:dev             # http://localhost:3000
```

## Deploy to Railway

1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Railway auto-deploys on push to `main`
