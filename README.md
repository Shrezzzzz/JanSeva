# JanSeva 🏛️

> *Jan = People | Seva = Service*
> **Report. Verify. Resolve. Together.**

A citizen-powered civic issue reporting platform for Indian cities — built with AI-assisted categorization, community verification, real-time tracking, and gamified engagement.

---

## What It Does

JanSeva lets citizens report infrastructure problems (potholes, broken streetlights, water leaks, sewage overflow, waste dumping) using their phone camera. The platform:

- **Auto-categorizes** your photo using Groq + LLaMA 3 Vision in under 2 seconds
- **Detects duplicates** before a report is created, reducing noise
- **Geo-pins** every issue on a live interactive map
- **Community verifies** — 10 upvotes auto-escalates an issue to the municipality
- **Tracks resolution** through a 6-stage pipeline with a full audit timeline
- **Gamifies civic action** — XP, badges, leaderboards, streaks
- **Predicts** monsoon-season hotspots and weekend failure patterns using aggregated AI insights

---

## AI Features (Groq + LLaMA 3)

| Feature | Model | Description |
|---|---|---|
| Photo categorization | `llama-3.2-11b-vision-preview` | Identifies issue type, severity, department from a photo |
| Text categorization | `llama-3.3-70b-versatile` | Same from description text |
| Duplicate detection | `llama-3.3-70b-versatile` | Prevents repeat submissions for nearby issues |
| Predictive insights | `llama-3.3-70b-versatile` | 3 data-backed action recommendations for authorities |
| Comment sentiment | `llama-3.3-70b-versatile` | Flags frustrated/urgent comments for auto-escalation |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| State | Zustand |
| Maps | Leaflet.js + OpenStreetMap (CartoDB Voyager tiles) |
| Charts | Recharts |
| AI | Groq API (llama-3.3-70b + llama-3.2-11b-vision) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| File Storage | Cloudinary |
| Auth | JWT (bcryptjs) |
| PWA | vite-plugin-pwa + Workbox |

---

## Project Structure

```
janseva/
├── src/                    # React frontend
│   ├── components/         # UI, layout, hero, roadmap, report, map, issue, dashboard, gamification, auth
│   ├── pages/              # LandingPage, ReportPage, MapPage, TrackPage, DashboardPage, GamificationPage, AdminPage, ProfilePage
│   ├── hooks/              # useGeolocation, useGroqAI, useIssues, useAuth, useUpvote …
│   ├── services/           # api, groq, issueService, authService, uploadService, analyticsService
│   ├── store/              # Zustand: authStore, issueStore, mapStore, uiStore
│   ├── types/              # issue.types, user.types, api.types, map.types
│   ├── utils/              # formatters, validators, geoUtils, xpCalculator, constants, mockData
│   └── config/             # env, groqConfig, routes
├── backend/
│   ├── src/
│   │   ├── routes/         # auth, issues, upload, analytics, ai, users
│   │   ├── controllers/    # authController, issueController, aiController, analyticsController
│   │   ├── middleware/     # auth (JWT), rateLimit, upload (multer), errorHandler
│   │   ├── services/       # groqService, geoService, xpService, notificationService
│   │   └── utils/          # logger, validators, seedData (50+ demo issues)
│   └── prisma/
│       └── schema.prisma   # User, Issue, Comment, Timeline, Notification
└── public/                 # PWA manifest, icons
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use a free [Neon](https://neon.tech) / [Supabase](https://supabase.com) instance)
- A free [Groq API key](https://console.groq.com)

### 1 — Clone and install

```bash
git clone https://github.com/your-username/janseva
cd janseva

# Frontend deps
npm install

# Backend deps
cd backend && npm install && cd ..
```

### 2 — Configure environment

```bash
cp .env.example .env
# Edit .env and add:
#   VITE_GROQ_API_KEY=gsk_...
#   DATABASE_URL=postgresql://...
#   JWT_SECRET=<long random string>
#   GROQ_API_KEY=gsk_...
```

### 3 — Set up the database

```bash
cd backend
npx prisma migrate dev --name init   # create tables
npm run db:seed                       # seed 50 demo issues
cd ..
```

### 4 — Run (two terminals)

```bash
# Terminal 1 — Frontend
npm run dev          # http://localhost:5173

# Terminal 2 — Backend
cd backend
npm run dev          # http://localhost:3001
```

---

## Demo Credentials

After running `npm run db:seed`:

| Role | Email | Password |
|---|---|---|
| Citizen | `citizen1@janseva.in` | `Demo@1234` |
| Authority | `authority@janseva.in` | `Demo@1234` |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create citizen account |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET` | `/api/auth/me` | Current user profile |
| `GET` | `/api/issues` | List issues (filters, pagination) |
| `POST` | `/api/issues` | Report new issue |
| `GET` | `/api/issues/:id` | Issue detail with timeline |
| `PATCH` | `/api/issues/:id/status` | Update status (authority) |
| `POST` | `/api/issues/:id/upvote` | Verify an issue |
| `POST` | `/api/issues/:id/comments` | Add comment |
| `GET` | `/api/issues/map` | Issues in bounding box |
| `GET` | `/api/issues/nearby` | Issues within radius |
| `POST` | `/api/upload` | Upload media (Cloudinary) |
| `GET` | `/api/analytics/summary` | City-wide stats |
| `GET` | `/api/analytics/insights` | AI-generated insights |
| `GET` | `/api/analytics/leaderboard` | Top citizens |
| `POST` | `/api/ai/categorize` | Groq text categorization |
| `POST` | `/api/ai/sentiment` | Comment sentiment analysis |
| `GET` | `/api/events` | SSE stream for live issue feed |

---

## Key Design Decisions

**Frontend-first demo mode** — every page falls back to rich mock data when the backend is unavailable, making it safe to demo without a live database.

**Groq over OpenAI** — sub-2s inference on LLaMA 3 means photo categorization feels instant in the report flow.

**Leaflet over Mapbox** — zero cost, no token required for hackathon demoing. Swap the tile URL in `constants.ts` for CartoDB Voyager (already configured).

**Zustand over Redux** — minimal boilerplate for a focused hackathon codebase.

**CSS custom properties + Tailwind** — design tokens in CSS variables mean the colour system is editable in one file (`theme.css`).

---

*Built with ❤️ for civic-minded communities across India.*
