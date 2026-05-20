import type { FastifyInstance } from "fastify";

import { HostService } from "../modules/host/host-service.js";

export async function registerHostRoutes(app: FastifyInstance): Promise<void> {
  const hostService = new HostService();

  app.get("/api/host", async () => {
    return { data: hostService.getSummary() };
  });
}
