# GitHub Issue 5: Rebaseline Foundations Before Feature Implementation

**Title:** `Rebaseline Pipedrive source-of-truth + finish KPI catalog and role assignment cleanup`
**Labels to apply:** `ready-for-agent`

---

## Problem Statement

The first four PRDs were written before the latest repository state changed. The repo now contains PRD-1 implementation artifacts and the newer ADR-003 decision that supersedes the original PRD-1 direction. PRD-2 was partially implemented in config, but its deeper catalog and role-assignment modules were not created. PRD-3 and PRD-4 are still queued, but implementing ADR-001 or ADR-002 against the current state would add feature work on top of stale assumptions, duplicate KPI names, and a 1,788-line `src/App.tsx`.

The next implementation step needs to rebaseline the foundation before starting the tab refactor or RALPH/confirmation features. Operators and future agents need one current source of truth for Pipedrive alignment, KPI canonical names, role KPI assignments, and implementation order.

## Current-State Evidence

- Latest cloned repo: `ProfessionalStephen/Unitea` on `main`.
- Deployed website: `https://unicity-kpi.vercel.app` returns HTTP 200 and serves a Vite app bundle. The bundle includes the Google sign-in gate, so deeper UI verification requires an authenticated browser session.
- `docs/adr/ADR-003-strict-pipedrive-mirror.md` is accepted and explicitly supersedes the original PRD-1 pipeline-creation intent.
- `shared/domain/boards.ts` contains 17 strict Pipedrive mirror boards, including intentional trailing spaces, casing drift, and `[SIC]` comments.
- `shared/domain/roles.ts` already assigns KPIs to Office Administrator, Onboarding Coordinator, and Accounting Manager, but the assignments do not fully match PRD-2.
- `shared/domain/kpi-configs.ts` still includes duplicate KPI aliases.
- No `shared/domain/kpi-catalog.ts` exists.
- No `shared/domain/role-assignments.ts` exists.
- `src/App.tsx` is still 1,788 lines.
- No ADR-001/ADR-002 implementation files exist for `ConfirmActionModal`, `confirmSuppress`, `LogIssueModal`, RALPH APIs, `ralph-store`, or `claude-client`.

## Solution

Create a foundation rebaseline pass that makes the repository internally consistent before feature implementation begins. This pass documents that ADR-003 is now the Pipedrive source-of-truth decision, finishes the PRD-2 catalog and role-assignment architecture, removes duplicate KPI aliases from role-facing assignments, updates tests that still describe the old pipeline-creation assumption, and records the revised implementation sequence in `CONTEXT.md`.

End state: future implementation agents can start PRD-3 with a clean KPI domain model and can start PRD-4 only after the App tab split is complete.

## User Stories

1. As an operator, I want the project docs to say clearly that Pipedrive is the source of truth, so no agent creates unnecessary production CRM pipelines.
2. As an operator, I want every role-facing KPI name to be canonical, so dashboards and emails do not show duplicate metrics under different names.
3. As an operator, I want Office Administrator, Onboarding Coordinator, and Accounting Manager to have the exact PRD-approved KPI lists, so their email KPI sections are useful and consistent.
4. As a future agent, I want `KpiCatalog.findByName(alias)` to resolve aliases to canonical KPI definitions, so call sites do not each maintain their own alias logic.
5. As a future agent, I want `RoleAssignments.kpisForRole(role)` to return canonical KPI names only, so tests can catch stale aliases and orphan references.
6. As a future agent, I want tests and comments to stop referring to the old "post-setup Pipedrive pipelines" model, so the regression net matches ADR-003.
7. As a future agent, I want `CONTEXT.md` to show the revised implementation order, so PRD-4 work does not start before PRD-3's App split.

## Implementation Decisions

