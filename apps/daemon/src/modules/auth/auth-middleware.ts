import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import { AuthService } from "./auth-service.js";

const BEARER_PREFIX = "Bearer ";

export function createAuthHook(authService: AuthService) {
  return function requireAuth(
    request: FastifyRequest,
    reply: FastifyReply,
    done: (err?: Error) => void,
  ): void {
    const remoteAddr = request.ip;
    if (
      remoteAddr === "127.0.0.1" ||
      remoteAddr === "::1" ||
      remoteAddr === "::ffff:127.0.0.1"
    ) {
      done();
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
      reply.code(401);
      done(new Error("未提供认证令牌。"));
      return;
    }

    const token = authHeader.slice(BEARER_PREFIX.length);
    const binding = authService.validateToken(token);
    if (!binding) {
      reply.code(401);
      done(new Error("无效或已过期的令牌。"));
      return;
    }

    authService.touchLastUsed(binding.id).catch(() => {});
    done();
  };
}
