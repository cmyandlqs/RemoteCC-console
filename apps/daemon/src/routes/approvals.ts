import type { FastifyInstance } from "fastify";

import { ApprovalService } from "../modules/approvals/approval-service.js";

type RespondBody = {
  action: "rejected" | "dismissed";
};

export async function registerApprovalRoutes(
  app: FastifyInstance,
  approvalService: ApprovalService,
): Promise<void> {
  app.get("/api/approvals/pending", async () => {
    return { data: approvalService.listPending() };
  });

  app.get<{ Params: { sessionId: string } }>(
    "/api/sessions/:sessionId/approvals",
    async (request) => {
      return { data: approvalService.listBySession(request.params.sessionId) };
    },
  );

  app.post<{ Params: { approvalId: string }; Body: RespondBody }>(
    "/api/approvals/:approvalId/respond",
    {
      schema: {
        body: {
          type: "object",
          required: ["action"],
          additionalProperties: false,
          properties: {
            action: { type: "string", enum: ["rejected", "dismissed"] },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const record = await approvalService.resolve(
          request.params.approvalId,
          request.body.action,
        );
        return { data: record };
      } catch (error) {
        if (error instanceof Error) {
          const statusCode = error.message.includes("不存在") ? 404 : 409;
          reply.code(statusCode);
          return { error: { code: "APPROVAL_ERROR", message: error.message } };
        }
        throw error;
      }
    },
  );
}
