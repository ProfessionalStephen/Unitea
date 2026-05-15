// ─────────────────────────────────────────────────────────────
// SHARED DOMAIN — TYPES
// Used by frontend (src/App.tsx) and serverless functions (api/**).
// Pure types, no runtime code. Import-only.
// ─────────────────────────────────────────────────────────────

export type Region = "FL" | "CA" | "Both";

export type BoardConfig = {
  region: Region;
  stages: string[];
  rotting: Record<string, number>;
};

export type RoleConfig = {
  color: string;        // hex color for role badge
  boards: "all" | string[];
  region: Region;
  nested: boolean;      // gets board health section in email
  kpis: string[];
  sendFreq: "daily" | "weekly";
};

export type TeamMember = {
  id: number;
  name: string;
  title: string;
  role: string;
  email: string;        // empty = not emailed by cron
  manager: string;
  region: Region;
  boards: string[];
  kpis: string[];
  nested: boolean;
  sendFreq: "daily" | "weekly";
  hours: string;
};

export type KpiScope = "board" | "stage";

export type KpiSource = {
  board: string;
  scope: KpiScope;
  stage: string | null;
  field: string;        // one of PD_FIELDS_FLAT[].n
};

export type KpiTag = {
  id: string;
  name: string;
  sources: KpiSource[];
  fallback: string;
  testResult: string | null;
};

export type PdField = {
  n: string;     // technical name (e.g. "stage.deal_count")
  d: string;    // human description
  r: string;    // return type
};

export type Permission =
  | "repData"
  | "nestedEmail"
  | "boardEdit"
  | "auditAccess"
  | "analyticsDeep";
