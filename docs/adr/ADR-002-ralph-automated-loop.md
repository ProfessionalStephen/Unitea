# ADR-002: RALPH Automated Loop (AI-Assisted Issue Review)

**Status:** Accepted -- Design only. Build next session.
**Date:** 2026-05-15

---

## Context

RALPH is currently manual. User logs issue, AI Engineer moves it R->A->L->P->H
by hand. Goal: auto-generate a Claude analysis report on every new issue
covering (a) summary, (b) suggested fix, (c) pros/cons.

---

## Decision

### 1. Intake UI

"+ Log issue" opens LogIssueModal

| Field | Type | Required |
|---|---|---|
| Title | text | YES |
| Description | textarea | YES |
| Category | select: Data / Email / KPI / UI / Cron / Other | YES |
| Affected member(s) | multi-select from TEAM_INIT | NO |
| Severity | select: Low / Medium / High / Critical | YES |
| Include latest snapshot | checkbox | NO |

Submit -> POST /api/ralph/log -> save to Blob -> call Claude API -> store
analysis -> show "Report ready" on issue card.

### 2. Claude API call shape

Model: claude-3-5-haiku-20241022 (fast, cheap, structured output)

System prompt:
  You are an AI engineer reviewing a bug report for the Unicity Solar KPI
  briefing system. Respond in structured JSON only.

Response schema:
  interface RalphAnalysis {
    summary: string;
    suggestedFix: string | null;
    confidence: "low" | "medium" | "high";
    pros: string[];
    cons: string[];
    affectedFiles: string[];
    requiresHuman: boolean;
  }

If Claude call fails: issue saves, analysis shows "Pending" with retry.

### 3. Storage (Vercel Blob)

- Issues: ralph/issues/{issueId}.json
- Index:  ralph/index.json -- lightweight list for tab rendering

  interface RalphIssue {
    id: string;
    createdAt: string;
    createdBy: string;
    status: "reported"|"annotating"|"learning"|"patched"|"hardened";
    title: string;
    description: string;
    category: string;
    severity: string;
    affectedMembers: string[];
    analysis: RalphAnalysis | null;
    analysisAt: string | null;
    analysisError: string | null;
    notes: string;
    patchRef: string;
  }

### 4. Display (RALPH tab)

- Counters update live from index.json
- Issue cards: severity desc, createdAt desc
- Expand -> summary, fix, pros/cons columns, affected files, requiresHuman warning
- AI Engineer actions: advance status, add notes, mark patched + PR ref

### 5. API routes

| Route | Method | Purpose |
|---|---|---|
| /api/ralph/log | POST | Create issue + trigger analysis |
| /api/ralph/analyze | POST (internal) | Claude call + store result |
| /api/ralph/issues | GET | List from index.json |
| /api/ralph/issues/[id] | GET | Single issue |
| /api/ralph/issues/[id] | PATCH | Update status/notes/patchRef |

---

## Open questions (resolve before build session)

1. Sync vs async: recommend sync (Haiku fast enough for 10s limit). Confirm.
2. CLAUDE_API_KEY: in Vercel env vars yet? Needed before build.
3. Entry point: RALPH tab only, or also from team member cards?
