import { describe, expect, it } from "vitest";
import { BOARDS } from "../shared/domain/boards";
import {
  assembleEmail,
  buildEmailHealthSection,
  buildKpiTableHtml,
  buildNeedsAttentionHtml,
  buildPipelineData,
  dlCSV,
  dlJSON,
  escHtml,
  getPriorities,
  todayStr,
  valKey,
} from "../src/components/shared/helpers";

describe("buildPipelineData", () => {
  it("builds board and stage data from live Pipedrive payloads", () => {
    const out = buildPipelineData({
      boardData: {
        Engineering: {
          stages: [
            {
              name: "Ready for Engineering ",
              count: 2,
              avgDays: "10.5",
              totalValue: "30000",
              deals: [
                { id: 1, title: "A", days: 2, ownerName: "Taylor" },
                { id: 2, name: "B", days: 3, ownerName: "Taylor" },
              ],
            },
            {
              name: "Waiting on Engineers",
              count: 1,
              avgDays: "30",
              totalValue: "10000",
              deals: [{ id: 3, title: "C", days: 40, ownerName: "Morgan" }],
            },
          ],
        },
      },
      totalPipelineValue: 1_250_000,
      wonThisWeek: 3,
      callsDueToday: 2,
    });

    expect(out.boards.Engineering.jobCount).toBe(3);
    expect(out.boards.Engineering.avgDays).toBe(17);
    expect(out.boards.Engineering.totalValue).toBe(40000);
    expect(out.boards.Engineering.live).toBe(true);
    expect(out.boards.Engineering.stages["Ready for Engineering "].jobCount).toBe(2);
    expect(out.repStats.Taylor.jobCount).toBe(2);
    expect(out.allDeals).toHaveLength(3);
    expect(out.totalPipelineValue).toBe(1_250_000);
    expect(out.wonThisWeek).toBe(3);
    expect(out.callsDueToday).toBe(2);
  });

  it("zero-fills configured boards that are absent from live data", () => {
    const out = buildPipelineData({ boardData: {} });

    expect(Object.keys(out.boards).sort()).toEqual(Object.keys(BOARDS).sort());
    expect(out.boards.Funding.jobCount).toBe(0);
    expect(out.boards.Funding.live).toBe(false);
    expect(out.totalActiveJobs).toBe(0);
    expect(out.isLive).toBe(true);
  });

  it("preserves time-window aggregates from the live payload", () => {
    const out = buildPipelineData({
      boardData: {},
      installsCompletedYesterday: 4,
      installsScheduledThisWeek: 12,
      permitsSubmittedThisWeek: 6,
      sentToPermittingToday: 3,
      nmaSubmittedThisWeek: 2,
      serviceRequestsToday: 5,
      techniciansScheduledToday: 8,
      inspectionsScheduledToday: 11,
    });

    expect(out.installsCompletedYesterday).toBe(4);
    expect(out.installsScheduledThisWeek).toBe(12);
    expect(out.permitsSubmittedThisWeek).toBe(6);
    expect(out.sentToPermittingToday).toBe(3);
    expect(out.nmaSubmittedThisWeek).toBe(2);
    expect(out.serviceRequestsToday).toBe(5);
    expect(out.techniciansScheduledToday).toBe(8);
    expect(out.inspectionsScheduledToday).toBe(11);
  });

  it("detects bottlenecks from real stage averages", () => {
    const out = buildPipelineData({
      boardData: {
        Funding: {
          stages: [
            { name: "M1 Invoice needed", count: 4, avgDays: "4", totalValue: "4000", deals: [] },
            { name: "M2 invoice needed", count: 1, avgDays: "30", totalValue: "1000", deals: [] },
          ],
        },
      },
    });

    expect(out.bottlenecks).toEqual([
      expect.objectContaining({
        board: "Funding",
        stage: "M2 invoice needed",
        stuckCount: 1,
        avgDays: 30,
      }),
    ]);
  });
});

