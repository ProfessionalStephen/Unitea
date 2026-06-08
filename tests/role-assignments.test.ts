import { describe, expect, it } from "vitest";
import { RT } from "../shared/domain/roles";
import { RoleAssignments } from "../shared/domain/role-assignments";

const retiredAliases = [
  "Pipeline deals active",
  "Material ordered pending",
  "HOA pending approvals",
  "Net metering backlog",
];

describe("RoleAssignments", () => {
  it("returns the corrected PRD-2 KPI list for Office Administrator", () => {
    expect(RoleAssignments.kpisForRole("Office Administrator")).toEqual([
      "Funding pipeline value",
      "M1 invoices needed",
      "M2 invoices needed",
      "Missing NTP count",
      "Cancellations this week",
    ]);
  });

  it("returns the corrected PRD-2 KPI list for Onboarding Coordinator", () => {
    expect(RoleAssignments.kpisForRole("Onboarding Coordinator")).toEqual([
      "New deals this week",
      "Site surveys scheduled",
      "Site surveys to schedule",
      "Missing NTP count",
      "Deals sent to engineering",
    ]);
  });

  it("returns the corrected PRD-2 KPI list for Accounting Manager", () => {
    expect(RoleAssignments.kpisForRole("Accounting Manager")).toEqual([
      "Funding pipeline value",
      "M1 invoices needed",
      "M2 invoices needed",
      "M3 invoices needed",
    ]);
  });

  it("does not leak retired aliases from any role KPI assignment", () => {
    for (const [role, config] of Object.entries(RT)) {
      for (const alias of retiredAliases) {
        expect(config.kpis, `${role} still uses retired alias ${alias}`).not.toContain(alias);
      }
    }
  });

  it("reports no orphan KPI references in the shipped role table", () => {
    expect(RoleAssignments.validateAssignments()).toEqual([]);
  });

  it("reports injected orphan KPI references with role and KPI name", () => {
    const invalidRoles = {
      ...RT,
      "Test Role": {
        color: "#000000",
        boards: "all" as const,
        region: "Both" as const,
        nested: false,
        kpis: ["Definitely Missing KPI"],
        sendFreq: "daily" as const,
      },
    };

    expect(RoleAssignments.validateAssignments(invalidRoles)).toEqual([
      { role: "Test Role", kpi: "Definitely Missing KPI" },
    ]);
  });

  it("finds roles using canonical names and retired aliases", () => {
    expect(RoleAssignments.rolesUsingKpi("Total active jobs")).toContain("Owner");
    expect(RoleAssignments.rolesUsingKpi("Pipeline deals active")).toContain("Owner");
  });
});
