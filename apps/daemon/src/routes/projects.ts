import type { FastifyInstance } from "fastify";

import {
  ProjectService,
  ProjectServiceError,
} from "../modules/projects/project-service.js";

type CreateProjectBody = {
  name: string;
  rootPath: string;
};

export async function registerProjectRoutes(
  app: FastifyInstance,
  projectService: ProjectService,
): Promise<void> {
  app.get("/api/projects", async () => {
    return { data: projectService.list() };
  });

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
        const project = projectService.create({ name, rootPath });
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
}
