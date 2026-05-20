export type ClaudeStreamEvent =
  | { type: "session.snapshot"; payload: Record<string, unknown> }
  | { type: "session.output.delta"; payload: { text: string } }
  | { type: "approval.requested"; payload: Record<string, unknown> };

export type ClaudeSessionSummary = {
  sessionId: string;
  title: string;
  model?: string;
};

export interface ClaudeAdapter {
  listSessions(projectPath: string): Promise<ClaudeSessionSummary[]>;
  createSession(projectPath: string, prompt?: string): Promise<ClaudeSessionSummary>;
  resumeSession(sessionId: string): Promise<ClaudeSessionSummary>;
  streamSession(sessionId: string): AsyncIterable<ClaudeStreamEvent>;
  denyApproval(approvalId: string): Promise<void>;
}

export class StubClaudeAdapter implements ClaudeAdapter {
  async listSessions(_projectPath: string): Promise<ClaudeSessionSummary[]> {
    return [];
  }

  async createSession(
    _projectPath: string,
    prompt?: string,
  ): Promise<ClaudeSessionSummary> {
    return {
      sessionId: "stub-session",
      title: prompt ?? "新会话",
      model: "unknown",
    };
  }

  async resumeSession(sessionId: string): Promise<ClaudeSessionSummary> {
    return {
      sessionId,
      title: "恢复会话",
      model: "unknown",
    };
  }

  async *streamSession(_sessionId: string): AsyncIterable<ClaudeStreamEvent> {
    yield {
      type: "session.snapshot",
      payload: {
        status: "idle",
      },
    };
  }

  async denyApproval(_approvalId: string): Promise<void> {
    return;
  }
}
