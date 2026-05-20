import type { ClaudeAdapter } from "@agent-console/claude-adapter";

import type { EventBus } from "../../infra/event-bus.js";
import type { SessionService } from "./session-service.js";
import type { SessionWorker } from "./session-worker.js";
import type { ProjectService } from "../projects/project-service.js";
import type { ApprovalService } from "../approvals/approval-service.js";

import { SessionWorker as SessionWorkerImpl } from "./session-worker.js";

export class SessionSupervisor {
  private readonly workers = new Map<string, SessionWorker>();

  constructor(
    private readonly sessionService: SessionService,
    private readonly projectService: ProjectService,
    private readonly adapter: ClaudeAdapter,
    private readonly eventBus: EventBus,
    private readonly approvalService: ApprovalService,
  ) {}

  async createSession(
    projectId: string,
    prompt: string,
    title?: string,
  ): Promise<{ sessionId: string }> {
    const project = this.projectService.getById(projectId);

    const existing = this.sessionService.listByProject(projectId);
    const running = existing.filter((s) => s.status === "running");
    if (running.length > 0) {
      throw new Error(
        `项目已有运行中的会话 (${running[0]?.id})，请先停止再创建新会话。`,
      );
    }

    const sessionInput: { title?: string } = {};
    if (title !== undefined) {
      sessionInput.title = title;
    }
    const session = await this.sessionService.create(projectId, sessionInput);

    const worker = new SessionWorkerImpl(
      session.id,
      projectId,
      project.rootPath,
      this.adapter,
      this.sessionService,
      this.eventBus,
      this.approvalService,
    );
    this.workers.set(session.id, worker);

    worker.start(prompt).catch(() => {});

    return { sessionId: session.id };
  }

  async sendInput(sessionId: string, text: string): Promise<void> {
    const session = this.sessionService.getById(sessionId);
    const project = this.projectService.getById(session.projectId);

    let worker = this.workers.get(sessionId);
    if (!worker) {
      worker = new SessionWorkerImpl(
        sessionId,
        session.projectId,
        project.rootPath,
        this.adapter,
        this.sessionService,
        this.eventBus,
        this.approvalService,
      );
      this.workers.set(sessionId, worker);
    }

    const externalId = session.externalSessionId ?? undefined;
    if (externalId) {
      worker.resume(text, externalId).catch(() => {});
    } else {
      worker.start(text).catch(() => {});
    }
  }

  stopSession(sessionId: string): void {
    const worker = this.workers.get(sessionId);
    if (worker) {
      worker.stop();
      this.workers.delete(sessionId);
    }
  }

  async markRunningAsDisconnected(): Promise<void> {
    const count = await this.sessionService.markRunningAsDisconnected();
    if (count > 0) {
      this.eventBus.publish("session.state.changed", {
        status: "disconnected",
        message: `Daemon restarted, ${count} sessions marked as disconnected.`,
      });
    }
  }
}
