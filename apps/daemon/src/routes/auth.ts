import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import { AuthService } from "../modules/auth/auth-service.js";

type CreateBindingBody = {
  deviceName?: string;
};

type ConfirmBindingBody = {
  token: string;
  deviceName?: string;
};

export async function registerAuthRoutes(
  app: FastifyInstance,
  authService: AuthService,
): Promise<void> {
  app.post<{ Body: CreateBindingBody }>(
    "/api/pairing/create",
    {
      preHandler: [requireLocalHost],
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            deviceName: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await authService.createBinding(request.body.deviceName);
      reply.code(201);
      return { data: result };
    },
  );

  app.post<{ Body: ConfirmBindingBody }>(
    "/api/pairing/confirm",
    {
      schema: {
        body: {
          type: "object",
          required: ["token"],
          additionalProperties: false,
          properties: {
            token: { type: "string", minLength: 1 },
            deviceName: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const binding = authService.validateToken(request.body.token);
      if (!binding) {
        reply.code(401);
        return { error: { code: "INVALID_TOKEN", message: "无效或已过期的绑定令牌。" } };
      }
      return { data: { id: binding.id, status: "confirmed" } };
    },
  );

  app.get("/api/devices", {
    preHandler: [requireLocalHost],
  }, async () => {
    return { data: authService.listActive() };
  });

  app.delete<{ Params: { deviceId: string } }>(
    "/api/devices/:deviceId",
    { preHandler: [requireLocalHost] },
    async (request, reply) => {
      await authService.revokeBinding(request.params.deviceId);
      reply.code(204);
    },
  );
}

function requireLocalHost(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void,
): void {
  const remoteAddr = request.ip;
  if (remoteAddr === "127.0.0.1" || remoteAddr === "::1" || remoteAddr === "::ffff:127.0.0.1") {
    done();
    return;
  }
  reply.code(403);
  done(new Error("仅允许本机访问"));
}
