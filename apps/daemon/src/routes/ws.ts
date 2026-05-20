import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";

import type { EventBus } from "../infra/event-bus.js";
import type { AuthService } from "../modules/auth/auth-service.js";
import type { WsEnvelope, WsClientMessage } from "@agent-console/shared-types";

const PING_INTERVAL_MS = 30_000;

type ClientState = {
  socket: WebSocket;
  subscribedSessions: Set<string>;
  alive: boolean;
};

export async function registerRealtimeRoutes(
  app: FastifyInstance,
  eventBus: EventBus,
  authService: AuthService,
): Promise<void> {
  const clients = new Map<WebSocket, ClientState>();

  const unsubscribe = eventBus.subscribe((envelope: WsEnvelope) => {
    for (const [, client] of clients) {
      if (!client.alive) continue;

      if (
        client.subscribedSessions.size === 0 ||
        (envelope.sessionId &&
          client.subscribedSessions.has(envelope.sessionId))
      ) {
        client.socket.send(JSON.stringify(envelope));
      }
    }
  });

  app.addHook("onClose", () => {
    unsubscribe();
    for (const [socket] of clients) {
      socket.terminate();
    }
    clients.clear();
  });

  app.get("/ws", { websocket: true }, (socket, request) => {
    const token = new URL(request.url, "http://localhost").searchParams.get("token");
    if (!token || !authService.validateToken(token)) {
      socket.close(4001, "Unauthorized");
      return;
    }

    const state: ClientState = {
      socket,
      subscribedSessions: new Set(),
      alive: true,
    };
    clients.set(socket, state);

    socket.send(
      JSON.stringify({
        eventId: "welcome",
        ts: new Date().toISOString(),
        type: "session.state.changed",
        payload: { status: "connected" },
      }),
    );

    socket.on("message", (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as WsClientMessage;

        if (msg.type === "subscribe" && msg.sessionId) {
          state.subscribedSessions.add(msg.sessionId);
        } else if (msg.type === "unsubscribe" && msg.sessionId) {
          state.subscribedSessions.delete(msg.sessionId);
        } else if (msg.type === "ping") {
          state.alive = true;
          socket.send(
            JSON.stringify({
              eventId: "pong",
              ts: new Date().toISOString(),
              type: "session.state.changed",
              payload: { status: "pong" },
            }),
          );
        }
      } catch {
        // ignore malformed messages
      }
    });

    socket.on("pong", () => {
      state.alive = true;
    });

    socket.on("close", () => {
      clients.delete(socket);
    });
  });

  const pingTimer = setInterval(() => {
    for (const [socket, client] of clients) {
      if (!client.alive) {
        socket.terminate();
        clients.delete(socket);
        continue;
      }
      client.alive = false;
      socket.ping();
    }
  }, PING_INTERVAL_MS);

  app.addHook("onClose", () => {
    clearInterval(pingTimer);
  });
}
