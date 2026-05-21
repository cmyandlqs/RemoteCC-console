export type WsEnvelope<T = unknown> = {
  eventId: string;
  ts: string;
  type: WsEventType;
  sessionId?: string;
  projectId?: string;
  payload: T;
};

export type WsEventType =
  | "session.state.changed"
  | "session.message.delta"
  | "session.message.completed"
  | "session.command.started"
  | "session.command.output"
  | "session.command.completed"
  | "session.approval.requested"
  | "session.approval.resolved"
  | "session.file_change.updated"
  | "session.usage.updated"
  | "session.error"
  | "session.completed";

export type WsClientMessage =
  | { type: "subscribe"; sessionId: string }
  | { type: "unsubscribe"; sessionId: string }
  | { type: "ping" };

export type SessionStatus =
  | "idle"
  | "running"
  | "waiting_approval"
  | "error"
  | "completed"
  | "stopped"
  | "disconnected";

export type ApiResponse<T> = { data: T } | { error: { code: string; message: string } };

export type Project = {
  id: string;
  name: string;
  rootPath: string;
  gitBranch: string | null;
  uncommittedChanges: number;
  isGitRepo: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
};

export type Session = {
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

export type DeviceBinding = {
  id: string;
  deviceName: string | null;
  tokenHash: string;
  status: "active" | "revoked";
  createdAt: string;
  lastUsedAt: string | null;
};

export type HostSummary = {
  name: string;
  os: string;
  daemonVersion: string;
  status: "online";
  activeSessionCount: number;
  claudeAuthState: "available" | "unavailable" | "error";
  tailscaleState: "online" | "offline" | "not_installed";
};

export type HealthCheck = {
  status: "ok";
  uptime: number;
  timestamp: string;
};

export type GitStatus = {
  branch: string | null;
  staged: number;
  unstaged: number;
  untracked: number;
  summary: string;
};

export type FileChangeRecord = {
  id: string;
  sessionId: string;
  projectId: string;
  path: string;
  changeType: "added" | "modified" | "deleted" | "renamed";
  additions: number | null;
  deletions: number | null;
  diffExcerpt: string | null;
  createdAt: string;
};

export type ApprovalRequestedPayload = {
  approvalId: string;
  toolUseId: string;
  toolName: string;
  description: string;
  payload: unknown;
};

export type ApprovalResolvedPayload = {
  approvalId: string;
};

export type SessionStateChangedPayload = {
  status: SessionStatus;
};

export type SessionMessageDeltaPayload = {
  text: string;
  kind?: "thinking" | "text";
};

export type SessionUsageUpdatedPayload = {
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  contextWindow?: number;
};

export type SessionCompletedPayload = {
  result?: string;
};

export type SessionErrorPayload = {
  message: string;
};

export type PairingToken = {
  id: string;
  token: string;
};