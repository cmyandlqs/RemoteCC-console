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
  kind?: "thinking" | "text";
  timestamp: string;
};

export type SessionStore = {
  activeSessionId: string | null;
  sessionStatus: SessionStatus;
  outputChunks: OutputChunk[];
  pendingApprovals: ApprovalItem[];
  currentModel: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalCostUsd: string | null;
  contextWindow: number | null;

  setActiveSession: (id: string | null) => void;
  setSessionStatus: (status: SessionStatus) => void;
  appendOutput: (chunk: OutputChunk) => void;
  clearOutput: () => void;
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

const initialState = {
  activeSessionId: null,
  sessionStatus: "idle" as SessionStatus,
  outputChunks: [] as OutputChunk[],
  pendingApprovals: [] as ApprovalItem[],
  currentModel: null as string | null,
  inputTokens: null as number | null,
  outputTokens: null as number | null,
  totalCostUsd: null as string | null,
  contextWindow: null as number | null,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setActiveSession: (id) => set({ activeSessionId: id }),
  setSessionStatus: (status) => set({ sessionStatus: status }),

  appendOutput: (chunk) =>
    set((s) => ({ outputChunks: [...s.outputChunks, chunk] })),

  clearOutput: () => set({ outputChunks: [] }),

  addApproval: (item) =>
    set((s) => ({
      pendingApprovals: [...s.pendingApprovals, item],
      sessionStatus: "waiting_approval",
    })),

  removeApproval: (approvalId) =>
    set((s) => ({
      pendingApprovals: s.pendingApprovals.filter((a) => a.approvalId !== approvalId),
    })),

  updateUsage: (data) =>
    set((s) => ({
      currentModel: data.model ?? s.currentModel,
      inputTokens: data.inputTokens ?? s.inputTokens,
      outputTokens: data.outputTokens ?? s.outputTokens,
      totalCostUsd: data.totalCostUsd ?? s.totalCostUsd,
      contextWindow: data.contextWindow ?? s.contextWindow,
    })),

  reset: () => set(initialState),
}));