import { describe, expect, it } from "vitest";
import { KpiCatalog } from "../shared/domain/kpi-catalog";

describe("KpiCatalog", () => {
  it("lists canonical KPI definitions without retired aliases", () => {
    const names = KpiCatalog.list().map((kpi) => kpi.name);

    expect(names).toContain("Total active jobs");
    expect(names).toContain("Material orders pending");
    expect(names).toContain("HOA approvals pending");
    expect(names).toContain("Net metering pending");

    expect(names).not.toContain("Pipeline deals active");
    expect(names).not.toContain("Material ordered pending");
    expect(names).not.toContain("HOA pending approvals");
    expect(names).not.toContain("Net metering backlog");
  });

  it("resolves retired aliases to the same canonical KPI definition", () => {
    expect(KpiCatalog.findByName("Pipeline deals active")).toEqual(
      KpiCatalog.findByName("Total active jobs"),
    );
    expect(KpiCatalog.findByName("Material ordered pending")).toEqual(
      KpiCatalog.findByName("Material orders pending"),
    );
    expect(KpiCatalog.findByName("HOA pending approvals")).toEqual(
      KpiCatalog.findByName("HOA approvals pending"),
    );
    expect(KpiCatalog.findByName("Net metering backlog")).toEqual(
      KpiCatalog.findByName("Net metering pending"),
    );
  });

  it("returns canonical names for canonical and alias inputs", () => {
    expect(KpiCatalog.canonicalName("Total active jobs")).toBe("Total active jobs");
    expect(KpiCatalog.canonicalName("Pipeline deals active")).toBe("Total active jobs");
    expect(KpiCatalog.canonicalName("Material ordered pending")).toBe("Material orders pending");
    expect(KpiCatalog.canonicalName("HOA pending approvals")).toBe("HOA approvals pending");
    expect(KpiCatalog.canonicalName("Net metering backlog")).toBe("Net metering pending");
  });

  it("returns null for unknown KPI names", () => {
    expect(KpiCatalog.findByName("Unknown KPI")).toBeNull();
    expect(KpiCatalog.canonicalName("Unknown KPI")).toBeNull();
  });
});
