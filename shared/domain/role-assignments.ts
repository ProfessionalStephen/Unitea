import { RT } from "./roles.js";
import { KpiCatalog } from "./kpi-catalog.js";
import type { RoleConfig } from "./types.js";

export type OrphanRef = {
  role: string;
  kpi: string;
};

type RoleTable = Record<string, RoleConfig>;

export const RoleAssignments = {
  kpisForRole(role: string, roles: RoleTable = RT): string[] {
    return roles[role] ? roles[role].kpis : [];
  },

  validateAssignments(roles: RoleTable = RT): OrphanRef[] {
    const orphans: OrphanRef[] = [];
    for (const [role, config] of Object.entries(roles)) {
      for (const kpi of config.kpis) {
        if (!KpiCatalog.findByName(kpi)) {
          orphans.push({ role, kpi });
        }
      }
    }
    return orphans;
  },

  rolesUsingKpi(name: string, roles: RoleTable = RT): string[] {
    const canonical = KpiCatalog.canonicalName(name);
    if (!canonical) return [];

    return Object.entries(roles)
      .filter(([, config]) =>
        config.kpis.some((kpi) => KpiCatalog.canonicalName(kpi) === canonical),
      )
      .map(([role]) => role);
  },
};
