import type { ClaudeAdapter, AdapterEvent } from "@agent-console/claude-adapter";

import type { EventBus } from "../../infra/event-bus.js";
import type { SessionService } from "./session-service.js";
import type { ApprovalService } from "../approvals/approval-service.js";

export class SessionWorker {
  private abortController: AbortController | null = null;

  constructor(
    readonly sessionId: string,
    readonly projectId: string,
    private readonly cwd: string,
    private readonly adapter: ClaudeAdapter,
    private readonly sessionService: SessionService,
    private readonly eventBus: EventBus,
    private readonly approvalService: ApprovalService,
  ) {}

  async start(prompt: string): Promise<void> {
    await this.sessionService.update(this.sessionId, {
      status: "running",
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
    this.eventBus.publish(
      "session.state.changed",
      { status: "running" },
      { sessionId: this.sessionId, projectId: this.projectId },
    );

    this.abortController = new AbortController();

    try {
      const stream = this.adapter.sendMessage(
        this.cwd,
        prompt,
        undefined,
        this.abortController.signal,
      );

      for await (const event of stream) {
        if (this.abortController.signal.aborted) break;
        if (event.type === "error" && event.message === "Process ended unexpectedly") {
          break;
        }
        this.handleAdapterEvent(event);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.onError(message);
    }
  }

  async resume(prompt: string, externalSessionId: string): Promise<void> {
    await this.sessionService.update(this.sessionId, {
      status: "running",
      lastActiveAt: new Date().toISOString(),
    });
    this.eventBus.publish(
      "session.state.changed",
      { status: "running" },
      { sessionId: this.sessionId, projectId: this.projectId },
    );

    this.abortController = new AbortController();

    try {
      const stream = this.adapter.sendMessage(
        this.cwd,
        prompt,
        externalSessionId,
        this.abortController.signal,
      );

      for await (const event of stream) {
        if (this.abortController.signal.aborted) break;
        if (event.type === "error" && event.message === "Process ended unexpectedly") {
          break;
        }
        this.handleAdapterEvent(event);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.onError(message);
    }
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private handleAdapterEvent(event: AdapterEvent): void {
    switch (event.type) {
      case "session.started":
        this.sessionService
          .update(this.sessionId, {
            externalSessionId: event.sessionId,
            model: event.model,
            lastActiveAt: new Date().toISOString(),
          })
          .catch(() => {});
        break;

      case "text_delta":
        this.eventBus.publish(
          "session.message.delta",
          { text: event.text },
          { sessionId: this.sessionId, projectId: this.projectId },
        );
        break;

      case "thinking_delta":
        this.eventBus.publish(
          "session.message.delta",
          { text: event.text, kind: "thinking" },
          { sessionId: this.sessionId, projectId: this.projectId },
        );
        break;

      case "tool_use":
        this.eventBus.publish(
          "session.command.started",
          {
            toolUseId: event.toolUseId,
            toolName: event.toolName,
            input: event.input,
          },
          { sessionId: this.sessionId, projectId: this.projectId },
        );
        break;

      case "tool_result":
        this.eventBus.publish(
          "session.command.completed",
          {
            toolUseId: event.toolUseId,
            output: event.output,
            isError: event.isError,
          },
          { sessionId: this.sessionId, projectId: this.projectId },
        );
        break;

      case "approval_requested":
        this.onApprovalRequested(event.toolUseId, event.toolName, event.description, event.payload);
        break;

      case "usage_updated":
        this.sessionService
          .update(this.sessionId, {
            model: event.model,
            inputTokens: event.inputTokens,
            outputTokens: event.outputTokens,
            totalCostUsd: String(event.costUsd),
            ...(event.contextWindow !== undefined
              ? { contextWindow: event.contextWindow }
              : {}),
          })
          .catch(() => {});
        this.eventBus.publish(
          "session.usage.updated",
          {
            model: event.model,
            inputTokens: event.inputTokens,
            outputTokens: event.outputTokens,
            costUsd: event.costUsd,
            contextWindow: event.contextWindow,
          },
          { sessionId: this.sessionId, projectId: this.projectId },
        );
        break;

      case "session.completed":
        this.onCompleted(event.result);
        break;

      case "error":
        this.onError(event.message);
        break;
    }
  }

  private async onApprovalRequested(
    toolUseId: string,
    toolName: string,
    description: string,
    payload: unknown,
  ): Promise<void> {
    const record = await this.approvalService.create({
      sessionId: this.sessionId,
      toolUseId,
      toolName,
      description,
      payload,
    });

    await this.sessionService.update(this.sessionId, {
      status: "waiting_approval",
      lastActiveAt: new Date().toISOString(),
    });
    this.eventBus.publish(
      "session.approval.requested",
      {
        approvalId: record.id,
        toolUseId,
        toolName,
        description,
        payload,
      },
      { sessionId: this.sessionId, projectId: this.projectId },
    );
  }

  private async onCompleted(result: string): Promise<void> {
    await this.sessionService.update(this.sessionId, {
      status: "idle",
      lastActiveAt: new Date().toISOString(),
    });
    this.eventBus.publish(
      "session.completed",
      { result },
      { sessionId: this.sessionId, projectId: this.projectId },
    );
    this.eventBus.publish(
      "session.state.changed",
      { status: "idle" },
      { sessionId: this.sessionId, projectId: this.projectId },
    );
  }

  private async onError(message: string): Promise<void> {
    await this.sessionService.update(this.sessionId, {
      status: "error",
      lastError: message,
      lastActiveAt: new Date().toISOString(),
    });
    this.eventBus.publish(
      "session.error",
      { message },
      { sessionId: this.sessionId, projectId: this.projectId },
    );
    this.eventBus.publish(
      "session.state.changed",
      { status: "error" },
      { sessionId: this.sessionId, projectId: this.projectId },
    );
  }
}
