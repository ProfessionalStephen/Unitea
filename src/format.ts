// Date display helpers — little-endian (day-first) everywhere: DD/MM/YYYY, DD/MM/YYYY HH:MM, MM/YYYY.
// Keep all user-facing dates going through these so the format stays consistent across the app.
function pad(n: number): string { return String(n).padStart(2, "0"); }

// Calendar date -> DD/MM/YYYY. Accepts "YYYY-MM-DD"/ISO string or Date. YMD strings are parsed
// directly (no Date object) to avoid timezone off-by-one. Unrecognized strings pass through unchanged.
export function dmy(input: string | Date | null | undefined): string {
  if (input == null || input === "") return "";
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return "";
    return `${pad(input.getDate())}/${pad(input.getMonth() + 1)}/${input.getFullYear()}`;
  }
  const m = String(input).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Timestamp -> DD/MM/YYYY HH:MM (local). No arg = now.
export function dmyTime(input?: string | Date | null): string {
  const d = input == null ? new Date() : (input instanceof Date ? input : new Date(input));
  if (isNaN(d.getTime())) return String(input ?? "");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "YYYY-MM"(-DD) -> "MM/YYYY", or "MM/YY" when shortYear.
export function monthYear(ym: string, shortYear = false): string {
  const m = String(ym).match(/^(\d{4})-(\d{2})/);
  if (!m) return String(ym);
  return `${m[2]}/${shortYear ? m[1].slice(2) : m[1]}`;
}
