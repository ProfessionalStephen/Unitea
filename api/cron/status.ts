import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSession } from "../_lib/session.js";
import { emailedTeam } from "../../shared/domain/index.js";

const TEAM = emailedTeam();

// Cron schedule lives in vercel.json — hardcode the parsed equivalent here.
// Update both if you change vercel.json.
const CRON_HOUR_UTC = 11;        // "0 11 * * 1-5"
const CRON_MINUTE_UTC = 0;
const CRON_WEEKDAYS_ONLY = true;

function nextRunIso(): string {
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const candidate = new Date(now);
    candidate.setUTCDate(candidate.getUTCDate() + i);
    candidate.setUTCHours(CRON_HOUR_UTC, CRON_MINUTE_UTC, 0, 0);
    if (candidate.getTime() <= now.getTime()) continue;
    if (CRON_WEEKDAYS_ONLY) {
      const day = candidate.getUTCDay();
      if (day === 0 || day === 6) continue; // skip Sat/Sun in UTC
    }
    return candidate.toISOString();
  }
  return new Date().toISOString();
}

function formatEasternLabel(iso: string): string {
  const d = new Date(iso);
  // en-GB => day-first ("Mon 16 Jun, 06:00") to match the dashboard's DD/MM/YYYY convention.
  return d.toLocaleString("en-GB", {
    timeZone: "America/New_York",
    weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  }) + " ET";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  const paused = String(process.env.EMAILS_PAUSED || "").toLowerCase() === "true";
  const testRecipient = process.env.CRON_TEST_RECIPIENT || null;

  // Compute who would receive given current toggles
  let effectiveRecipients: { name: string; email: string; title: string }[] = [];
  let mode: "paused" | "test" | "live" = "live";
  let reason: string | null = null;

  if (paused) {
    mode = "paused";
    reason = "EMAILS_PAUSED=true";
  } else if (testRecipient) {
    mode = "test";
    const match = TEAM.find((m) => m.email.toLowerCase() === testRecipient.toLowerCase());
    if (match) {
      effectiveRecipients = [{ name: match.name, email: match.email, title: match.title }];
      reason = `CRON_TEST_RECIPIENT=${testRecipient}`;
    } else {
      mode = "paused";
      reason = `CRON_TEST_RECIPIENT=${testRecipient} doesn't match any team member — cron will error`;
    }
  } else {
    effectiveRecipients = TEAM.map((m) => ({
      name: m.name, email: m.email, title: m.title,
    }));
  }

  const nextRun = nextRunIso();
  const pipedriveConfigured = !!(process.env.PIPEDRIVE_API_KEY && process.env.PIPEDRIVE_DOMAIN);
  const blobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

  return res.status(200).json({
    mode,                                    // "paused" | "test" | "live"
    reason,                                  // human-readable why
    paused,                                  // raw env value
    testRecipient,                           // raw env value
    recipientCount: effectiveRecipients.length,
    recipients: effectiveRecipients,
    totalTeamSize: TEAM.length,
    nextRunIso: nextRun,
    nextRunLabel: formatEasternLabel(nextRun),
    cronScheduleUtc: `${CRON_MINUTE_UTC.toString().padStart(2,"0")}:${CRON_HOUR_UTC.toString().padStart(2,"0")} UTC weekdays`,
    pipedriveConfigured,
    blobConfigured,
    fetchedAt: new Date().toISOString(),
  });
}
