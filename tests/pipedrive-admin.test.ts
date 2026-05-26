import { describe, it, expect } from "vitest";
import { createPipedriveAdmin } from "../scripts/_lib/pipedrive-admin.js";

describe("pipedrive-admin", () => {
  describe("listPipelines", () => {
    it("returns pipelines parsed from Pipedrive's response", async () => {
      const mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [
            { id: 1, name: "Customer Service" },
            { id: 2, name: "New Sale" },
          ],
        }),
      }) as unknown as Response;

      const admin = createPipedriveAdmin({
        apiKey: "test-key",
        domain: "test",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const pipelines = await admin.listPipelines();
      expect(pipelines).toEqual([
        { id: 1, name: "Customer Service" },
        { id: 2, name: "New Sale" },
      ]);
    });
  });

  describe("createPipeline", () => {
    it("returns the numeric ID of the newly created pipeline", async () => {
      const mockFetch = async (url: string | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        const urlStr = url.toString();

        if (method === "GET" && urlStr.includes("/pipelines")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: [] }),
          } as unknown as Response;
        }

        if (method === "POST" && urlStr.includes("/pipelines")) {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          return {
            ok: true,
            status: 201,
            json: async () => ({
              success: true,
              data: { id: 42, name: body.name, order_nr: 0 },
            }),
          } as unknown as Response;
        }

        throw new Error(`Unexpected ${method} ${urlStr}`);
      };

      const admin = createPipedriveAdmin({
        apiKey: "test-key",
        domain: "test",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const id = await admin.createPipeline("Engineering");
      expect(id).toBe(42);
    });

    it("is idempotent — returns existing ID when name already exists, no duplicate POST", async () => {
      const calls: Array<{ method: string; url: string }> = [];
      const mockFetch = async (url: string | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        const urlStr = url.toString();
        calls.push({ method, url: urlStr });

        if (method === "GET" && urlStr.includes("/pipelines")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: [{ id: 7, name: "Engineering" }],
            }),
          } as unknown as Response;
        }
        throw new Error(`Unexpected ${method} ${urlStr}`);
      };

      const admin = createPipedriveAdmin({
        apiKey: "test-key",
        domain: "test",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const id = await admin.createPipeline("Engineering");
      expect(id).toBe(7);
      expect(calls.filter((c) => c.method === "POST")).toEqual([]);
    });
  });

  describe("listStages", () => {
    it("returns stages for a pipeline in order_nr ascending", async () => {
      const mockFetch = async (url: string | URL) => {
        const urlStr = url.toString();
        if (urlStr.includes("/stages") && urlStr.includes("pipeline_id=7")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: [
                { id: 22, name: "Revisions", order_nr: 1, pipeline_id: 7 },
                { id: 21, name: "Ready for Engineering", order_nr: 0, pipeline_id: 7 },
                { id: 23, name: "Quality Control", order_nr: 2, pipeline_id: 7 },
              ],
            }),
          } as unknown as Response;
        }
        throw new Error(`Unexpected URL: ${urlStr}`);
      };

      const admin = createPipedriveAdmin({
        apiKey: "test-key",
        domain: "test",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const stages = await admin.listStages(7);
      expect(stages).toEqual([
        { id: 21, name: "Ready for Engineering", orderNr: 0 },
        { id: 22, name: "Revisions", orderNr: 1 },
        { id: 23, name: "Quality Control", orderNr: 2 },
      ]);
    });
  });

  describe("createStage", () => {
    it("returns numeric ID of newly created stage", async () => {
      const mockFetch = async (url: string | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        const urlStr = url.toString();

        if (method === "GET" && urlStr.includes("/stages")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: [] }),
          } as unknown as Response;
        }
        if (method === "POST" && urlStr.includes("/stages")) {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          return {
            ok: true,
            status: 201,
            json: async () => ({
              success: true,
              data: { id: 99, name: body.name, order_nr: body.order_nr, pipeline_id: body.pipeline_id },
            }),
          } as unknown as Response;
        }
        throw new Error(`Unexpected ${method} ${urlStr}`);
      };

      const admin = createPipedriveAdmin({
        apiKey: "test-key",
        domain: "test",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const id = await admin.createStage(7, "Permit Approved", 5);
      expect(id).toBe(99);
    });

    it("is idempotent — returns existing stage ID when name already exists in that pipeline", async () => {
      const calls: Array<{ method: string }> = [];
      const mockFetch = async (url: string | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        calls.push({ method });
        const urlStr = url.toString();

        if (method === "GET" && urlStr.includes("/stages")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: [{ id: 88, name: "Permit Approved", order_nr: 5, pipeline_id: 7 }],
            }),
          } as unknown as Response;
        }
        throw new Error(`Unexpected ${method} ${urlStr}`);
      };

      const admin = createPipedriveAdmin({
        apiKey: "test-key",
        domain: "test",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const id = await admin.createStage(7, "Permit Approved", 5);
      expect(id).toBe(88);
      expect(calls.filter((c) => c.method === "POST")).toEqual([]);
    });
  });

  describe("listDeals", () => {
    it("returns deals filtered by pipeline when pipelineId provided", async () => {
      const mockFetch = async (url: string | URL) => {
        const urlStr = url.toString();
        if (urlStr.includes("/deals") && urlStr.includes("pipeline_id=7")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: [
                { id: 100, title: "Smith install", pipeline_id: 7, stage_id: 21 },
                { id: 101, title: "Jones install", pipeline_id: 7, stage_id: 22 },
              ],
            }),
          } as unknown as Response;
        }
        throw new Error(`Unexpected URL: ${urlStr}`);
      };

      const admin = createPipedriveAdmin({
        apiKey: "test-key",
        domain: "test",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const deals = await admin.listDeals(7);
      expect(deals).toEqual([
        { id: 100, title: "Smith install", pipelineId: 7, stageId: 21 },
        { id: 101, title: "Jones install", pipelineId: 7, stageId: 22 },
      ]);
    });

    it("returns all deals when pipelineId omitted", async () => {
      const mockFetch = async (url: string | URL) => {
        const urlStr = url.toString();
        if (urlStr.includes("/deals") && !urlStr.includes("pipeline_id=")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: [
                { id: 100, title: "A", pipeline_id: 1, stage_id: 10 },
                { id: 200, title: "B", pipeline_id: 2, stage_id: 20 },
              ],
            }),
          } as unknown as Response;
        }
        throw new Error(`Unexpected URL: ${urlStr}`);
      };

      const admin = createPipedriveAdmin({
        apiKey: "test-key",
        domain: "test",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const deals = await admin.listDeals();
      expect(deals).toHaveLength(2);
    });
  });

  describe("updateDeal", () => {
    it("PUTs the patch and returns true when patch differs from current state", async () => {
      const calls: Array<{ method: string }> = [];
      const mockFetch = async (url: string | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        calls.push({ method });
        const urlStr = url.toString();

        if (method === "GET" && urlStr.includes("/deals/100")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: { id: 100, title: "Smith", pipeline_id: 1, stage_id: 5 },
            }),
          } as unknown as Response;
        }
        if (method === "PUT" && urlStr.includes("/deals/100")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: { id: 100 } }),
          } as unknown as Response;
        }
        throw new Error(`Unexpected ${method} ${urlStr}`);
      };

      const admin = createPipedriveAdmin({
        apiKey: "test-key",
        domain: "test",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const changed = await admin.updateDeal(100, { pipelineId: 7, stageId: 21 });
      expect(changed).toBe(true);
      expect(calls.filter((c) => c.method === "PUT")).toHaveLength(1);
    });

    it("is idempotent — returns false without PUT when patch matches current state", async () => {
      const calls: Array<{ method: string }> = [];
      const mockFetch = async (url: string | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        calls.push({ method });
        const urlStr = url.toString();

        if (method === "GET" && urlStr.includes("/deals/100")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: { id: 100, title: "Smith", pipeline_id: 7, stage_id: 21 },
            }),
          } as unknown as Response;
        }
        throw new Error(`Unexpected ${method} ${urlStr}`);
      };

      const admin = createPipedriveAdmin({
        apiKey: "test-key",
        domain: "test",
        fetch: mockFetch as unknown as typeof fetch,
      });

      const changed = await admin.updateDeal(100, { pipelineId: 7, stageId: 21 });
      expect(changed).toBe(false);
      expect(calls.filter((c) => c.method === "PUT")).toEqual([]);
    });
  });
});
