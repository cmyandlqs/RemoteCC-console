// @ts-ignore - Vite env types
const BASE = import.meta.env.VITE_DAEMON_URL ?? "http://localhost:8787";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as T;
}

export type ApiResponse<T> = { data: T } | { error: { code: string; message: string } };

export type HostSummary = {
  name: string;
  os: string;
  daemonVersion: string;
  status: "online";
  activeSessionCount: number;
  claudeAuthState: "available" | "unavailable" | "error";
  tailscaleState: "online" | "offline" | "not_installed";
};

export type Project = {
  id: string;
  name: string;
  rootPath: string;
  gitBranch: string | null;
  uncommittedChanges: number;
  isEnabled: boolean;
  createdAt: string;
  lastActiveAt: string | null;
};

export type Session = {
  id: string;
  projectId: string;
  name: string | null;
  status: "idle" | "running" | "waiting_approval" | "error" | "completed" | "stopped" | "disconnected";
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalCostUsd: string | null;
  contextWindow: number | null;
  startedAt: string | null;
  lastActiveAt: string | null;
  lastError: string | null;
};

export type ApprovalRecord = {
  id: string;
  sessionId: string;
  toolUseId: string | null;
  toolName: string;
  description: string | null;
  payloadJson: string | null;
  allowedActionsJson: string;
  status: "pending" | "approved" | "rejected" | "dismissed";
  createdAt: string;
  resolvedAt: string | null;
};

export const apiClient = {
  getHostInfo: () => api<{ data: HostSummary }>("/api/host/info"),

  listProjects: () => api<{ data: Project[] }>("/api/projects"),
  createSession: (projectId: string, prompt: string, title?: string) =>
    api<{ data: { sessionId: string } }>(`/api/projects/${projectId}/sessions`, {
      method: "POST",
      body: JSON.stringify({ prompt, ...(title ? { title } : {}) }),
    }),

  listSessions: (projectId: string) =>
    api<{ data: Session[] }>(`/api/projects/${projectId}/sessions`),
  getSession: (sessionId: string) =>
    api<{ data: Session }>(`/api/sessions/${sessionId}`),
  sendMessage: (sessionId: string, text: string) =>
    api<{ data: { ok: boolean } }>(`/api/sessions/${sessionId}/message`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  stopSession: (sessionId: string) =>
    api<{ data: { ok: boolean } }>(`/api/sessions/${sessionId}/stop`, {
      method: "POST",
    }),

  listPendingApprovals: () => api<{ data: ApprovalRecord[] }>("/api/approvals/pending"),
  listSessionApprovals: (sessionId: string) =>
    api<{ data: ApprovalRecord[] }>(`/api/sessions/${sessionId}/approvals`),
  respondApproval: (id: string, action: "rejected" | "dismissed") =>
    api<{ data: ApprovalRecord }>(`/api/approvals/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
};