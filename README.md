# Assiut Metals Technical School — Management System

Full-stack bilingual (Arabic/English) school management platform.

- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind, next-intl, TanStack Query, Framer Motion)
- **Backend**: Go + Gin + PostgreSQL + Redis
- **Roles**: admin, teacher, student, parent — each with its own portal.

---

## Architecture

```
frontend/   Next.js app           → http://localhost:3000
backend/    Go API (Gin)          → http://localhost:8080/api/v1
            ├ internal/delivery/http   HTTP handlers
            ├ internal/usecase         business logic (services)
            ├ internal/repository      data access
            ├ internal/domain          models
            ├ internal/auth            JWT + refresh-token denylist
            ├ internal/middleware      auth, rate limiting, security headers
            └ pkg/{database,email,redis,logger}
PostgreSQL  primary datastore
Redis       rate limiting + refresh-token revocation (optional; degrades gracefully)
```

---

## Prerequisites

- Go 1.25+
- Node.js 20+
- PostgreSQL 14+
- Redis 7+ (optional — the app runs without it, losing rate limiting & token revocation)
- Docker + Docker Compose (optional, for the containerized stack)

---

## Environment configuration

**Never commit real secrets.** `.env` files are git-ignored; copy the examples and fill them in.

```bash
cp backend/.env.example backend/.env      # then edit
cp .env.example .env                       # root (used by docker-compose)
# frontend/.env.local already holds non-secret public config
```

Critical variables (see `backend/.env.example` for the full list):

| Var | Notes |
|-----|-------|
| `JWT_SECRET` | **Required in production.** Must be unique and ≥32 chars. The server refuses to start with `ENV=production` if it is empty, too short, or a known placeholder. Generate: `openssl rand -base64 48`. |
| `DB_*` | PostgreSQL connection. |
| `REDIS_ADDR` / `REDIS_PASSWORD` | Optional. |
| `SMTP_*` | Mailer. Set `SMTP_PASSWORD=mock` to print emails to stdout in dev. |
| `CONTACT_INBOX` | Inbox for contact-form submissions (defaults to `SMTP_USER`). |
| `FRONTEND_URL` | CORS allow-list origin. |

**Secret rotation:** to rotate `JWT_SECRET`, update the env and restart — all existing access/refresh tokens become invalid (users must log in again). Rotate `DB_PASSWORD` / `SMTP_PASSWORD` at the provider, then update the env.

---

## Running locally

### Backend
```bash
cd backend
go run ./cmd/server          # runs migrations automatically, seeds demo data if DB empty
```

### Seed demo data (optional, explicit)
```bash
cd backend
go run ./cmd/seed
```
Demo accounts (password shown): `admin@school.com` / `Admin@123`, `teacher@school.com` / `Teacher@123`, `student@school.com` / `Student@123`, `parent@school.com` / `Parent@123`.

### Frontend
```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000
```

### Docker (full stack)
```bash
docker-compose up --build
```

---

## Testing

### Backend
```bash
cd backend
go build ./... && go vet ./... && go test ./...
```

### Frontend
```bash
cd frontend
npm run type-check          # tsc --noEmit
npm run test                # vitest unit/component tests
npm run lint
npm run build
```

### End-to-end (Playwright) — requires a running stack
```bash
cd frontend
npx playwright install --with-deps   # one-time
# with backend on :8080 (seeded) and frontend on :3000:
npm run e2e
```

---

## Security notes

- **Auth**: stateless JWT access tokens (15 min) + refresh tokens (7 d). Logout and `/auth/refresh` consult a Redis-backed refresh-token denylist keyed by the token's `jti`, giving real server-side revocation.
- **Authorization**: route groups are role-gated (`/admin/*`, `/teacher/*`, `/student/*`, `/parent/*`). Parent endpoints additionally verify the parent is linked to the requested student via `parent_students` (prevents IDOR).
- **CSRF**: not applicable — the API is a stateless Bearer-token SPA (no cookie-based session for state-changing calls) and CORS is locked to `FRONTEND_URL`. Auth is never read from a cookie.
- **Rate limiting**: global per-IP (Redis) plus a stricter per-IP limiter on auth endpoints.
- **Headers**: HSTS (prod), `X-Frame-Options: DENY`, `nosniff`, referrer policy, permissions policy.
- **Soft deletes**: core owner entities (users, students, teachers, parents, grades, subjects, books) are soft-deleted (`deleted_at`) so historical/transactional rows are preserved; deleted users can no longer authenticate.
- **Provisioned accounts**: admin-created users get a cryptographically-random temporary password (returned once) and are flagged `must_change_password`.
