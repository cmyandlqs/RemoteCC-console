import type { FastifyInstance } from "fastify";

import {
  ProjectService,
  ProjectServiceError,
} from "../modules/projects/project-service.js";
import { SessionService } from "../modules/sessions/session-service.js";

type CreateSessionBody = {
  title?: string;
};

export async function registerSessionRoutes(
  app: FastifyInstance,
  projectService: ProjectService,
  sessionService: SessionService,
): Promise<void> {
  app.get<{ Params: { projectId: string } }>(
    "/api/projects/:projectId/sessions",
    async (request, reply) => {
      try {
        projectService.getById(request.params.projectId);
        return { data: sessionService.listByProject(request.params.projectId) };
      } catch (error) {
        if (error instanceof ProjectServiceError) {
          const statusCode = error.code === "PROJECT_DISABLED" ? 403 : 404;
          reply.code(statusCode);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
    },
  );

  app.post<{ Params: { projectId: string }; Body: CreateSessionBody }>(
    "/api/projects/:projectId/sessions",
    async (request, reply) => {
      try {
        projectService.getById(request.params.projectId);
        const session = sessionService.create(
          request.params.projectId,
          request.body.title ?? "新会话",
        );
        reply.code(201);
        return { data: session };
      } catch (error) {
        if (error instanceof ProjectServiceError) {
          const statusCode = error.code === "PROJECT_DISABLED" ? 403 : 404;
          reply.code(statusCode);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
    },
  );
}
