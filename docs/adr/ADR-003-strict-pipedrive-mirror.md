# ADR-003: Strict Pipedrive Mirror for BOARDS Config

**Date:** 2026-05-26
**Status:** Accepted
**Supersedes:** Original intent of PRD-1 (which was to build pipelines in Pipedrive).

## Context

The Unitea dashboard expects 17 Pipedrive pipelines with specific names and stage lists, defined in `shared/domain/boards.ts`. KPI resolution and board health rendering both require an exact byte-for-byte match between codebase strings and Pipedrive pipeline/stage names.

A full read-only inspection of unicitysolar.pipedrive.com (2026-05-26) revealed that all 17 pipelines already exist, but with significant string drift between the live Pipedrive account and the codebase:

- **7 pipeline names** differ (e.g., "New Sale" in code, "New Sale Board" in PD)
- **20+ stage names** have trailing spaces in PD that aren't in code
- **5+ stages** have case-mismatches ("Brand New Deal" in code, "Brand new deal" in PD)
- **Several stages** contain typos in PD that didn't exist in code:
  - "Panels Warrantys" (extra 's')
  - "New Cancelation" (missing 'l')
  - "RandR requested/ Docs" (literal "RandR" instead of "R&R")
- **Some pipelines** have structural changes (Permitting +2 stages, Service Board +1 stage, Completed Meter Board renames)

## Decision

The codebase mirrors Pipedrive byte-for-byte, including trailing whitespace, lowercase letters, and apparent typos. The Pipedrive account is treated as the source of truth; the codebase reflects whatever state operators have built up there.

Every unusual string in `boards.ts` is tagged with `// [SIC]` in a comment explaining the apparent oddity is intentional.

## Rejected Alternatives

**Build in Pipedrive (original PRD-1, "Path A"):** initially planned, then reversed by stakeholder. Would have required adding 15 new pipelines to a production CRM in active business use. Operational risk to team members who would see new pipelines appear in their nav with no warning.

**Trim in code (initial fallback, "Path B"):** rejected because all 17 pipelines actually exist — they just have name drift. There's nothing to trim.

**Normalize in the resolver ("Path 3"):** add `trim()` and case-insensitive matching in `shared/kpi/resolver.ts`. Rejected because it hides bugs — if Pipedrive's drift accidentally creates a name collision, the resolver would silently match the wrong pipeline. Also adds complexity that future maintainers have to keep in mind.

**Pipedrive cleanup first ("Path 2"):** rejected because the trailing spaces and typos are old enough that team members may have built workflows around the exact strings. Editing pipeline/stage names in PD could break user-facing tools and reports the team relies on. Strict mirror in code is the lower-risk option.

## Consequences

**Positive:**
- KPI resolution is now correct against live Pipedrive without any normalization layer
- Zero changes to the Pipedrive account — no business disruption
- Future maintainers see explicit `[SIC]` comments and won't accidentally "fix" the typos
- The board-coverage test (`tests/board-coverage.test.ts`) is now a reliable drift-detector

**Negative:**
- Codebase contains visually ugly strings (`"R&R "`, `"Panels Warrantys"`, etc.)
- If anyone ever cleans up the Pipedrive UI (drops trailing spaces, fixes typos), KPI resolution silently breaks until the codebase is re-synced
- Code reviews will flag these strings as suspected typos forever; the `[SIC]` comments are the only defense

**Operational:**
- When a stage is renamed in Pipedrive, run `pipedrive-inspect.ts` to compare and update the codebase
- `pipedrive-inspect.ts` should probably be committed as a maintenance tool (was throwaway in this PR — follow-up issue)
- The dead code from the original PRD-1 (`pipedrive-setup.ts`, `pipedrive-classify-deals.ts`, `pipedrive-migrate-deals.ts`) is kept for now — pipeline creation is still a useful capability if a new board is ever needed. Could be removed if confirmed unwanted.

## Source of Truth Snapshot

Pipedrive state as of 2026-05-26 was captured via `scripts/pipedrive-inspect.ts` (read-only). Output saved (not committed) at `pipedrive-state.txt` locally. The current `shared/domain/boards.ts` reflects that snapshot exactly.

## Related

- PRD-1 (Issue #1): original "build pipelines in Pipedrive" PRD; superseded.
- `shared/domain/boards.ts`: the strict-mirror data
- `shared/domain/roles.ts`: updated board references
- `shared/domain/kpi-configs.ts`: updated board and stage references
- `tests/board-coverage.test.ts`: regression net against future drift