- **PRD-1 is retired as originally written.** ADR-003 is the active decision: code mirrors live Pipedrive byte-for-byte. Do not create pipelines unless a future explicit board-addition request is approved.
- **Keep PRD-1 scripts as maintenance tools for now.** `scripts/pipedrive-setup.ts`, `scripts/pipedrive-classify-deals.ts`, and `scripts/pipedrive-migrate-deals.ts` stay in the repo, but docs must label them as maintenance/backstop scripts, not the current implementation path.
- **Create `shared/domain/kpi-catalog.ts`.** It owns canonical KPI definitions, alias mapping, and lookup behavior.
- **Create `shared/domain/role-assignments.ts`.** It owns role KPI lookup and assignment validation. Existing callers can keep using `roles.ts` exports during the first pass, but new tests should verify the new module.
- **Canonical KPI names:**
  - Keep `Total active jobs`; alias `Pipeline deals active`.
  - Keep `Material orders pending`; alias `Material ordered pending`.
  - Keep `HOA approvals pending`; alias `HOA pending approvals`.
  - Keep `Net metering pending`; alias `Net metering backlog`.
- **Role-facing KPI arrays use canonical names only.** Aliases may resolve through `KpiCatalog.findByName`, but `RT[role].kpis` and `RoleAssignments.kpisForRole(role)` should not return aliases.
- **PRD-2 role list corrections:**
  - Office Administrator gets `Funding pipeline value`, `M1 invoices needed`, `M2 invoices needed`, `Missing NTP count`, `Cancellations this week`.
  - Onboarding Coordinator gets `New deals this week`, `Site surveys scheduled`, `Site surveys to schedule`, `Missing NTP count`, `Deals sent to engineering`.
  - Accounting Manager gets `Funding pipeline value`, `M1 invoices needed`, `M2 invoices needed`, `M3 invoices needed`.
- **The 27 non-Pipedrive KPIs stay removed.** HR, Telephony, Accounting, payroll, and other external-system metrics remain out of scope until those data sources are explicitly added.
- **Do not start the App tab split in this PRD.** This PRD prepares the domain model and docs for PRD-3.
- **Do not implement ADR-001 or ADR-002 in this PRD.** PRD-4 remains blocked until PRD-3 splits `App.tsx`.

## Modules

- **New module:** `shared/domain/kpi-catalog.ts`
  - Exports `KpiCatalog.list(): KpiTag[]`.
  - Exports `KpiCatalog.findByName(name: string): KpiTag | null`.
  - Exports `KpiCatalog.canonicalName(name: string): string | null`.
  - Exports `KpiCatalog.aliases(): Record<string, string>`.
  - Reads from the existing `KPI_INIT` canonical list.
- **New module:** `shared/domain/role-assignments.ts`
  - Exports `RoleAssignments.kpisForRole(role: string): string[]`.
  - Exports `RoleAssignments.validateAssignments(): OrphanRef[]`.
  - Exports `RoleAssignments.rolesUsingKpi(name: string): string[]`.
  - Uses `RT` plus `KpiCatalog` to validate canonical coverage.
- **Modified:** `shared/domain/kpi-configs.ts`
  - Remove duplicate alias entries from the canonical `KPI_INIT` list.
  - Keep comments showing retired aliases and their canonical replacement.
- **Modified:** `shared/domain/roles.ts`
  - Update the three PRD-2 roles to the corrected KPI lists.
  - Replace alias names in every role KPI list with canonical names.
  - Keep `boardsForRole` stable.
  - Either delegate `kpisForRole` to `RoleAssignments` or preserve the export with equivalent canonical behavior to avoid circular imports.
- **Modified:** `tests/board-coverage.test.ts`
  - Update comments so the test describes ADR-003 strict mirror behavior, not post-setup pipeline creation.
- **New tests:** `tests/kpi-catalog.test.ts`
  - Cover canonical lookup, alias lookup, unknown lookup, and canonical-only list output.
- **New tests:** `tests/role-assignments.test.ts`
  - Cover corrected PRD-2 role lists, no alias leakage, no orphan KPI refs, and injected orphan detection.
