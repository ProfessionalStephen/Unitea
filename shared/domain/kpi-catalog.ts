import { KPI_INIT } from "./kpi-configs.js";
import type { KpiTag } from "./types.js";

const KPI_ALIASES: Record<string, string> = {
  "Pipeline deals active": "Total active jobs",
  "Material ordered pending": "Material orders pending",
  "HOA pending approvals": "HOA approvals pending",
  "Net metering backlog": "Net metering pending",
};

function byName(name: string): KpiTag | undefined {
  return KPI_INIT.find((kpi) => kpi.name === name);
}

export const KpiCatalog = {
  list(): KpiTag[] {
    return KPI_INIT;
  },

  aliases(): Record<string, string> {
    return { ...KPI_ALIASES };
  },

  canonicalName(name: string): string | null {
    if (byName(name)) return name;
    const canonical = KPI_ALIASES[name];
    return canonical && byName(canonical) ? canonical : null;
  },

  findByName(name: string): KpiTag | null {
    const canonical = this.canonicalName(name);
    return canonical ? byName(canonical) ?? null : null;
  },
};
