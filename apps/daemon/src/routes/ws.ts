import type { FastifyInstance } from "fastify";

export async function registerRealtimeRoutes(app: FastifyInstance): Promise<void> {
  app.get("/ws", { websocket: true }, (socket) => {
    socket.send(
      JSON.stringify({
        type: "host.status.updated",
        timestamp: new Date().toISOString(),
        payload: {
          status: "online",
          message: "websocket connected",
        },
      }),
    );
  });
}
