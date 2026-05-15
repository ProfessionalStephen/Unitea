# ADR-001: Live-Mode Boundary & Confirmation UX

**Status:** Accepted
**Date:** 2026-05-15

---

## Context

Dashboard has Live and Draft modes. As controls multiply, operators can
accidentally save KPI configs affecting tomorrow emails, flip cron
enable/disable, or change recipient lists. No guardrails exist today.

---

## Decision

### 1. Enabled / Disabled copy standard

Every control that can change live behaviour uses:
- "Enabled" / "Disabled" as state labels (not On/Off, Active/Inactive)
- Green (#22c55e) for Enabled, grey (#6b7280) for Disabled

Sweep scope:
| Control | Current | Target |
|---|---|---|
| Mode banner | "Live mode" / "Draft mode" | Keep. Add sub-label "Sends Enabled / Disabled" |
| EMAILS_PAUSED toggle (if added) | -- | "Email sends: Enabled / Disabled" |
| CRON_TEST_RECIPIENT indicator | "TEST MODE" badge | "Test recipient: Enabled / Disabled" |
| KPI Mapping save (Live mode) | "Save changes" | Add "Affects live emails" sub-label |
| RALPH Log Issue | "+ Log issue" | Add "Enters RALPH pipeline" sub-label |

### 2. Actions requiring confirmation popup

Popup fires if the action directly changes what goes out in the next email
run OR changes who receives it.

| Action | Confirm? | Reason |
|---|---|---|
| Switch to Live mode | YES | Enables real sends |
| Switch to Draft mode | YES | Disables sends |
| Save KPI Mapping (Live mode) | YES | Changes KPI values in next email |
| Save KPI Mapping (Draft mode) | NO | Draft is safe sandbox |
| Toggle CRON_TEST_RECIPIENT | YES | Changes recipient list |
| Save cron schedule change | YES | Changes send timing |
| Log RALPH issue | NO | No email impact |
| RALPH status updates | NO | Internal workflow |
| Refresh Pipedrive | NO | Read-only |

### 3. Confirmation popup spec

Component: ConfirmActionModal

- Title: short action name
- Body: one sentence describing the change
- Impact badge: "Affects live" (orange)
- Confirm: "Yes, [verb]"
- Cancel: "Cancel"
- Checkbox: "Don't ask again for [N] minutes"
  - sessionStorage key: confirm_suppress_{actionType}, value: expiry epoch ms
  - Resets on page reload (sessionStorage clears) -- intentional
  - Per-action defaults:

| Action type | Suppress (min) |
|---|---|
| mode-switch | 30 |
| kpi-mapping-save | 15 |
| test-recipient-toggle | 30 |
| cron-schedule-save | 60 |

### 4. No confirmation needed

- Any action in Draft mode
- Read-only operations
- RALPH workflow actions
- Team member edits

---

## Implementation (next session, after App.tsx split)

1. src/components/ConfirmActionModal.tsx
2. src/lib/confirmSuppress.ts -- shouldSkipConfirm(type) / recordConfirm(type, minutes)
3. Sweep all controls per section 1
4. Wire modal per section 2
5. Tests: suppress logic, expiry edge cases, modal render
