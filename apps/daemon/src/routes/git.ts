import type { FastifyInstance } from "fastify";

import { GitService } from "../modules/git/git-service.js";
import { FileChangeService } from "../modules/sessions/file-change-service.js";
import {
  ProjectService,
  ProjectServiceError,
} from "../modules/projects/project-service.js";

export async function registerGitRoutes(
  app: FastifyInstance,
  projectService: ProjectService,
  gitService: GitService,
  fileChangeService: FileChangeService,
): Promise<void> {
  app.get<{ Params: { projectId: string } }>(
    "/api/projects/:projectId/git-status",
    async (request, reply) => {
      try {
        const project = projectService.getById(request.params.projectId);
        const status = await gitService.getStatus(project.rootPath);
        return { data: status };
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

  app.get<{ Params: { projectId: string } }>(
    "/api/projects/:projectId/diff",
    async (request, reply) => {
      try {
        const project = projectService.getById(request.params.projectId);
        const diff = await gitService.getDiff(project.rootPath);
        return { data: { diff } };
      } catch (error) {
        if (error instanceof ProjectServiceError) {
          reply.code(404);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
    },
  );

  app.get<{ Params: { sessionId: string } }>(
    "/api/sessions/:sessionId/file-changes",
    async (request) => {
      const changes = fileChangeService.listBySession(request.params.sessionId);
      return { data: changes };
    },
  );
}
