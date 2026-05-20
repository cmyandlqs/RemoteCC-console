import websocket from "@fastify/websocket";
import Fastify from "fastify";

import { ProjectService } from "./modules/projects/project-service.js";
import { SessionService } from "./modules/sessions/session-service.js";
import { registerHostRoutes } from "./routes/host.js";
import { registerProjectRoutes } from "./routes/projects.js";
import { registerRealtimeRoutes } from "./routes/ws.js";
import { registerSessionRoutes } from "./routes/sessions.js";

export async function buildServer() {
  const app = Fastify({ logger: true });
  const projectService = new ProjectService();
  const sessionService = new SessionService();

  await app.register(websocket);
  await registerHostRoutes(app);
  await registerProjectRoutes(app, projectService);
  await registerSessionRoutes(app, projectService, sessionService);
  await registerRealtimeRoutes(app);

  return app;
}
