export type AdapterEvent =
  | { type: "session.started"; sessionId: string; model: string; cwd: string }
  | { type: "text_delta"; text: string }
  | { type: "thinking_delta"; text: string }
  | { type: "tool_use"; toolUseId: string; toolName: string; input: unknown }
  | { type: "tool_result"; toolUseId: string; output: string; isError: boolean }
  | {
      type: "approval_requested";
      toolUseId: string;
      toolName: string;
      description: string;
      payload: unknown;
    }
  | {
      type: "usage_updated";
      model: string;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
      contextWindow: number | undefined;
    }
  | { type: "session.completed"; result: string; costUsd: number }
  | { type: "error"; message: string };

export type AdapterSessionInfo = {
  sessionId: string;
  title: string | null;
  model: string | null;
};

export type AdapterMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export interface ClaudeAdapter {
  sendMessage(
    cwd: string,
    prompt: string,
    sessionId?: string,
  ): AsyncIterable<AdapterEvent>;

  listSessions(cwd: string): Promise<AdapterSessionInfo[]>;

  renameSession(sessionId: string, name: string): Promise<void>;

  getSessionMessages(sessionId: string): Promise<AdapterMessage[]>;
}
