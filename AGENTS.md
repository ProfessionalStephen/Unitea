# Unitea Agent Specializations

Delegation framework for completing the Unitea KPI system work. Each agent handles a specific domain.

---

## Agent skills

### Issue tracker

GitHub Issues at github.com/ProfessionalStephen/Unitea. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

---

## 1. **Pipedrive Data Alignment Agent** ðŸ”„

**Specialization**: Diagnosing and fixing data mismatches between config and live sources

### Scope
- Verify Pipedrive account pipeline configuration
- Match BOARDS config to actual Pipedrive pipelines
- Fix missing/orphaned board definitions
- Validate data flow from Pipedrive API â†’ Frontend

### Tasks Assigned
- [ ] **Fix Pipedrive boards config mismatch** (Issue #1)
  - Compare 16 defined BOARDS vs. actual Pipedrive pipelines
  - If <16 pipelines exist: decide add vs. remove strategy
  - If mismatch: update BOARDS or Pipedrive config
  - Validate: Boards tab shows all live data

### Input Requirements
- Pipedrive API key & domain
- BOARDS config snapshot
- Current live pipeline list from Pipedrive

### Output Deliverables
1. Report: "X boards in config, Y pipelines in Pipedrive"
2. Decision: Add missing pipelines OR remove from config
3. Implementation: Code changes to fix mismatch
4. Validation: Screenshots of Boards tab with all green indicators

### Success Criteria
âœ… All 16 boards visible on Dashboard  
âœ… No grayed-out boards with 0 jobs  
âœ… Pipedrive live=true for all boards

---

## 2. **KPI Mapping & Coverage Agent** ðŸ“Š

**Specialization**: KPI configuration, source mapping, and role wiring

### Scope
- Map KPIs to Pipedrive data sources (board/stage/field)
- Handle missing KPIs (27 to review)
- Resolve duplicate KPI aliases
- Document KPIâ†’role assignments
- Ensure every role has meaningful KPIs

### Tasks Assigned
- [ ] **Map missing KPIs for 3 roles** (Issue #2)
  - Office Administrator: find/create Pipedrive-backed KPIs
  - Onboarding Coordinator: replace HR KPIs
  - Accounting Manager: replace accounting KPIs
  
- [ ] **Consolidate duplicate KPI aliases** (Issue #3)
  - Merge "Pipeline deals active" â†” "Total active jobs"
  - Merge "Material orders pending" â†” "Material ordered pending"
  - Merge "HOA approvals pending" â†” "HOA pending approvals"
  - Merge "Net metering backlog" â†” "Net metering pending"
  - Create DRY reference system

### Input Requirements
- KPI_INIT array (all 100+ definitions)
- KPI_COVERAGE_TRIAGE.md (mapping decisions per KPI)
- RT object (role definitions)
- BOARDS config (available stages)

### Output Deliverables
1. KPI mapping spreadsheet: name â†’ source â†’ roles
2. 3 role KPI assignments (verified to exist in Pipedrive)
3. Updated KPI_INIT with consolidated aliases
4. Test results: all KPIs resolve to valid values

### Success Criteria
âœ… No roles with 0 KPIs  
âœ… All KPI sources verified in Pipedrive  
âœ… No duplicate aliases in config  
âœ… Every KPI resolves in test mode

---

## 3. **Code Quality & Refactoring Agent** ðŸ—ï¸

**Specialization**: Architecture improvements, testing, and maintainability

### Scope
- Component architecture (split monolithic files)
- Test coverage (resolver, time-window aggregates)
- Code organization (styles, constants)
- Performance optimization (memoization, lazy loading)

### Tasks Assigned
- [ ] **Split App.tsx into components** (Issue #4)
  - Extract 8 tab components
  - Create shared UI atoms file
  - Extract theme/constants
  - Maintain state management patterns
  
- [ ] **Add KPI resolver test coverage** (Issue #5)
  - Test all name-case matches (Board health, KPI coverage, Unmapped tags)
  - Test time-window aggregates (installs this week, permits, NMA, etc.)
  - Edge cases: DST transitions, month boundaries, timezone boundaries
  - Run vitest suite, capture coverage report

### Input Requirements
- Current App.tsx (~1700 lines)
- test/*.test.ts files (existing test patterns)
- shared/kpi/resolver.ts (all resolver logic)
- api/_lib/pipedrive.ts (time-window logic)

### Output Deliverables
1. Refactored component tree with 8 tab components
2. Extract `src/components/shared/theme.ts` & `atoms.tsx`
3. Test suite additions: resolver + time-window tests
4. Coverage report: >85% for critical paths

### Success Criteria
âœ… App.tsx <300 lines (root only)  
âœ… All tab components <400 lines each  
âœ… Tests pass: vitest run (all 136+)  
âœ… Coverage report shows improvements

---

## 4. **Feature Implementation & ADR Agent** ðŸš€

**Specialization**: Advanced features, decision records, and safety mechanisms

### Scope
- Implement ADRs (Architecture Decision Records)
- Build safety confirmations & guardrails
- Automated feedback loops
- AI integrations

### Tasks Assigned
- [ ] **Implement ADR-001: Live-Mode Boundary** (Issue #6)
  - Add confirmation modal before pushing draft to live
  - Show summary of changes being pushed
  - Require admin sign-off
  - Audit log entry on push
  - Reference: docs/adr/ADR-001-live-mode-boundary.md

- [ ] **Implement ADR-002: RALPH Automated Loop** (Issue #7)
  - Build auto-triage for user-reported KPI issues
  - Link RALPH panel to resolver feedback
  - Auto-suggest corrections based on patterns
  - Status workflow: Râ†’Aâ†’Lâ†’Pâ†’H
  - Reference: docs/adr/ADR-002-ralph-automated-loop.md

### Input Requirements
- docs/adr/ADR-001-live-mode-boundary.md (full spec)
- docs/adr/ADR-002-ralph-automated-loop.md (full spec)
- Current draft/live push logic (Setup tab)
- Current RALPH panel UI (App.tsx ~1800)

### Output Deliverables
1. ADR-001 implementation: confirmation modal + audit
2. ADR-002 implementation: auto-triage workflow
3. Updated UI flows (Setup tab changes, RALPH enhancements)
4. Test suite for new flows

### Success Criteria
âœ… Cannot push to live without confirmation  
âœ… Confirmation shows list of draft changes  
âœ… RALPH issues auto-categorize per spec  
âœ… Feedback loop drives resolver improvements

---

## Agent Coordination

### Sequential Execution (Recommended Order)
```
1. Pipedrive Data Alignment (unblocks others)
   â””â”€> 2. KPI Mapping & Coverage (depends on verified data sources)
       â””â”€> 3. Code Quality & Refactoring (polish phase)
           â””â”€> 4. Feature Implementation (final phase)
```

### Parallel Execution (If Timeline Tight)
- Pipedrive Agent + KPI Agent (can work simultaneously after data audit)
- Code Quality Agent (independent, can start anytime)
- Feature Agent (depends on Code Quality for test coverage)

### Handoff Protocol
Each agent produces:
1. **Status report**: what was found, decisions made
2. **Code changes**: PR-ready, tested
3. **Blockers**: anything requiring manual decision
4. **Next agent briefing**: what downstream agents need to know

---

## Agent-Specific Instructions

### Pipedrive Data Alignment Agent
```
Goal: Make Dashboard show ALL 16 boards with live data

Steps:
1. Connect to Pipedrive API (use PIPEDRIVE_API_KEY + PIPEDRIVE_DOMAIN)
2. Fetch /pipelines endpoint
3. Count returned pipelines vs. 16 defined boards
4. For each missing board:
   - Decision A: Create pipeline in Pipedrive account (template provided)
   - Decision B: Remove from BOARDS config + update roles
5. Test: buildPipelineData() with live API call
6. Verify: All boards show jobCount > 0 OR explicitly no deals

Input: Pipedrive credentials, BOARDS config
Output: Either (pipelines created) OR (config updated), tested & verified
```

### KPI Mapping & Coverage Agent
```
Goal: Every role has meaningful, source-backed KPIs

Steps:
1. Parse KPI_COVERAGE_TRIAGE.md (A=add, B=resolver, C=future, D=delete)
2. For 3 zero-KPI roles:
   - Find 4-5 Pipedrive-backed KPIs relevant to role
   - Add to KPI_INIT if not present
   - Wire to role in RT[role].kpis
3. For 27 deleted KPIs:
   - For each: can we map to Pipedrive? (if yes â†’ A/B/C, if no â†’ D)
   - Document decision in ADR or updated triage table
4. Find all KPI aliases (same source, different names)
5. Consolidate: create primary name, deprecate aliases in comments
6. Test: all KPIs resolve without errors in test mode

Input: KPI_INIT, RT, KPI_COVERAGE_TRIAGE.md, BOARDS
Output: Updated KPI_INIT + updated roles + test results showing all resolve
```

### Code Quality & Refactoring Agent
```
Goal: Improve maintainability (split monolith, add tests)

Steps:
1. Analyze App.tsx: identify 8 clear component boundaries
2. Extract each tab to separate file (SetupTab.tsx, BoardsTab.tsx, etc.)
3. Create src/components/shared/{theme.ts, atoms.tsx}
4. Maintain all state mgmt in App.tsx (root), pass as props
5. Add React.memo to expensive components
6. Run eslint, ensure no warnings
7. Write tests for resolver: all name-case matches
8. Write tests for time-window KPIs: boundary conditions
9. vitest run + coverage report
10. Commit message: detailed explanation of splits

Input: App.tsx, resolver.ts, pipedrive.ts, existing test patterns
Output: Refactored tree, test suite additions, coverage report
```

### Feature Implementation & ADR Agent
```
Goal: Implement safety confirmations + feedback loop

Steps for ADR-001:
1. Read docs/adr/ADR-001-live-mode-boundary.md completely
2. Add PushModal component (if not exists)
3. Before setDraft(false): show modal with:
   - "Push draft to live?" header
   - List of draftChanges (from audit log)
   - Confirm/Cancel buttons
   - Show affected recipient count
4. On confirm: addAudit("Pushed to live", ...)
5. Test: cannot bypass modal, all changes shown

Steps for ADR-002:
1. Read docs/adr/ADR-002-ralph-automated-loop.md completely
2. Enhance RalphFormInline to capture issue detail + affected KPI
3. On submit: RALPH_INIT entry with status="R - Reported"
4. Auto-categorize: scan issue text for keywords (revisions, stuck, stale, etc.)
5. Suggest stage: "L - Learning" if known pattern
6. Link to resolver: when issue marked "H - Hardened", update resolver
7. Test: full workflow Râ†’Aâ†’Lâ†’Pâ†’H with audit trail

Input: ADR-001 spec, ADR-002 spec, current UI code
Output: Modal components, RALPH enhancements, E2E tests
```

---

## Status Tracking

| Agent | Task | Status | Owner | ETA |
|-------|------|--------|-------|-----|
| Pipedrive | Fix boards config | Not started | â€” | â€” |
| KPI | Map 3 roles | Not started | â€” | â€” |
| KPI | Consolidate aliases | Not started | â€” | â€” |
| Code Quality | Split App.tsx | Not started | â€” | â€” |
| Code Quality | Add resolver tests | Not started | â€” | â€” |
| Feature | ADR-001 implementation | Not started | â€” | â€” |
| Feature | ADR-002 implementation | Not started | â€” | â€” |

---

## Quick Reference: Issueâ†’Agent Routing

| Issue | Title | Agent | Priority |
|-------|-------|-------|----------|
| #1 | 2-board Pipedrive limitation | Pipedrive Data | ðŸ”´ Critical |
| #2 | 3 roles with 0 KPIs | KPI Mapping | ðŸŸ  Major |
| #3 | 27 KPIs removed | KPI Mapping | ðŸŸ  Major |
| #4 | 4 duplicate KPI aliases | KPI Mapping | ðŸŸ¡ Moderate |
| #5 | App.tsx 1700+ lines | Code Quality | ðŸŸ¡ Moderate |
| #6 | Missing test coverage | Code Quality | ðŸŸ¡ Moderate |
| #7 | ADR-001 live-mode | Feature | ðŸŸ¢ Queued |
| #8 | ADR-002 RALPH loop | Feature | ðŸŸ¢ Queued |

