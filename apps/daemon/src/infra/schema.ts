import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  rootPath: text("root_path").notNull().unique(),
  isGitRepo: integer("is_git_repo", { mode: "boolean" }).notNull().default(false),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  externalSessionId: text("external_session_id"),
  name: text("name"),
  status: text("status", {
    enum: [
      "idle",
      "running",
      "waiting_approval",
      "error",
      "completed",
      "stopped",
      "disconnected",
    ],
  }).notNull(),
  model: text("model"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  totalCostUsd: text("total_cost_usd"),
  contextWindow: integer("context_window"),
  lastError: text("last_error"),
  startedAt: text("started_at"),
  lastActiveAt: text("last_active_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const sessionEvents = sqliteTable("session_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  type: text("type").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: text("created_at").notNull(),
});

export const approvalRequests = sqliteTable("approval_requests", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  toolUseId: text("tool_use_id"),
  toolName: text("tool_name").notNull(),
  description: text("description"),
  payloadJson: text("payload_json"),
  allowedActionsJson: text("allowed_actions_json").notNull(),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "dismissed"],
  })
    .notNull()
    .default("pending"),
  createdAt: text("created_at").notNull(),
  resolvedAt: text("resolved_at"),
});

export const fileChanges = sqliteTable("file_changes", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  path: text("path").notNull(),
  changeType: text("change_type", {
    enum: ["added", "modified", "deleted", "renamed"],
  }).notNull(),
  additions: integer("additions"),
  deletions: integer("deletions"),
  diffExcerpt: text("diff_excerpt"),
  createdAt: text("created_at").notNull(),
});

export const deviceBindings = sqliteTable("device_bindings", {
  id: text("id").primaryKey(),
  deviceName: text("device_name"),
  tokenHash: text("token_hash").notNull().unique(),
  status: text("status", { enum: ["active", "revoked"] })
    .notNull()
    .default("active"),
  createdAt: text("created_at").notNull(),
  lastUsedAt: text("last_used_at"),
});
