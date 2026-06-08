# Known Issues Backlog

This file tracks known issues and future work that are not part of the active PRD scope. Keep this list current as diagnostics reveal new problems or as issues are resolved.

## How To Use This File

- Add new issues when a problem is observed but is outside the current PRD.
- Move resolved items to the "Resolved History" section with the date and evidence.
- If an item becomes active work, create or reference the PRD/GitHub issue and mark the status as `promoted`.
- Do not use this file as a substitute for acceptance criteria inside active PRDs.

## Open Issues

| ID | Area | Priority | Status | Issue | Evidence | Suggested Next Step |
|---|---|---:|---|---|---|---|
| KI-001 | Runtime configuration | High | open | Live data connections may still have missing or incorrect environment parameters. | User reported remaining connection/data parameter issues after PRD-5. Deployed UI is Google-auth gated, so deeper verification needs an authenticated session. | Run a focused diagnostics pass for `/api/auth/me`, `/api/pipedrive/pull`, `/api/cron/status`, and required Vercel env vars. Document exact missing or invalid keys without exposing secrets. |
| KI-002 | Pipedrive integration | High | open | Need a repeatable read-only Pipedrive drift check after ADR-003. | ADR-003 says `BOARDS` mirrors live Pipedrive byte-for-byte, but live drift requires `scripts/pipedrive-inspect.ts` or equivalent. Current tests are pure-data and do not hit Pipedrive. | Add a read-only operator runbook and, if safe, a script command that reports live pipeline/stage drift without writing to Pipedrive. |
| KI-003 | Lint debt | Medium | open | Full `npm run lint` fails on existing repo-wide lint debt. | Latest run reported 743 problems across existing files including `src/App.tsx`, `api/_lib/pipedrive.ts`, `api/cron/send-briefings.ts`, `refactor-changes`, and older tests. PRD-5 and helper-slice changed files passed targeted ESLint. | Create a separate lint-hardening PRD or issue. Consider excluding archival `refactor-changes` from lint before fixing active source files. |
| KI-004 | Package lock line endings | Low | open | `package-lock.json` is marked modified after `npm install` with no content diff. | `git diff -- package-lock.json` shows only line-ending warnings, not semantic content changes. | Normalize line endings or reset the file after confirming no dependency changes are needed. Avoid committing lockfile churn unless content changes are intentional. |
| KI-005 | App architecture | High | in progress | `src/App.tsx` remains too large for safe feature work. | After the first PRD-3 helper extraction, `src/App.tsx` is still 1,673 lines. | Continue PRD-3 by extracting shared atoms/theme/helpers and then tab components in small tested slices. |
| KI-006 | Time-window logic | Medium | open | Time-window KPI arithmetic still lives in `api/_lib/pipedrive.ts` instead of a dedicated tested module. | PRD-3 calls for a `time-window.ts` deep module with DST, week boundary, month boundary, year boundary, and ET/UTC tests. Current tests cover resolver aggregate fields but not the full date arithmetic module. | Extract date-window calculations into a focused module with injectable clock tests before adding more time-window KPIs. |
| KI-007 | ADR-001 implementation | Medium | queued | Confirm-before-live behavior is not implemented. | ADR-001 docs exist, but no `ConfirmActionModal` or `confirmSuppress` module exists. | Keep blocked until PRD-3 tab split reduces Setup tab risk. Then implement confirmation gates for live-affecting actions. |
| KI-008 | ADR-002 implementation | Medium | queued | RALPH automated loop is not implemented. | ADR-002 docs exist, but no `LogIssueModal`, RALPH API routes, `ralph-store`, or `claude-client` module exists. | Keep blocked until PRD-3 tab split reduces RALPH tab risk. Confirm `ANTHROPIC_API_KEY` availability before implementation. |
| KI-009 | GitHub issue publishing | Low | open | Local `gh` CLI is not authenticated. | `gh issue list` failed with an auth prompt. PRDs are currently local Markdown files unless published through the connector or authenticated CLI. | Authenticate `gh` or use the GitHub connector to create/update issues for PRD-5 and future backlog items. |
| KI-010 | Vercel deployment verification | Medium | open | Deployed app shell is reachable, but authenticated UI flows were not verified. | Vercel fetch returned HTTP 200 for `https://unicity-kpi.vercel.app`, and the bundle shows the Google sign-in gate. | Use Stephen's signed-in browser session to verify live dashboard tabs, Pipedrive pull behavior, auth callback, and cron status UI. |
| KI-011 | Legacy compatibility aliases | Low | open | Resolver still contains a direct case for `Pipeline deals active`. | Role-facing assignments now use canonical names, and `KpiCatalog` resolves aliases. The resolver case remains for backward compatibility with stored configs or old UI state. | Decide later whether to keep compatibility indefinitely or migrate persisted configs and remove direct resolver alias cases. |
| KI-012 | Archived `refactor-changes` folder | Low | open | `refactor-changes` appears to contain archival source copies that participate in lint failures. | Full lint output includes many errors under `refactor-changes`. | Decide whether `refactor-changes` should be deleted, moved outside source control, or excluded from lint and builds. |

## Watch Items

| ID | Area | Watch Item | Trigger To Promote |
|---|---|---|---|
| KW-001 | Security | npm install reported 10 audit findings, including 4 moderate and 6 high. | Promote if a vulnerable package is reachable in production or if CI/security policy requires immediate remediation. |
| KW-002 | Pipedrive scripts | PRD-1 write scripts remain in the repo as maintenance/backstop tools. | Promote if operators need a new board or if scripts create confusion about ADR-003 source-of-truth behavior. |
| KW-003 | Persistent KPI config | Retired aliases may still exist in Vercel Blob-stored KPI config from before canonicalization. | Promote if UI or cron reads persisted configs that reintroduce retired aliases or fail validation. |

## Resolved History

No resolved backlog items yet.
