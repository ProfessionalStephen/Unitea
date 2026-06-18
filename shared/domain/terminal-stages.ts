// ─────────────────────────────────────────────────────────────
// TERMINAL (completed) DEAL STAGES — what is NOT active field work.
//
// Mirror of the solar pipeline's single source of truth
// (solar-pipedrive-kpis/scripts/lib-terminal-stages.ts / .ps1), defined with Stephen 2026-06-18.
// A deal resting in one of these (board, stage) pairs is done with that board's work — PTO reached,
// cancellation processed, milestone invoiced, or post-completion serviced — so it must be excluded
// from "active jobs". This is STAGE-level: other stages on the same board stay active (e.g. a Funding
// deal at "M1 invoice needed" is still active AR work; only "...invoice sent" is the completed milestone).
//
// Matching is trim + lowercase because the CRM's board/stage names carry case + trailing-space drift
// (e.g. "Job complete ", "M1 invoice sent", "R&R ", "Work Completed Not US customer ").
// ─────────────────────────────────────────────────────────────

// board name (trimmed, lower) -> terminal stage names (trimmed, lower)
const TERMINAL_STAGE_MAP: Record<string, string[]> = {
  "customer service": ["welcome call complete", "thank you call - install complete"],
  "r&r": ["job complete"],
  "california": ["pto"],
  "cancellations": ["cancellation processed"],
  "funding": ["m1 invoice sent", "m2 invoice sent", "m3 invoice sent"],
  "warranty board": ["job completed"],
  "completed meter board": ["activation approved/pto paid", "post-pto work completed"],
};

// whole boards that are entirely complete/terminal (EVERY stage excluded from active)
const TERMINAL_BOARDS = new Set<string>(["work completed not us customer"]);

const norm = (s: unknown): string => String(s ?? "").trim().toLowerCase();

export type PipelineRef = { id: number; name: string };
export type StageRef = { id: number; name: string; pipeline_id: number };

/**
 * Resolve the live pipelines + stages into the Set of stage IDs that count as
 * completed/terminal. A deal whose `stage_id` is in this Set is NOT active field work.
 */
export function terminalStageIds(pipelines: PipelineRef[], stages: StageRef[]): Set<number> {
  const boardById = new Map<number, string>();
  for (const p of pipelines) boardById.set(p.id, norm(p.name));
  const ids = new Set<number>();
  for (const s of stages) {
    const board = boardById.get(s.pipeline_id);
    if (!board) continue;
    if (TERMINAL_BOARDS.has(board)) { ids.add(s.id); continue; }
    const names = TERMINAL_STAGE_MAP[board];
    if (names && names.indexOf(norm(s.name)) !== -1) ids.add(s.id);
  }
  return ids;
}
