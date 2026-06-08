# Claude Browser Agent -- Session Context

## Role
Drives Stephen's signed-in browser. Verifies deployed features.
Ships code inline via PowerShell writes each session.

## Repo
ProfessionalStephen/Unitea

## What This Is
Morning KPI briefing system for Unicity Solar Energy. Vercel-deployed Vite
React SPA plus serverless API that:

- Pulls live pipeline data from Pipedrive at 6am ET weekdays.
- Generates personalized HTML briefing emails for up to 30 team members.
- Serves the dashboard at https://unicity-kpi.vercel.app.

## Key Constraints

- Vercel free tier: serverless functions, Vercel Blob, no database.
- Auth: Google OAuth sign-in, CRON_SECRET for cron auth.
- Deployed UI is Google-auth gated; deeper manual verification needs Stephen's signed-in browser.
- Windows PowerShell is the normal local shell.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite 8 |
| Backend | Vercel serverless with @vercel/node |
| Email | Gmail API via OAuth2 |
| Pipeline data | Pipedrive REST API |
| Persistence | Vercel Blob for KPI config and daily snapshots |
| Auth | Google OAuth and CRON_SECRET |
| Tests | Vitest |

## Repo Layout

```text
api/
  _lib/                 # pipedrive.ts, kpi-config-store.ts, snapshot.ts
  cron/                 # send-briefings.ts, status.ts
  email/ pipedrive/ snapshots/ auth/ config/
shared/
  domain/               # boards, roles, team, KPI config/catalog assignments
  history/ kpi/
src/                    # React frontend; App.tsx split is still queued
tests/
docs/
  adr/
  agents/
```

## Current State (2026-06-02)

- Deployed site: https://unicity-kpi.vercel.app returns HTTP 200 and serves the Vite app.
- ADR-003 is the active Pipedrive decision: `shared/domain/boards.ts` mirrors live Pipedrive byte-for-byte, including trailing spaces, casing drift, and `[SIC]` strings.
- Do not create or rename Pipedrive pipelines from the old PRD-1 path unless Stephen explicitly approves a new board-addition request.
- `docs/PRD-5-rebaseline-foundations.md` defines the current foundation rebaseline.
- `shared/domain/kpi-catalog.ts` owns canonical KPI lookup and retired alias resolution.
- `shared/domain/role-assignments.ts` owns canonical role KPI lookup and orphan validation.
- `src/App.tsx` is still a large monolith and should be split before ADR-001/ADR-002 feature implementation.

## Known Notes

- `aparis@unicitysolar.com` appears twice: Warehouse Manager and AI Engineer. Both roles are intentional; email send dedupes recipients.
- The old PRD-1 scripts remain maintenance/backstop tools. They are not the active path for current Pipedrive alignment.

## Queued Work

1. [done] aparis dedup, pin @vercel/node, CI workflow.
2. [done] PRD-1 implementation artifacts.
3. [done] ADR-003 strict Pipedrive mirror supersedes original PRD-1 build-pipelines path.
4. [in progress] PRD-5 foundation rebaseline: KPI catalog, role assignments, canonical aliases, context cleanup.
5. PRD-3 App.tsx split and time-window extraction.
6. PRD-4 ADR-001 confirm-before-live implementation.
7. PRD-4 ADR-002 RALPH automated loop implementation.
