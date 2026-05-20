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
};

export type SessionStore = {
  sessions: Record<string, SessionData>;
  currentModel: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalCostUsd: string | null;
  contextWindow: number | null;

  getChunks: (sessionId: string) => OutputChunk[];
  getStatus: (sessionId: string) => SessionStatus;
  getApprovals: (sessionId: string) => ApprovalItem[];
  appendChunk: (sessionId: string, chunk: OutputChunk) => void;
  setSessionStatus: (sessionId: string, status: SessionStatus) => void;
  clearSession: (sessionId: string) => void;
  addApproval: (item: ApprovalItem) => void;
  removeApproval: (approvalId: string) => void;
  updateUsage: (data: {
    model?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalCostUsd?: string | null;
    contextWindow?: number | null;
  }) => void;
  reset: () => void;
};

const initialShared = {
  currentModel: null as string | null,
  inputTokens: null as number | null,
  outputTokens: null as number | null,
  totalCostUsd: null as string | null,
  contextWindow: null as number | null,
};

function ensureSession(sessions: Record<string, SessionData>, sessionId: string): Record<string, SessionData> {
  if (sessions[sessionId]) return sessions;
  return {
    ...sessions,
    [sessionId]: { status: "idle", chunks: [], approvals: [] },
  };
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: {},
  ...initialShared,

  getChunks: (sessionId) => get().sessions[sessionId]?.chunks ?? [],
  getStatus: (sessionId) => get().sessions[sessionId]?.status ?? "idle",
  getApprovals: (sessionId) => get().sessions[sessionId]?.approvals ?? [],

  appendChunk: (sessionId, chunk) =>
    set((s) => {
      const updated = ensureSession(s.sessions, sessionId);
      const prev = updated[sessionId]!;
      return {
        sessions: {
          ...updated,
          [sessionId]: {
            ...prev,
            chunks: [...prev.chunks, chunk],
          },
        },
      };
    }),

  setSessionStatus: (sessionId, status) =>
    set((s) => {
      const updated = ensureSession(s.sessions, sessionId);
      const prev = updated[sessionId]!;
      return {
        sessions: {
          ...updated,
          [sessionId]: { ...prev, status },
        },
      };
    }),

  clearSession: (sessionId) =>
    set((s) => {
      const updated = ensureSession(s.sessions, sessionId);
      return {
        sessions: {
          ...updated,
          [sessionId]: { status: "idle", chunks: [], approvals: [] },
        },
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
          [sid]: {
            ...prev,
            approvals: [...prev.approvals, item],
            status: "waiting_approval",
          },
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

  updateUsage: (data) =>
    set((s) => ({
      currentModel: data.model ?? s.currentModel,
      inputTokens: data.inputTokens ?? s.inputTokens,
      outputTokens: data.outputTokens ?? s.outputTokens,
      totalCostUsd: data.totalCostUsd ?? s.totalCostUsd,
      contextWindow: data.contextWindow ?? s.contextWindow,
    })),

  reset: () => set({ sessions: {}, ...initialShared }),
}));
