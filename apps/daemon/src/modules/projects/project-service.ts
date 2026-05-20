import path from "node:path";
import fs from "node:fs";
import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import type { AppDatabase } from "../../infra/database.js";
import { projects, sessions, fileChanges, sessionEvents, approvalRequests } from "../../infra/schema.js";

export type ProjectRecord = {
  id: string;
  name: string;
  rootPath: string;
  isGitRepo: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export class ProjectServiceError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_NAME"
      | "INVALID_PATH"
      | "PATH_NOT_FOUND"
      | "DUPLICATE_PATH"
      | "PROJECT_NOT_FOUND"
      | "PROJECT_DISABLED",
  ) {
    super(message);
    this.name = "ProjectServiceError";
  }
}

export class ProjectService {
  constructor(private readonly db: AppDatabase) {}

  list(): ProjectRecord[] {
    return this.db.select().from(projects).all();
  }

  async create(input: { name: string; rootPath: string }): Promise<ProjectRecord> {
    const name = input.name.trim();
    const rootPath = path.normalize(input.rootPath.trim());

    if (!name) {
      throw new ProjectServiceError("项目名称不能为空。", "INVALID_NAME");
    }

    if (!rootPath || !path.isAbsolute(rootPath)) {
      throw new ProjectServiceError("项目路径必须是绝对路径。", "INVALID_PATH");
    }

    if (!fs.existsSync(rootPath)) {
      throw new ProjectServiceError("项目路径不存在。", "PATH_NOT_FOUND");
    }

    const existing = this.db
      .select()
      .from(projects)
      .where(eq(projects.rootPath, rootPath))
      .get();

    if (existing) {
      throw new ProjectServiceError("项目路径已注册。", "DUPLICATE_PATH");
    }

    const isGitRepo = fs.existsSync(path.join(rootPath, ".git"));
    const now = new Date().toISOString();
    const id = uuidv7();

    const record: ProjectRecord = {
      id,
      name,
      rootPath,
      isGitRepo,
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(projects).values({
      id: record.id,
      name: record.name,
      rootPath: record.rootPath,
      isGitRepo: record.isGitRepo,
      isEnabled: record.isEnabled,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return record;
  }

  getById(projectId: string): ProjectRecord {
    const project = this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      throw new ProjectServiceError("项目不存在。", "PROJECT_NOT_FOUND");
    }

    if (!project.isEnabled) {
      throw new ProjectServiceError("项目已被禁用。", "PROJECT_DISABLED");
    }

    return project;
  }

  async update(
    projectId: string,
    input: { name?: string; isEnabled?: boolean },
  ): Promise<ProjectRecord> {
    const project = this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      throw new ProjectServiceError("项目不存在。", "PROJECT_NOT_FOUND");
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (!trimmed) {
        throw new ProjectServiceError("项目名称不能为空。", "INVALID_NAME");
      }
      updates.name = trimmed;
    }

    if (input.isEnabled !== undefined) {
      updates.isEnabled = input.isEnabled;
    }

    await this.db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, projectId));

    return this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get()!;
  }

  async delete(projectId: string): Promise<void> {
    const project = this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      throw new ProjectServiceError("项目不存在。", "PROJECT_NOT_FOUND");
    }

    const projectSessions = this.db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.projectId, projectId))
      .all();

    for (const session of projectSessions) {
      await this.db.delete(sessionEvents).where(eq(sessionEvents.sessionId, session.id));
      await this.db.delete(approvalRequests).where(eq(approvalRequests.sessionId, session.id));
      await this.db.delete(fileChanges).where(eq(fileChanges.sessionId, session.id));
    }

    await this.db.delete(sessions).where(eq(sessions.projectId, projectId));
    await this.db.delete(fileChanges).where(eq(fileChanges.projectId, projectId));
    await this.db.delete(projects).where(eq(projects.id, projectId));
  }
}
