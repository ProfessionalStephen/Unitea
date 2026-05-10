import type { VercelRequest, VercelResponse } from "@vercel/node";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "unicity_session";

// ─────────────────────────────────────────────
// Pipedrive proxy — read-only, server-side
// Aggregates pipelines / stages / deals into the
// shape the frontend expects from fetchPD():
// { boardData, totalDeals, pipelines }
// ─────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // ── Verify session ──
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
    if (!match) return res.status(401).json({ error: "Not signed in" });

    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) return res.status(500).json({ error: "Server not configured" });

    try {
        await jwtVerify(match[1], new TextEncoder().encode(sessionSecret));
    } catch {
        return res.status(401).json({ error: "Invalid session" });
    }

    // ── Verify Pipedrive credentials present ──
    const apiKey = process.env.PIPEDRIVE_API_KEY;
    const domain = process.env.PIPEDRIVE_DOMAIN;
    if (!apiKey || !domain) {
        return res.status(500).json({ error: "Pipedrive not configured. Set PIPEDRIVE_API_KEY and PIPEDRIVE_DOMAIN env vars." });
    }

    const baseUrl = `https://${domain}.pipedrive.com/api/v1`;

    // Helper: Pipedrive GET. Returns null on failure.
    async function pdGet(path: string): Promise<any> {
        const url = `${baseUrl}${path}${path.includes("?") ? "&" : "?"}api_token=${apiKey}`;
        const r = await fetch(url);
        if (!r.ok) {
            const text = await r.text();
            throw new Error(`Pipedrive ${path} ${r.status}: ${text.slice(0, 200)}`);
        }
        const j = await r.json();
        if (j && j.success === false) {
            throw new Error(`Pipedrive ${path}: ${j.error || "unknown error"}`);
        }
        return j.data;
    }

    try {
        // ── Fetch pipelines, stages, all open deals ──
        const [pipelines, stages, deals] = await Promise.all([
            pdGet("/pipelines"),
            pdGet("/stages"),
            pdGet("/deals?status=open&limit=500"),
        ]);

        const pipelinesArr = Array.isArray(pipelines) ? pipelines : [];
        const stagesArr = Array.isArray(stages) ? stages : [];
        const dealsArr = Array.isArray(deals) ? deals : [];

        // ── Build boardData keyed by pipeline name ──
        const boardData: Record<string, any> = {};

        pipelinesArr.forEach((p: any) => {
            const pipelineStages = stagesArr.filter((s: any) => s.pipeline_id === p.id);
            const pipelineDeals = dealsArr.filter((d: any) => d.pipeline_id === p.id);

            const stageRows = pipelineStages
                .sort((a: any, b: any) => (a.order_nr || 0) - (b.order_nr || 0))
                .map((s: any) => {
                    const stageDeals = pipelineDeals.filter((d: any) => d.stage_id === s.id);
                    const dealsOut = stageDeals.map((d: any) => {
                        const days = daysSince(d.stage_change_time || d.add_time);
                        return {
                            id: d.id,
                            name: d.title || `Deal ${d.id}`,
                            days,
                            pipedriveUrl: `https://${domain}.pipedrive.com/deal/${d.id}`,
                        };
                    });
                    const avgDays = dealsOut.length
                        ? Math.round(dealsOut.reduce((sum, d) => sum + d.days, 0) / dealsOut.length)
                        : 0;
                    return {
                        name: s.name,
                        count: dealsOut.length,
                        avgDays,
                        deals: dealsOut,
                    };
                });

            boardData[p.name] = {
                totalDeals: pipelineDeals.length,
                stages: stageRows,
            };
        });

        return res.status(200).json({
            success: true,
            totalDeals: dealsArr.length,
            pipelines: pipelinesArr.map((p: any) => ({ id: p.id, name: p.name })),
            boardData,
        });
    } catch (e: any) {
        const msg = e?.message || "unknown error";
        const isAuth = /401|403|unauthorized/i.test(msg);
        return res.status(isAuth ? 401 : 502).json({
            success: false,
            error: msg,
        });
    }
}

function daysSince(iso: string | null | undefined): number {
    if (!iso) return 0;
    const t = Date.parse(iso);
    if (isNaN(t)) return 0;
    const ms = Date.now() - t;
    return Math.max(0, Math.round(ms / 86400000));
}