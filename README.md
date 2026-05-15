# audit-changes — Cycle 1-7

KPI accuracy audit + test infrastructure. Removes all simulated/placeholder data,
wires 85+ KPIs to live Pipedrive sources, adds Blob-backed persistence for
the KPI tag editor, and replaces dead History-tab range pills with real
snapshot diffs.

## What's in the zip

```
KPI_COVERAGE_TRIAGE.md             # per-KPI triage decisions (98 missing → 0)
api/_lib/kpi-config-store.ts       # NEW — Blob persistence for KPI tag config
api/_lib/pipedrive.ts              # +8 time-window aggregates
api/_lib/snapshot.ts               # +11 aggregate fields in snapshot schema
api/config/kpi-tags.ts             # NEW — GET/POST KPI tag config
api/cron/send-briefings.ts         # reads kpiConfig from Blob each run
api/pipedrive/pull.ts              # forwards time-window aggregates
api/snapshots/compare.ts           # NEW — server-side range diff endpoint
package.json                       # +vitest devDep, +test scripts
shared/domain/kpi-configs.ts       # +55 new KPI source mappings
shared/domain/roles.ts             # cleaned RT[role].kpis — only Pipedrive-backed
shared/history/compare.ts          # NEW — pure compareSnapshots + baseline date fn
shared/kpi/resolver.ts             # +10 resolver name-cases, 3 app-internal aggregates
shared/kpi/view.ts                 # +8 time-window fields on PipelineView
src/App.tsx                        # fetchPD bug fix, save bar, History tab wired
src/data/pull-response.ts          # NEW — extracted mapper (testable seam)
tests/                             # 136 tests, all green
  ├─ kpi-config-store.test.ts
  ├─ kpi-coverage.test.ts          # every role KPI resolves to non-fallback
  ├─ pull-response.test.ts         # cycle 1 bug
  ├─ resolver.test.ts
  ├─ seed-data.test.ts             # AUDIT/RALPH/REPS fakes removed
  ├─ snapshot-aggregates.test.ts   # snapshot schema preserves aggregates
  ├─ snapshot-compare.test.ts      # cycle 7 diff fn
  └─ time-window-kpis.test.ts      # cycle 5 time-window KPIs
```

## How to apply (Windows PowerShell)

```powershell
# From your repo root (where you have a clone of Unitea):
Expand-Archive -Path .\audit-changes.zip -DestinationPath .\audit-changes-tmp -Force

# Copy over your working tree
Copy-Item -Path .\audit-changes-tmp\* -Destination . -Recurse -Force

# Install the new dev dependency (vitest)
npm install

# Verify
npm test                # should show: 136 tests passing
npm run build           # should output dist/ cleanly
```

## What got fixed

| # | Problem                                                  | Fix                                                              |
|---|----------------------------------------------------------|------------------------------------------------------------------|
| 1 | `fetchPD` stripped 11 of 14 Pipedrive aggregates         | Extracted `mapPullResponse`, forwards everything                 |
| 2 | `AUDIT_INIT` + `RALPH_INIT` had hardcoded fake rows      | Both arrays now empty at startup                                 |
| 3 | Snapshot omitted aggregates                              | All 19 aggregate fields preserved in PipelineSnapshot            |
| 4 | 98 of 119 role KPIs returned "N/A" — no source wired     | 55 stage-mapped configs + 10 resolver cases + 27 deletes/subs    |
| 5 | Time-window KPIs needed expensive per-deal endpoint       | Computed from already-fetched openDeals/wonDeals (no new HTTP)    |
| 6 | UI KPI tag editor never reached cron                     | Blob round-trip: GET on mount, POST on save, cron reads each run |
| 7 | History range pills did nothing                          | `api/snapshots/compare` endpoint + DiffRow rendering             |

Also: deleted `REPS` dead code (was a placeholder name array, unused).

## Coverage

```
Before:  21 of 119 unique role KPI names resolved to a real Pipedrive source (17.6%)
After:   85 of  85 unique role KPI names resolve (100% — 34 unwired KPIs removed,
                                                  remaining 85 either wired
                                                  or substituted with Pipedrive ones)
```

## Tests (all green)

```
Test Files  8 passed (8)
     Tests  136 passed (136)
```

## What still requires deploy-time setup

- **Vercel env vars**: no new ones required. `BLOB_READ_WRITE_TOKEN` is already
  used by snapshots — same blob, new path (`config/kpi-tags.json`).
- **First save**: on first deploy, KpiMapping shows "Defaults (edits NOT yet
  saved)". Make any edit then click Save to create the blob. Until then cron
  uses bundled KPI_INIT (which is now the canonical mapping anyway).
- **History range comparisons**: need at least 2 snapshot days for any diff,
  more for longer ranges (30 days for month-over-month, etc).

## Known follow-ups (NOT in this zip)

- **Three roles got KPI substitutions** because their original KPIs were all
  non-Pipedrive (HR/payroll/accounting): Office Administrator, Onboarding
  Coordinator, Accounting Manager. Review the substituted KPIs in
  `shared/domain/roles.ts` and adjust if you have specific KPIs in mind.
- `src/App.tsx` is still 1700+ lines (refactor #4 from handoff).
- `KPI_COVERAGE_TRIAGE.md` documents the per-KPI decisions if you want to
  audit any of them.
