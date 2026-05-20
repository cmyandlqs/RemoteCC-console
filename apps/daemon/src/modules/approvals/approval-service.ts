import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import type { AppDatabase } from "../../infra/database.js";
import { approvalRequests } from "../../infra/schema.js";
import type { EventBus } from "../../infra/event-bus.js";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "dismissed";

export type ApprovalRecord = {
  id: string;
  sessionId: string;
  toolUseId: string | null;
  toolName: string;
  description: string | null;
  payloadJson: string | null;
  allowedActionsJson: string;
  status: ApprovalStatus;
  createdAt: string;
  resolvedAt: string | null;
};

export class ApprovalService {
  constructor(
    private readonly db: AppDatabase,
    private readonly eventBus: EventBus,
  ) {}

  async create(input: {
    sessionId: string;
    toolUseId?: string;
    toolName: string;
    description?: string;
    payload?: unknown;
    allowedActions?: string[];
  }): Promise<ApprovalRecord> {
    const now = new Date().toISOString();
    const id = uuidv7();

    const record: ApprovalRecord = {
      id,
      sessionId: input.sessionId,
      toolUseId: input.toolUseId ?? null,
      toolName: input.toolName,
      description: input.description ?? null,
      payloadJson: input.payload ? JSON.stringify(input.payload) : null,
      allowedActionsJson: JSON.stringify(input.allowedActions ?? ["rejected", "dismissed"]),
      status: "pending",
      createdAt: now,
      resolvedAt: null,
    };

    await this.db.insert(approvalRequests).values({
      id: record.id,
      sessionId: record.sessionId,
      toolUseId: record.toolUseId,
      toolName: record.toolName,
      description: record.description,
      payloadJson: record.payloadJson,
      allowedActionsJson: record.allowedActionsJson,
      status: record.status,
      createdAt: record.createdAt,
      resolvedAt: record.resolvedAt,
    });

    return record;
  }

  listPending(): ApprovalRecord[] {
    return this.db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.status, "pending"))
      .all();
  }

  listBySession(sessionId: string): ApprovalRecord[] {
    return this.db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.sessionId, sessionId))
      .all();
  }

  getById(approvalId: string): ApprovalRecord | undefined {
    return this.db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, approvalId))
      .get();
  }

  async resolve(
    approvalId: string,
    action: "rejected" | "dismissed",
  ): Promise<ApprovalRecord> {
    const existing = this.getById(approvalId);
    if (!existing) {
      throw new Error("审批请求不存在。");
    }
    if (existing.status !== "pending") {
      throw new Error("审批请求已处理。");
    }

    const now = new Date().toISOString();
    await this.db
      .update(approvalRequests)
      .set({ status: action, resolvedAt: now })
      .where(eq(approvalRequests.id, approvalId));

    this.eventBus.publish(
      "session.approval.resolved",
      {
        approvalId,
        action,
        toolUseId: existing.toolUseId,
        toolName: existing.toolName,
      },
      { sessionId: existing.sessionId },
    );

    const updated = this.getById(approvalId);
    if (!updated) {
      throw new Error("审批请求不存在。");
    }
    return updated;
  }
}
