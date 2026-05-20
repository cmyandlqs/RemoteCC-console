import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import type { AppDatabase } from "../../infra/database.js";
import { sessions } from "../../infra/schema.js";

export type SessionStatus =
  | "idle"
  | "running"
  | "waiting_approval"
  | "error"
  | "completed"
  | "stopped"
  | "disconnected";

export type SessionRecord = {
  id: string;
  projectId: string;
  externalSessionId: string | null;
  name: string | null;
  status: SessionStatus;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalCostUsd: string | null;
  contextWindow: number | null;
  lastError: string | null;
  startedAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export class SessionServiceError extends Error {
  constructor(
    message: string,
    readonly code: "SESSION_NOT_FOUND" | "INVALID_STATUS_TRANSITION",
  ) {
    super(message);
    this.name = "SessionServiceError";
  }
}

export class SessionService {
  constructor(private readonly db: AppDatabase) {}

  list(): SessionRecord[] {
    return this.db.select().from(sessions).all();
  }

  listByProject(projectId: string): SessionRecord[] {
    return this.db
      .select()
      .from(sessions)
      .where(eq(sessions.projectId, projectId))
      .all();
  }

  getById(sessionId: string): SessionRecord {
    const session = this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();

    if (!session) {
      throw new SessionServiceError("会话不存在。", "SESSION_NOT_FOUND");
    }

    return session;
  }

  async create(
    projectId: string,
    input: { title?: string },
  ): Promise<SessionRecord> {
    const now = new Date().toISOString();
    const id = uuidv7();

    const record: SessionRecord = {
      id,
      projectId,
      externalSessionId: null,
      name: input.title ?? null,
      status: "idle",
      model: null,
      inputTokens: null,
      outputTokens: null,
      totalCostUsd: null,
      contextWindow: null,
      lastError: null,
      startedAt: null,
      lastActiveAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(sessions).values({
      id: record.id,
      projectId: record.projectId,
      externalSessionId: record.externalSessionId,
      name: record.name,
      status: record.status,
      model: record.model,
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
      totalCostUsd: record.totalCostUsd,
      contextWindow: record.contextWindow,
      lastError: record.lastError,
      startedAt: record.startedAt,
      lastActiveAt: record.lastActiveAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return record;
  }

  async update(
    sessionId: string,
    input: {
      name?: string;
      status?: SessionStatus;
      model?: string;
      externalSessionId?: string;
      inputTokens?: number;
      outputTokens?: number;
      totalCostUsd?: string;
      contextWindow?: number;
      lastError?: string;
      startedAt?: string;
      lastActiveAt?: string;
    },
  ): Promise<SessionRecord> {
    const existing = this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();

    if (!existing) {
      throw new SessionServiceError("会话不存在。", "SESSION_NOT_FOUND");
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (input.name !== undefined) updates.name = input.name;
    if (input.status !== undefined) updates.status = input.status;
    if (input.model !== undefined) updates.model = input.model;
    if (input.externalSessionId !== undefined) updates.externalSessionId = input.externalSessionId;
    if (input.inputTokens !== undefined) updates.inputTokens = input.inputTokens;
    if (input.outputTokens !== undefined) updates.outputTokens = input.outputTokens;
    if (input.totalCostUsd !== undefined) updates.totalCostUsd = input.totalCostUsd;
    if (input.contextWindow !== undefined) updates.contextWindow = input.contextWindow;
    if (input.lastError !== undefined) updates.lastError = input.lastError;
    if (input.startedAt !== undefined) updates.startedAt = input.startedAt;
    if (input.lastActiveAt !== undefined) updates.lastActiveAt = input.lastActiveAt;

    await this.db
      .update(sessions)
      .set(updates)
      .where(eq(sessions.id, sessionId));

    return this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get()!;
  }

  async delete(sessionId: string): Promise<void> {
    const existing = this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();

    if (!existing) {
      throw new SessionServiceError("会话不存在。", "SESSION_NOT_FOUND");
    }

    await this.db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async markRunningAsDisconnected(): Promise<number> {
    const running = this.db
      .select()
      .from(sessions)
      .where(eq(sessions.status, "running"))
      .all();

    if (running.length === 0) return 0;

    const now = new Date().toISOString();
    for (const session of running) {
      await this.db
        .update(sessions)
        .set({ status: "disconnected", updatedAt: now })
        .where(eq(sessions.id, session.id));
    }

    return running.length;
  }
}
