// ─────────────────────────────────────────────────────────────
// SHARED DOMAIN — TEAM ROSTER
// Full 30-person org chart. Members with empty email are visible
// in the UI roster but skipped by cron sends.
//
// Cron uses: TEAM_INIT.filter(m => m.email) — gives ~9 active recipients.
// Frontend uses: full TEAM_INIT — shows everyone including non-emailed.
//
// Adding a teammate:
//   1. Append entry below with next-available id, role from RT
//   2. boards/kpis fields are derived from role via boardsForRole/kpisForRole
//   3. If role is new, add to RT in roles.ts first
// ─────────────────────────────────────────────────────────────

import type { TeamMember } from "./types.js";
import { boardsForRole, kpisForRole } from "./roles.js";

function member(
  partial: Omit<TeamMember, "boards" | "kpis">
): TeamMember {
  return {
    ...partial,
    boards: boardsForRole(partial.role),
    kpis: kpisForRole(partial.role),
  };
}

export const TEAM_INIT: TeamMember[] = [
  member({ id: 1,  name: "Jordan Lee",      title: "Owner",                       role: "Owner",                       email: "jordan@unicitysolar.com",     manager: "",          region: "Both", nested: true,  sendFreq: "daily", hours: "24/7" }),
  member({ id: 2,  name: "Mallory Amend",   title: "COO",                         role: "COO",                         email: "mamend@unicitysolar.com",     manager: "Dan",       region: "Both", nested: true,  sendFreq: "daily", hours: "24/7" }),
  member({ id: 30, name: "Josh Labarre",    title: "VP of Operations",            role: "VP of Operations",            email: "josh@unicitysolar.com",       manager: "Mallory",   region: "Both", nested: true,  sendFreq: "daily", hours: "24/7" }),
  member({ id: 3,  name: "Julie Schultz",   title: "Office Manager",              role: "Office Manager",              email: "jschultz@unicitysolar.com",   manager: "Mallory",   region: "Both", nested: false, sendFreq: "daily", hours: "7AM-3PM" }),
  member({ id: 4,  name: "Val Martin",      title: "Office Administrator",        role: "Office Administrator",        email: "",                             manager: "Mallory",   region: "Both", nested: false, sendFreq: "daily", hours: "7AM-3PM" }),
  member({ id: 5,  name: "Julio Valdes",    title: "Installation Manager",        role: "Installation Manager",        email: "jvaldes@unicitysolar.com",    manager: "Mallory",   region: "FL",   nested: false, sendFreq: "daily", hours: "5:30AM-3PM" }),
  member({ id: 6,  name: "Aidon Paris",     title: "Warehouse Manager",           role: "Warehouse Manager",           email: "aparis@unicitysolar.com",     manager: "Mallory",   region: "FL",   nested: true,  sendFreq: "daily", hours: "5:30AM-3PM" }),
  member({ id: 7,  name: "Ro Mora",         title: "Service Manager",             role: "Service Manager",             email: "",                             manager: "Mallory",   region: "FL",   nested: false, sendFreq: "daily", hours: "5:30AM-3PM" }),
  member({ id: 8,  name: "Autumn Wilson",   title: "Service Coordinator",         role: "Service Coordinator",         email: "",                             manager: "Ro Mora",   region: "FL",   nested: false, sendFreq: "daily", hours: "8AM-4PM" }),
  member({ id: 9,  name: "Anthony Cowan",   title: "Engineering Coordinator",     role: "Engineering Coordinator",     email: "acowan@unicitysolar.com",     manager: "Julie",     region: "FL",   nested: false, sendFreq: "daily", hours: "8AM-4PM" }),
  member({ id: 10, name: "Heather Pennoyer", title: "Permitting Coordinator",      role: "Permitting Coordinator",      email: "",                             manager: "Julie",     region: "FL",   nested: false, sendFreq: "daily", hours: "8AM-4PM" }),
  member({ id: 11, name: "Anjulik Texteira", title: "Permitting Coordinator",      role: "Permitting Coordinator",      email: "",                             manager: "Julie",     region: "FL",   nested: false, sendFreq: "daily", hours: "7AM-3PM" }),
  member({ id: 12, name: "Matt Bloemer",    title: "Scheduling Coordinator",      role: "Scheduling Coordinator",      email: "",                             manager: "Julie",     region: "FL",   nested: false, sendFreq: "daily", hours: "8AM-4PM" }),
  member({ id: 13, name: "John",            title: "Inspection Coordinator",      role: "Inspection Coordinator",      email: "",                             manager: "Julie",     region: "FL",   nested: false, sendFreq: "daily", hours: "7AM-3PM" }),
  member({ id: 14, name: "Odin",            title: "Inspection Coordinator",      role: "Inspection Coordinator",      email: "",                             manager: "Julie",     region: "FL",   nested: false, sendFreq: "daily", hours: "7AM-3PM" }),
  member({ id: 15, name: "Kristina Solis",  title: "Net Metering Coordinator",    role: "Net Metering Coordinator",    email: "",                             manager: "Julie",     region: "FL",   nested: false, sendFreq: "daily", hours: "7AM-3PM" }),
  member({ id: 16, name: "Felicia",         title: "Net Metering Coordinator",    role: "Net Metering Coordinator",    email: "",                             manager: "Julie",     region: "FL",   nested: false, sendFreq: "daily", hours: "7AM-3PM" }),
  member({ id: 17, name: "Brissa",          title: "Receptionist",                role: "Receptionist",                email: "",                             manager: "Julie",     region: "FL",   nested: false, sendFreq: "daily", hours: "8AM-4PM" }),
  member({ id: 18, name: "Dan Sperruzzi",   title: "President of Sales",          role: "President of Sales",          email: "dsperruzzi@unicitysolar.com", manager: "",          region: "Both", nested: true,  sendFreq: "daily", hours: "24/7" }),
  member({ id: 19, name: "Aaron Clements",  title: "Sales Relations Manager",     role: "Sales Relations Manager",     email: "",                             manager: "Dan",       region: "Both", nested: false, sendFreq: "daily", hours: "Varies" }),
  member({ id: 20, name: "Freddie",         title: "Account Manager",             role: "Account Manager",             email: "",                             manager: "Aaron",     region: "Both", nested: false, sendFreq: "daily", hours: "Varies" }),
  member({ id: 21, name: "Erika",           title: "Account Manager",             role: "Account Manager",             email: "",                             manager: "Aaron",     region: "Both", nested: false, sendFreq: "daily", hours: "Varies" }),
  member({ id: 22, name: "Amanda Biondi",   title: "After Hours Account Manager", role: "After Hours Account Manager", email: "",                             manager: "Aaron",     region: "Both", nested: false, sendFreq: "daily", hours: "Varies" }),
  member({ id: 23, name: "Rick Sperruzzi",  title: "Onboarding Coordinator",      role: "Onboarding Coordinator",      email: "",                             manager: "Dan",       region: "Both", nested: false, sendFreq: "daily", hours: "Varies" }),
  member({ id: 24, name: "Ella",            title: "Accounting Manager",          role: "Accounting Manager",          email: "",                             manager: "Dan",       region: "Both", nested: false, sendFreq: "daily", hours: "7AM-3PM" }),
  member({ id: 25, name: "Austin Richman",  title: "Commissions Coordinator",     role: "Commissions Coordinator",     email: "",                             manager: "Dan",       region: "Both", nested: false, sendFreq: "daily", hours: "8AM-4PM" }),
  member({ id: 26, name: "Christina Graham", title: "Director of Finance",         role: "Director of Finance",         email: "",                             manager: "Mallory",   region: "Both", nested: true,  sendFreq: "daily", hours: "8AM-4PM" }),
  member({ id: 27, name: "Jay Johnson",     title: "Funding Coordinator",         role: "Funding Coordinator",         email: "",                             manager: "Christina", region: "Both", nested: false, sendFreq: "daily", hours: "7AM-3PM" }),
  member({ id: 28, name: "Aidon Paris",     title: "AI Engineer",                 role: "AI Engineer",                 email: "aparis@unicitysolar.com",     manager: "",          region: "Both", nested: true,  sendFreq: "daily", hours: "5:30AM-3PM" }),
  member({ id: 29, name: "Stephen Farrell", title: "AI Back-End Developer",       role: "AI Back-End Developer",       email: "stephen@unicityhome.com",     manager: "",          region: "Both", nested: true,  sendFreq: "daily", hours: "Varies" }),
];

// Cron helper: get just the members with email addresses
export function emailedTeam(): TeamMember[] {
  return TEAM_INIT.filter((m) => m.email);
}
