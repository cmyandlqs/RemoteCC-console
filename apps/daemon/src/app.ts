import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import Database from "better-sqlite3";

import { createDatabase } from "./infra/database.js";
import { ensureDataDirs, getDbPath } from "./infra/paths.js";
import { runMigrations } from "./infra/migrations.js";
import { EventBus } from "./infra/event-bus.js";
import { CliClaudeAdapter } from "@agent-console/claude-adapter";
import { ProjectService } from "./modules/projects/project-service.js";
import { SessionService } from "./modules/sessions/session-service.js";
import { SessionSupervisor } from "./modules/sessions/session-supervisor.js";
import { ApprovalService } from "./modules/approvals/approval-service.js";
import { FileChangeService } from "./modules/sessions/file-change-service.js";
import { GitService } from "./modules/git/git-service.js";
import { HostService } from "./modules/host/host-service.js";
import { AuthService } from "./modules/auth/auth-service.js";
import { createAuthHook } from "./modules/auth/auth-middleware.js";
import { registerHostRoutes } from "./routes/host.js";
import { registerProjectRoutes } from "./routes/projects.js";
import { registerRealtimeRoutes } from "./routes/ws.js";
import { registerSessionRoutes } from "./routes/sessions.js";
import { registerApprovalRoutes } from "./routes/approvals.js";
import { registerGitRoutes } from "./routes/git.js";
import { registerAuthRoutes } from "./routes/auth.js";

export async function buildServer() {
  ensureDataDirs();
  const dbPath = getDbPath();

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  runMigrations(sqlite);

  const db = createDatabase(dbPath);
  const eventBus = new EventBus();
  const adapter = new CliClaudeAdapter();

  const gitService = new GitService();
  const projectService = new ProjectService(db, gitService);
  const sessionService = new SessionService(db);
  const hostService = new HostService(sessionService);
  const approvalService = new ApprovalService(db, eventBus);
  const fileChangeService = new FileChangeService(db, eventBus);
  const authService = new AuthService(db);
  const supervisor = new SessionSupervisor(
    sessionService,
    projectService,
    adapter,
    eventBus,
    approvalService,
  );
  const requireAuth = createAuthHook(authService);

  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: ["http://localhost:4173", "http://localhost:4174"],
  });
  await app.register(websocket);

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = reply.statusCode >= 400 ? reply.statusCode : 500;
    reply.code(statusCode);
    return { error: { code: "INTERNAL_ERROR", message: "服务器内部错误" } };
  });

  await registerAuthRoutes(app, authService);
  await registerHostRoutes(app, hostService);
  await registerProjectRoutes(app, projectService);

  app.addHook("preHandler", (request, reply, done) => {
    if (
      request.url.startsWith("/api/sessions") ||
      request.url.startsWith("/api/approvals")
    ) {
      requireAuth(request, reply, done);
    } else {
      done();
    }
  });

  await registerSessionRoutes(app, projectService, sessionService, supervisor);
  await registerApprovalRoutes(app, approvalService);
  await registerGitRoutes(app, projectService, gitService, fileChangeService);
  await registerRealtimeRoutes(app, eventBus, authService);

  app.addHook("onClose", async () => {
    app.log.info("Closing database connection");
    sqlite.close();
  });

  await hostService.runStartupCheck((msg) => app.log.info(msg));
  await supervisor.markRunningAsDisconnected();

  return app;
}
