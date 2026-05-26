// ─────────────────────────────────────────────────────────────
// PIPEDRIVE ADMIN CLIENT
//
// Write-side Pipedrive REST API client used by the setup,
// classify, and migrate scripts in scripts/pipedrive-*.ts.
//
// Separate from api/_lib/pipedrive.ts which is read-only and
// scoped to the dashboard's runtime.
//
// Tests inject a custom `fetch` for isolation. Production code
// reads PIPEDRIVE_API_KEY + PIPEDRIVE_DOMAIN from environment.
// ─────────────────────────────────────────────────────────────

export interface PipedriveAdminConfig {
  apiKey: string;
  domain: string; // e.g. "unicity"
  fetch?: typeof fetch;
}

export interface Pipeline {
  id: number;
  name: string;
}

export interface Stage {
  id: number;
  name: string;
  orderNr: number;
}

export interface Deal {
  id: number;
  title: string;
  pipelineId: number;
  stageId: number;
}

export interface DealPatch {
  pipelineId?: number;
  stageId?: number;
}

export interface PipedriveAdmin {
  listPipelines(): Promise<Pipeline[]>;
  createPipeline(name: string): Promise<number>;
  listStages(pipelineId: number): Promise<Stage[]>;
  createStage(pipelineId: number, name: string, orderNr: number): Promise<number>;
  listDeals(pipelineId?: number): Promise<Deal[]>;
  updateDeal(dealId: number, patch: DealPatch): Promise<boolean>;
}

export function createPipedriveAdmin(config: PipedriveAdminConfig): PipedriveAdmin {
  const fetchFn = config.fetch ?? globalThis.fetch;
  const base = `https://${config.domain}.pipedrive.com/api/v1`;

  return {
    async listPipelines(): Promise<Pipeline[]> {
      const res = await fetchFn(`${base}/pipelines?api_token=${config.apiKey}`);
      if (!res.ok) throw new Error(`listPipelines failed: ${res.status}`);
      const body = (await res.json()) as { success: boolean; data: Pipeline[] };
      return body.data.map((p) => ({ id: p.id, name: p.name }));
    },

    async createPipeline(name: string): Promise<number> {
      const existing = await this.listPipelines();
      const match = existing.find((p) => p.name === name);
      if (match) return match.id;

      const res = await fetchFn(`${base}/pipelines?api_token=${config.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`createPipeline failed: ${res.status}`);
      const body = (await res.json()) as { success: boolean; data: { id: number } };
      return body.data.id;
    },

    async listStages(pipelineId: number): Promise<Stage[]> {
      const res = await fetchFn(`${base}/stages?pipeline_id=${pipelineId}&api_token=${config.apiKey}`);
      if (!res.ok) throw new Error(`listStages failed: ${res.status}`);
      const body = (await res.json()) as {
        success: boolean;
        data: Array<{ id: number; name: string; order_nr: number }>;
      };
      return body.data
        .map((s) => ({ id: s.id, name: s.name, orderNr: s.order_nr }))
        .sort((a, b) => a.orderNr - b.orderNr);
    },

    async createStage(pipelineId: number, name: string, orderNr: number): Promise<number> {
      const existing = await this.listStages(pipelineId);
      const match = existing.find((s) => s.name === name);
      if (match) return match.id;

      const res = await fetchFn(`${base}/stages?api_token=${config.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, order_nr: orderNr, pipeline_id: pipelineId }),
      });
      if (!res.ok) throw new Error(`createStage failed: ${res.status}`);
      const body = (await res.json()) as { success: boolean; data: { id: number } };
      return body.data.id;
    },

    async listDeals(pipelineId?: number): Promise<Deal[]> {
      const url =
        pipelineId !== undefined
          ? `${base}/deals?pipeline_id=${pipelineId}&api_token=${config.apiKey}`
          : `${base}/deals?api_token=${config.apiKey}`;
      const res = await fetchFn(url);
      if (!res.ok) throw new Error(`listDeals failed: ${res.status}`);
      const body = (await res.json()) as {
        success: boolean;
        data: Array<{ id: number; title: string; pipeline_id: number; stage_id: number }>;
      };
      return body.data.map((d) => ({
        id: d.id,
        title: d.title,
        pipelineId: d.pipeline_id,
        stageId: d.stage_id,
      }));
    },

    async updateDeal(dealId: number, patch: DealPatch): Promise<boolean> {
      // Idempotency: GET current state, skip PUT if patch matches
      const currentRes = await fetchFn(`${base}/deals/${dealId}?api_token=${config.apiKey}`);
      if (!currentRes.ok) throw new Error(`updateDeal: GET failed: ${currentRes.status}`);
      const currentBody = (await currentRes.json()) as {
        success: boolean;
        data: { id: number; pipeline_id: number; stage_id: number };
      };
      const current = currentBody.data;

      const samePipeline = patch.pipelineId === undefined || patch.pipelineId === current.pipeline_id;
      const sameStage = patch.stageId === undefined || patch.stageId === current.stage_id;
      if (samePipeline && sameStage) return false; // no-op

      const apiBody: Record<string, number> = {};
      if (patch.pipelineId !== undefined) apiBody.pipeline_id = patch.pipelineId;
      if (patch.stageId !== undefined) apiBody.stage_id = patch.stageId;

      const res = await fetchFn(`${base}/deals/${dealId}?api_token=${config.apiKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });
      if (!res.ok) throw new Error(`updateDeal failed: ${res.status}`);
      return true;
    },
  };
}