- **Modified:** `tests/kpi-coverage.test.ts`
  - Keep the existing coverage contract, but make it rely on canonical names from role assignments.
- **Modified:** `CONTEXT.md`
  - Add ADR-003 as the active Pipedrive decision.
  - Add the revised implementation order: PRD-5 foundation rebaseline, PRD-3 App split, PRD-4 ADR features.
  - Note that deployed UI is Google-auth gated for manual verification.

## Testing Decisions

- A good test asserts behavior visible to operators or calling modules, not internal implementation order.
- `KpiCatalog.findByName("Pipeline deals active")` returns the same canonical KPI as `KpiCatalog.findByName("Total active jobs")`.
- `KpiCatalog.list()` returns canonical KPI definitions only and does not include retired aliases.
- `RoleAssignments.kpisForRole("Office Administrator")` returns exactly five canonical names.
- `RoleAssignments.kpisForRole("Onboarding Coordinator")` returns exactly five canonical names.
- `RoleAssignments.kpisForRole("Accounting Manager")` returns exactly four canonical names.
- `RoleAssignments.validateAssignments()` returns `[]` for the shipped state.
- An injected orphan KPI reference is reported with role name and KPI name.
- No `RT[role].kpis` array contains retired alias names.
- `tests/board-coverage.test.ts` continues to pass and now documents strict mirror drift detection.
- Existing tests remain green with `npm test`.
- Build remains green with `npm run build`.

## Out of Scope

- Creating, deleting, or renaming Pipedrive pipelines or stages.
- Running live Pipedrive write scripts.
- Changing `api/_lib/pipedrive.ts` resolver behavior except for imports needed by the new catalog.
- Splitting `src/App.tsx` into tab components.
- Implementing confirmation modals, session suppression, RALPH issue persistence, Claude analysis, or RALPH APIs.
- Adding HR, Telephony, payroll, Accounting, or other non-Pipedrive data sources.
- Creating synthetic production deals.

## Implementation Order

1. Update docs and tests to recognize ADR-003 as the active Pipedrive decision.
2. Add `KpiCatalog` tests for canonical and alias behavior.
3. Add `KpiCatalog` implementation.
4. Add `RoleAssignments` tests for corrected PRD-2 role lists and validation behavior.
5. Add `RoleAssignments` implementation.
6. Update `roles.ts` KPI arrays to canonical names and corrected PRD-2 assignments.
7. Remove duplicate alias entries from `KPI_INIT` while preserving alias lookup in `KpiCatalog`.
8. Update `kpi-coverage` and board coverage comments to match the new model.
9. Update `CONTEXT.md` with the current decision chain and implementation order.
10. Run `npm test` and `npm run build`.

## Acceptance Criteria

- ADR-003 is documented as superseding the original PRD-1 pipeline-build path.
- No role-facing KPI assignment uses one of the four retired aliases.
- `KpiCatalog` resolves both canonical names and retired aliases.
- `RoleAssignments` returns canonical KPI names and validates without shipped-state orphans.
- Office Administrator, Onboarding Coordinator, and Accounting Manager match the corrected PRD-2 assignments exactly.
- Board coverage docs/tests describe strict Pipedrive mirror behavior.
- `CONTEXT.md` contains the updated implementation sequence.
- `npm test` passes.
- `npm run build` passes.

## Further Notes

- This PRD is intentionally smaller than PRD-3 and PRD-4. It creates the clean foundation those PRDs need.
- PRD-3 should be the next implementation PRD after this one: split `src/App.tsx`, extract shared atoms/theme/helpers, and extract tested time-window logic.
- PRD-4 should remain queued until PRD-3 is complete because ADR-001 and ADR-002 both touch Setup/RALPH UI surfaces currently embedded in `App.tsx`.
- GitHub issue creation was not completed from the local clone because `gh` is not authenticated in this environment. Use the GitHub connector or authenticate `gh` before publishing this PRD as an issue.