describe("buildEmailHealthSection", () => {
  it("renders board health summary, sorted boards, and top bottlenecks", () => {
    const html = buildEmailHealthSection(
      {
        endToEndDays: 87,
        boards: {
          Healthy: {
            status: "green",
            jobCount: 4,
            avgDays: 5,
            stuckCount: 0,
            stages: {
              Done: { stuckCount: 0, avgDays: 5 },
            },
          },
          Critical: {
            status: "red",
            jobCount: 2,
            avgDays: 30,
            stuckCount: 2,
            stages: {
              Blocked: { stuckCount: 2, avgDays: 30 },
            },
          },
          Watch: {
            status: "amber",
            jobCount: 3,
            avgDays: 14,
            stuckCount: 1,
            stages: {
              Waiting: { stuckCount: 1, avgDays: 14 },
            },
          },
        },
        bottlenecks: [
          { board: "Critical", stage: "Blocked", avgDays: 30, pctAbove: 120 },
          { board: "Watch", stage: "Waiting", avgDays: 14, pctAbove: 40 },
        ],
      },
      ["Healthy", "Critical", "Watch", "Missing"],
    );

    expect(html).toContain("Board health overview");
    expect(html).toContain("&#9679; Healthy");
    expect(html).toContain("&#9650; Watch");
    expect(html).toContain("&#10005; Critical");
    expect(html).toContain("Critical &mdash; 2 jobs");
    expect(html).toContain("Top stuck: Blocked (2 deals, avg 30d)");
    expect(html).toContain("Top bottlenecks this period");
    expect(html).toContain("Critical");
    expect(html).toContain("Blocked");
    expect(html).toContain("End-to-end pipeline avg: 87 days");

    expect(html.indexOf("Critical &mdash; 2 jobs")).toBeLessThan(
      html.indexOf("Watch &mdash; 3 jobs"),
    );
    expect(html.indexOf("Watch &mdash; 3 jobs")).toBeLessThan(
      html.indexOf("Healthy &mdash; 4 jobs"),
    );
    expect(html).not.toContain("Missing");
  });

  it("omits the bottleneck table when there are no bottlenecks", () => {
    const html = buildEmailHealthSection(
      {
        endToEndDays: 0,
        boards: {
          Healthy: {
            status: "green",
            jobCount: 0,
            avgDays: 0,
            stuckCount: 0,
            stages: {},
          },
        },
        bottlenecks: [],
      },
      ["Healthy"],
    );

    expect(html).toContain("Board health overview");
    expect(html).not.toContain("Top bottlenecks this period");
  });
});

describe("buildKpiTableHtml", () => {
  it("renders resolved KPI values in three-column email rows", () => {
    const html = buildKpiTableHtml(
      { kpis: ["Total active jobs", "Revenue pipeline value", "Jobs completed this week", "Missing KPI"] },
      {
        totalActiveJobs: 17,
        totalPipelineValue: 1_250_000,
        wonThisWeek: 3,
        boards: {},
      },
      [
        { name: "Total active jobs", sources: [], fallback: "N/A" },
        { name: "Revenue pipeline value", sources: [], fallback: "N/A" },
        { name: "Jobs completed this week", sources: [], fallback: "N/A" },
      ],
    );

    expect(html).toContain("<table width='100%'");
    expect(html).toContain("Total active jobs");
    expect(html).toContain(">17<");
    expect(html).toContain("Revenue pipeline value");
    expect(html).toContain(">$1.3M<");
    expect(html).toContain("Jobs completed this week");
    expect(html).toContain(">3<");
    expect(html).toContain("Missing KPI");
  });
});

describe("buildNeedsAttentionHtml", () => {
  it("renders alerts with matching bottleneck links and fallback Pipedrive links", () => {
    const html = buildNeedsAttentionHtml(
      ["Funding queue is aging", "Review unmapped alert"],
      {
        bottlenecks: [{ board: "Funding" }],
      },
    );

    expect(html).toContain("Funding queue is aging");
    expect(html).toContain("Review unmapped alert");
    expect(html).toContain("https://app.pipedrive.com/deals/?filter_id=Funding");
    expect(html).toContain("https://app.pipedrive.com");
    expect(html).toContain("View in Pipedrive &rarr;");
  });
});

describe("getPriorities", () => {
  it("returns owner priorities with stuck deal count context", () => {
    expect(getPriorities({ role: "Owner" }, { totalStuck: 4 })).toEqual([
      "Review top 3 bottlenecks with relevant managers",
      "Address 4 stuck deals across all boards",
      "Check team workload distribution",
    ]);
  });

  it("returns role-specific defaults for finance and unknown roles", () => {
    expect(getPriorities({ role: "Director of Finance" }, { totalStuck: 0 })[0]).toBe(
      "Review M1/M2/M3 invoice status",
    );
    expect(getPriorities({ role: "Receptionist" }, { totalStuck: 0 })).toEqual([
      "Review your KPIs above",
      "Address items in 'Needs attention'",
      "Coordinate with your manager on blockers",
    ]);
  });
});

