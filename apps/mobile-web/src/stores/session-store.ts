import { create } from "zustand";

export type SessionStatus =
  | "idle"
  | "running"
  | "waiting_approval"
  | "error"
  | "completed"
  | "stopped"
  | "disconnected";

export type ApprovalItem = {
  approvalId: string;
  sessionId: string;
  toolUseId: string;
  toolName: string;
  description: string;
  payload: unknown;
};

export type ToolCallState = "pending" | "running" | "completed" | "error";

export type ToolCallItem = {
  toolUseId: string;
  toolName: string;
  state: ToolCallState;
  input?: string | undefined;
  output?: string | undefined;
  timestamp: string;
};

export type OutputChunk = {
  eventId: string;
  text: string;
  kind?: "thinking" | "text" | "user";
  timestamp: string;
};

type SessionData = {
  status: SessionStatus;
  chunks: OutputChunk[];
  approvals: ApprovalItem[];
  toolCalls: ToolCallItem[];
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalCostUsd: string | null;
  contextWindow: number | null;
};

export type SessionStore = {
  sessions: Record<string, SessionData>;

  getChunks: (sessionId: string) => OutputChunk[];
  getStatus: (sessionId: string) => SessionStatus;
  getApprovals: (sessionId: string) => ApprovalItem[];
  getToolCalls: (sessionId: string) => ToolCallItem[];
  getSessionData: (sessionId: string) => SessionData | undefined;
  appendChunk: (sessionId: string, chunk: OutputChunk) => void;
  setSessionStatus: (sessionId: string, status: SessionStatus) => void;
  clearSession: (sessionId: string) => void;
  addApproval: (item: ApprovalItem) => void;
  removeApproval: (approvalId: string) => void;
  addToolCall: (sessionId: string, toolCall: ToolCallItem) => void;
  updateToolCall: (sessionId: string, toolUseId: string, update: Partial<ToolCallItem>) => void;
  updateUsage: (sessionId: string, data: {
    model?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalCostUsd?: string | null;
    contextWindow?: number | null;
  }) => void;
  reset: () => void;
};

const emptySession = (): SessionData => ({
  status: "idle",
  chunks: [],
  approvals: [],
  toolCalls: [],
  model: null,
  inputTokens: null,
  outputTokens: null,
  totalCostUsd: null,
  contextWindow: null,
});

function ensureSession(sessions: Record<string, SessionData>, sessionId: string): Record<string, SessionData> {
  if (sessions[sessionId]) return sessions;
  return { ...sessions, [sessionId]: emptySession() };
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: {},

  getChunks: (sessionId) => get().sessions[sessionId]?.chunks ?? [],
  getStatus: (sessionId) => get().sessions[sessionId]?.status ?? "idle",
  getApprovals: (sessionId) => get().sessions[sessionId]?.approvals ?? [],
  getToolCalls: (sessionId) => get().sessions[sessionId]?.toolCalls ?? [],
  getSessionData: (sessionId) => get().sessions[sessionId],

  appendChunk: (sessionId, chunk) =>
    set((s) => {
      const updated = ensureSession(s.sessions, sessionId);
      const prev = updated[sessionId]!;
      return {
        sessions: { ...updated, [sessionId]: { ...prev, chunks: [...prev.chunks, chunk] } },
      };
    }),

  setSessionStatus: (sessionId, status) =>
    set((s) => {
      const updated = ensureSession(s.sessions, sessionId);
      const prev = updated[sessionId]!;
      return {
        sessions: { ...updated, [sessionId]: { ...prev, status } },
      };
    }),

  clearSession: (sessionId) =>
    set((s) => {
      const updated = ensureSession(s.sessions, sessionId);
      return {
        sessions: { ...updated, [sessionId]: emptySession() },
      };
    }),

  addApproval: (item) =>
    set((s) => {
      const sid = item.sessionId;
      const updated = ensureSession(s.sessions, sid);
      const prev = updated[sid]!;
      return {
        sessions: {
          ...updated,
          [sid]: { ...prev, approvals: [...prev.approvals, item], status: "waiting_approval" },
        },
      };
    }),

  removeApproval: (approvalId) =>
    set((s) => {
      const newSessions = { ...s.sessions };
      for (const [sid, data] of Object.entries(newSessions)) {
        const filtered = data.approvals.filter((a) => a.approvalId !== approvalId);
        if (filtered.length !== data.approvals.length) {
          newSessions[sid] = { ...data, approvals: filtered };
        }
      }
      return { sessions: newSessions };
    }),

  addToolCall: (sessionId, toolCall) =>
    set((s) => {
      const updated = ensureSession(s.sessions, sessionId);
      const prev = updated[sessionId]!;
      return {
        sessions: { ...updated, [sessionId]: { ...prev, toolCalls: [...prev.toolCalls, toolCall] } },
      };
    }),

  updateToolCall: (sessionId, toolUseId, update) =>
    set((s) => {
      const updated = ensureSession(s.sessions, sessionId);
      const prev = updated[sessionId]!;
      return {
        sessions: {
          ...updated,
          [sessionId]: {
            ...prev,
            toolCalls: prev.toolCalls.map((tc) =>
              tc.toolUseId === toolUseId ? { ...tc, ...update } : tc
            ),
          },
        },
      };
    }),

  updateUsage: (sessionId, data) =>
    set((s) => {
      const updated = ensureSession(s.sessions, sessionId);
      const prev = updated[sessionId]!;
      return {
        sessions: {
          ...updated,
          [sessionId]: {
            ...prev,
            model: data.model ?? prev.model,
            inputTokens: data.inputTokens ?? prev.inputTokens,
            outputTokens: data.outputTokens ?? prev.outputTokens,
            totalCostUsd: data.totalCostUsd ?? prev.totalCostUsd,
            contextWindow: data.contextWindow ?? prev.contextWindow,
          },
        },
      };
    }),

  reset: () => set({ sessions: {} }),
}));
