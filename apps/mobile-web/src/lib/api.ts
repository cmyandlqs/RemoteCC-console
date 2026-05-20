import type {
  HostSummary,
  Project,
  Session,
  ApprovalRecord,
} from "@agent-console/shared-types";

export type { HostSummary, Project, Session, ApprovalRecord };

// @ts-ignore - Vite env types
const BASE = import.meta.env.VITE_DAEMON_URL ?? "http://localhost:8787";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (init?.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const fetchInit: RequestInit = { ...init };
  if (Object.keys(headers).length > 0) {
    fetchInit.headers = headers;
  }
  const res = await fetch(`${BASE}${path}`, fetchInit as RequestInit);
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as T;
}

export type ApiResponse<T> = { data: T } | { error: { code: string; message: string } };

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
  getMessages: (sessionId: string, afterSeq?: number) =>
    api<{ data: Array<{ id: string; sessionId: string; role: string; kind: string; content: string; seq: number; createdAt: string }> }>(
      `/api/sessions/${sessionId}/messages${afterSeq !== undefined ? `?after_seq=${afterSeq}` : ""}`,
    ),
  sendMessage: (sessionId: string, text: string) =>
    api<{ data: { ok: boolean } }>(`/api/sessions/${sessionId}/message`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  stopSession: (sessionId: string) =>
    api<{ data: { ok: boolean } }>(`/api/sessions/${sessionId}/stop`, {
      method: "POST",
    }),
  renameSession: (sessionId: string, name: string) =>
    api<{ data: Session }>(`/api/sessions/${sessionId}/rename`, {
      method: "POST",
      body: JSON.stringify({ name }),
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