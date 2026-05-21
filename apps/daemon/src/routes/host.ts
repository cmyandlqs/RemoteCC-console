import type { FastifyInstance } from "fastify";

import type { HostService } from "../modules/host/host-service.js";

export async function registerHostRoutes(
  app: FastifyInstance,
  hostService: HostService,
): Promise<void> {
  app.get("/api/host/info", async () => {
    await hostService.refreshExternalStates();
    return { data: hostService.getSummary() };
  });

  app.get("/api/host/health", async () => {
    return { data: hostService.getHealth() };
  });

  app.get("/api/host/ping", async () => {
    return { data: { timestamp: Date.now() } };
  });

  app.get("/api/host", async () => {
    await hostService.refreshExternalStates();
    return { data: hostService.getSummary() };
  });
}
