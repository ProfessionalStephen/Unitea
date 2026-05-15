// ─────────────────────────────────────────────────────────────
// KPI CONFIG STORE — Vercel Blob
//
// Single org-wide blob `config/kpi-tags.json` containing the
// user-edited KpiTag array. Cron + frontend resolve KPI sources
// from this on each run. Falls back to bundled KPI_INIT defaults
// when the blob doesn't exist yet.
//
// Schema: { version: 1, updatedAt: ISO, tags: KpiTag[] }
//
// Last-write-wins. Writers must read first if they want to do
// non-destructive merges (UI doesn't — full overwrites only).
// ─────────────────────────────────────────────────────────────

import { put, head } from "@vercel/blob";
import type { KpiTag } from "../../shared/domain/types";
import { KPI_INIT } from "../../shared/domain/kpi-configs";

const PATHNAME = "config/kpi-tags.json";

type Stored = {
  version: 1;
  updatedAt: string;
  tags: KpiTag[];
};

export type ReadResult = {
  tags: KpiTag[];
  source: "blob" | "default";
  updatedAt: string | null;
};

export async function readKpiConfig(): Promise<ReadResult> {
  try {
    const meta = await head(PATHNAME);
    if (!meta?.url) return { tags: KPI_INIT, source: "default", updatedAt: null };
    const r = await fetch(meta.url);
    if (!r.ok) return { tags: KPI_INIT, source: "default", updatedAt: null };
    const json = (await r.json()) as Stored;
    if (!json || json.version !== 1 || !Array.isArray(json.tags)) {
      return { tags: KPI_INIT, source: "default", updatedAt: null };
    }
    return { tags: json.tags, source: "blob", updatedAt: json.updatedAt };
  } catch {
    return { tags: KPI_INIT, source: "default", updatedAt: null };
  }
}

export async function writeKpiConfig(tags: KpiTag[]): Promise<{ updatedAt: string }> {
  const payload: Stored = {
    version: 1,
    updatedAt: new Date().toISOString(),
    tags,
  };
  await put(PATHNAME, JSON.stringify(payload), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return { updatedAt: payload.updatedAt };
}
