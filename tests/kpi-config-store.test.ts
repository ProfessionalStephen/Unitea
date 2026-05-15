import { describe, it, expect, beforeEach, vi } from "vitest";

// ─────────────────────────────────────────────────────────────
// Cycle 6 — KPI config persistence
//
// Bug: UI editing of `kpiTags` in `KpiMapping` updates React state
// only. Cron emails always use bundled `KPI_INIT` defaults. The
// editor is therefore theater — the customization never reaches
// the morning emails.
//
// Contract: a single Blob blob `config/kpi-tags.json` stores the
// org-wide kpiTags overrides. On save, the frontend POSTs the
// array to /api/config/kpi-tags. On read, cron + frontend GET
// the same blob (with KPI_INIT as fallback when blob missing).
// ─────────────────────────────────────────────────────────────

vi.mock("@vercel/blob", () => {
  const store: Record<string, string> = {};
  return {
    put: vi.fn(async (pathname: string, body: string) => {
      store[pathname] = body;
      return { pathname, url: `https://blob.test/${pathname}`, downloadUrl: "" };
    }),
    head: vi.fn(async (pathname: string) => {
      if (!(pathname in store)) throw new Error("not found");
      return { url: `https://blob.test/${pathname}`, pathname, size: store[pathname].length };
    }),
    list: vi.fn(async () => ({ blobs: [] })),
    // Make fetch resolvable by stashing the content in a module-level cache
    _store: store,
  };
});

import * as blobMock from "@vercel/blob";
import { readKpiConfig, writeKpiConfig } from "../api/_lib/kpi-config-store";
import { KPI_INIT } from "../shared/domain/kpi-configs";

// Patch global fetch to return whatever the mock blob stored
beforeEach(() => {
  // @ts-expect-error attached by mock
  const store = blobMock._store as Record<string, string>;
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const key = url.replace("https://blob.test/", "");
    if (key in store) {
      return new Response(store[key], { status: 200, headers: { "content-type": "application/json" } }) as any;
    }
    return new Response("", { status: 404 }) as any;
  }));
});

describe("kpi-config-store — Blob-backed persistence", () => {
  it("readKpiConfig returns KPI_INIT defaults when nothing is stored", async () => {
    const out = await readKpiConfig();
    expect(out.tags).toEqual(KPI_INIT);
    expect(out.source).toBe("default");
  });

  it("writeKpiConfig persists, readKpiConfig returns the stored tags", async () => {
    const customTags = [
      ...KPI_INIT.slice(0, 2),
      { id: "kCUSTOM", name: "Total active jobs", sources: [], fallback: "—", testResult: null },
    ];
    await writeKpiConfig(customTags);
    const out = await readKpiConfig();
    expect(out.tags).toEqual(customTags);
    expect(out.source).toBe("blob");
  });
});