describe("assembleEmail", () => {
  it("assembles the fixed email structure with optional owner and Monday sections", () => {
    const html = assembleEmail(
      { name: "Jordan Lee", nested: true },
      {
        greeting: "Good morning",
        priorities: ["Review blockers", "Confirm handoffs"],
        teamPulse: "Team is steady",
        weekReview: "Last week improved",
      },
      "<table><tr><td>KPI</td></tr></table>",
      "<div>Needs attention row</div>",
      "<div>Board health row</div>",
      true,
      true,
    );

    expect(html).toContain("Your KPIs today");
    expect(html).toContain("<table><tr><td>KPI</td></tr></table>");
    expect(html).toContain("Needs attention row");
    expect(html).toContain("Board health row");
    expect(html).toContain("Today's priorities");
    expect(html).toContain("Team pulse");
    expect(html).toContain("Week in review");
    expect(html).toContain("subject=Snooze alert - Jordan Lee");
  });

  it("omits nested, owner, and Monday-only sections when not applicable", () => {
    const html = assembleEmail(
      { name: "Taylor", nested: false },
      { greeting: "Hello", priorities: [] },
      "<table></table>",
      "",
      "<div>Board health row</div>",
      false,
      false,
    );

    expect(html).not.toContain("Board health row");
    expect(html).not.toContain("Team pulse");
    expect(html).not.toContain("Week in review");
  });
});

describe("escHtml", () => {
  it("escapes HTML special characters and empty values", () => {
    expect(escHtml("<tag attr=\"x\">O'Reilly & Co</tag>")).toBe(
      "&lt;tag attr=&quot;x&quot;&gt;O&#39;Reilly &amp; Co&lt;/tag&gt;",
    );
    expect(escHtml(null)).toBe("");
    expect(escHtml(undefined)).toBe("");
  });
});

describe("utility helpers", () => {
  it("validates Pipedrive API key shape", () => {
    expect(valKey("")).toBe("Key too short");
    expect(valKey("abc")).toBe("Key too short");
    expect(valKey("z".repeat(20))).toBe("Invalid characters");
    expect(valKey("a".repeat(20))).toBeNull();
  });

  it("formats dates for export filenames", () => {
    expect(todayStr(new Date("2026-06-04T18:30:00.000Z"))).toBe("2026-06-04");
  });

  it("downloads CSV with escaped cell values and skips empty data", () => {
    const anchors: Array<{ href: string; download: string; clicks: number }> = [];
    const previousDocument = globalThis.document;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => {
          const anchor = {
            href: "",
            download: "",
            clicks: 0,
            click() {
              this.clicks += 1;
            },
          };
          anchors.push(anchor);
          return anchor as unknown as HTMLAnchorElement;
        },
      },
    });

    try {
      dlCSV([{ name: "A \"Quote\"", count: 2 }], "out.csv");
      dlCSV([], "empty.csv");
    } finally {
      Object.defineProperty(globalThis, "document", { configurable: true, value: previousDocument });
    }

    expect(anchors).toHaveLength(1);
    expect(anchors[0].download).toBe("out.csv");
    expect(anchors[0].clicks).toBe(1);
    expect(decodeURIComponent(anchors[0].href)).toContain('name,count\n"A ""Quote""","2"');
  });

  it("downloads JSON payloads", () => {
    const anchors: Array<{ href: string; download: string; clicks: number }> = [];
    const previousDocument = globalThis.document;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => {
          const anchor = {
            href: "",
            download: "",
            clicks: 0,
            click() {
              this.clicks += 1;
            },
          };
          anchors.push(anchor);
          return anchor as unknown as HTMLAnchorElement;
        },
      },
    });

    try {
      dlJSON([{ ok: true }], "out.json");
    } finally {
      Object.defineProperty(globalThis, "document", { configurable: true, value: previousDocument });
    }

    expect(anchors).toHaveLength(1);
    expect(anchors[0].download).toBe("out.json");
    expect(anchors[0].clicks).toBe(1);
    expect(decodeURIComponent(anchors[0].href)).toContain('"ok": true');
  });
});
