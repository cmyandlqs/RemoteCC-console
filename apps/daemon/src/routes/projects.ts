import type { FastifyInstance } from "fastify";

import {
  ProjectService,
  ProjectServiceError,
} from "../modules/projects/project-service.js";

type CreateProjectBody = {
  name: string;
  rootPath: string;
};

type UpdateProjectBody = {
  name?: string;
  isEnabled?: boolean;
};

export async function registerProjectRoutes(
  app: FastifyInstance,
  projectService: ProjectService,
): Promise<void> {
  app.get("/api/projects", async () => {
    return { data: await projectService.list() };
  });

  app.get<{ Params: { projectId: string } }>(
    "/api/projects/:projectId",
    async (request, reply) => {
      try {
        const project = projectService.getById(request.params.projectId);
        return { data: project };
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

  app.post<{ Body: CreateProjectBody }>(
    "/api/projects",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "rootPath"],
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1 },
            rootPath: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { name, rootPath } = request.body;
        const project = await projectService.create({ name, rootPath });
        reply.code(201);
        return { data: project };
      } catch (error) {
        if (error instanceof ProjectServiceError) {
          const statusCode = error.code === "DUPLICATE_PATH" ? 409 : 400;
          reply.code(statusCode);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
    },
  );

  app.patch<{ Params: { projectId: string }; Body: UpdateProjectBody }>(
    "/api/projects/:projectId",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1 },
            isEnabled: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const project = await projectService.update(
          request.params.projectId,
          request.body,
        );
        return { data: project };
      } catch (error) {
        if (error instanceof ProjectServiceError) {
          const statusCode =
            error.code === "PROJECT_NOT_FOUND" ? 404 : 400;
          reply.code(statusCode);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
    },
  );

  app.delete<{ Params: { projectId: string } }>(
    "/api/projects/:projectId",
    async (request, reply) => {
      try {
        await projectService.delete(request.params.projectId);
        reply.code(204);
      } catch (error) {
        if (error instanceof ProjectServiceError) {
          reply.code(404);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
    },
  );

  app.get<{ Params: { projectId: string }; Querystring: { path?: string } }>(
    "/api/projects/:projectId/files",
    async (request, reply) => {
      try {
        const { entries, currentPath } = await projectService.listFiles(
          request.params.projectId,
          request.query.path ?? ".",
        );
        return { data: { entries, currentPath } };
      } catch (error) {
        if (error instanceof ProjectServiceError) {
          const statusCode = error.code === "PROJECT_NOT_FOUND" ? 404 : 400;
          reply.code(statusCode);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
    },
  );
}
