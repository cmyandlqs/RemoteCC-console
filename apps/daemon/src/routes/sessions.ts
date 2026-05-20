import type { FastifyInstance } from "fastify";

import {
  ProjectService,
  ProjectServiceError,
} from "../modules/projects/project-service.js";
import {
  SessionService,
  SessionServiceError,
} from "../modules/sessions/session-service.js";
import type { SessionSupervisor } from "../modules/sessions/session-supervisor.js";

type CreateSessionBody = {
  title?: string;
  prompt?: string;
};

type RenameSessionBody = {
  name: string;
};

type SendMessageBody = {
  text: string;
};

export async function registerSessionRoutes(
  app: FastifyInstance,
  projectService: ProjectService,
  sessionService: SessionService,
  supervisor: SessionSupervisor,
): Promise<void> {
  app.get("/api/sessions", async () => {
    return { data: sessionService.list() };
  });

  app.get<{ Params: { sessionId: string } }>(
    "/api/sessions/:sessionId",
    async (request, reply) => {
      try {
        const session = sessionService.getById(request.params.sessionId);
        return { data: session };
      } catch (error) {
        if (error instanceof SessionServiceError) {
          reply.code(404);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
    },
  );

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

  app.post<{
    Params: { projectId: string };
    Body: CreateSessionBody;
  }>(
    "/api/projects/:projectId/sessions",
    {
      schema: {
        body: {
          type: "object",
          required: ["prompt"],
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            prompt: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const title: string | undefined = request.body.title;
        const prompt: string = request.body.prompt ?? "";
        const result = await supervisor.createSession(
          request.params.projectId,
          prompt,
          title,
        );
        reply.code(201);
        return { data: { sessionId: result.sessionId } };
      } catch (error) {
        if (error instanceof ProjectServiceError) {
          const statusCode = error.code === "PROJECT_DISABLED" ? 403 : 404;
          reply.code(statusCode);
          return { error: { code: error.code, message: error.message } };
        }
        if (error instanceof Error) {
          reply.code(409);
          return { error: { code: "CONFLICT", message: error.message } };
        }
        throw error;
      }
    },
  );

  app.post<{
    Params: { sessionId: string };
    Body: SendMessageBody;
  }>(
    "/api/sessions/:sessionId/message",
    {
      schema: {
        body: {
          type: "object",
          required: ["text"],
          additionalProperties: false,
          properties: {
            text: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        await supervisor.sendInput(request.params.sessionId, request.body.text);
        return { data: { ok: true } };
      } catch (error) {
        if (error instanceof SessionServiceError) {
          reply.code(404);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
    },
  );

  app.post<{ Params: { sessionId: string } }>(
    "/api/sessions/:sessionId/stop",
    async (request, reply) => {
      supervisor.stopSession(request.params.sessionId);
      try {
        await sessionService.update(request.params.sessionId, {
          status: "stopped",
        });
      } catch (error) {
        if (error instanceof SessionServiceError) {
          reply.code(404);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
      return { data: { ok: true } };
    },
  );

  app.post<{
    Params: { sessionId: string };
    Body: RenameSessionBody;
  }>(
    "/api/sessions/:sessionId/rename",
    {
      schema: {
        body: {
          type: "object",
          required: ["name"],
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const session = await sessionService.update(
          request.params.sessionId,
          { name: request.body.name },
        );
        return { data: session };
      } catch (error) {
        if (error instanceof SessionServiceError) {
          reply.code(404);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
    },
  );

  app.delete<{ Params: { sessionId: string } }>(
    "/api/sessions/:sessionId",
    async (request, reply) => {
      try {
        supervisor.stopSession(request.params.sessionId);
        await sessionService.delete(request.params.sessionId);
        reply.code(204);
      } catch (error) {
        if (error instanceof SessionServiceError) {
          reply.code(404);
          return { error: { code: error.code, message: error.message } };
        }
        throw error;
      }
    },
  );
}
