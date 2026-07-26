# HabitShield Cybersecurity Suite

A professional web-based cybersecurity dashboard that scans for sensitive data in screenshots, computes file hashes, and detects SMS phishing — built as a college final-year portfolio project.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/habitshield run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, TanStack Query, wouter, framer-motion
- API: Express 5 + multer (file uploads)
- DB: PostgreSQL + Drizzle ORM (`scan_events` table)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/scan_events.ts` — DB schema for scan history
- `artifacts/api-server/src/routes/scan.ts` — All scan endpoint handlers
- `artifacts/habitshield/src/` — Frontend app
  - `pages/dashboard.tsx` — Stats + activity feed
  - `pages/screenshot-scanner.tsx` — Image PII scanner
  - `pages/file-scanner.tsx` — SHA-256 file hasher
  - `pages/sms-scanner.tsx` — SMS phishing detector
  - `pages/history.tsx` — Activity log

## Features

- **Screenshot Scanner** — Upload any image; detects emails, phone numbers (IN & US), and credit card patterns via regex on file content
- **File Hash Scanner** — Upload any file (up to 10MB); computes SHA-256 hash with one-click copy
- **SMS Phishing Analyzer** — Paste any SMS; classifies as safe / suspicious / scam based on keyword detection with triggered keyword highlighting
- **Dashboard** — Real-time stats: total scans, threats found, clean scans, breakdown by type, recent activity feed
- **Activity Log** — Paginated table of all past scans with type, status, and timestamp

## Architecture decisions

- File uploads handled with multer (in-memory, no disk I/O) — server computes hash/scans in memory and discards the buffer
- All scan results persisted to `scan_events` table so the dashboard always reflects real data
- Multipart form uploads use raw `fetch` with FormData rather than generated Orval hooks (Orval doesn't generate correct multipart clients)
- Dark cybersecurity theme applied entirely via CSS custom properties — no hardcoded colors in components

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always re-run `pnpm --filter @workspace/api-spec run codegen` after editing `lib/api-spec/openapi.yaml`
- File upload max is 10MB (set in multer config in `scan.ts`)
