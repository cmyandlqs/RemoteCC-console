import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { readdir, stat } from "node:fs/promises";

import type { AppDatabase } from "../../infra/database.js";
import { projects, sessions, fileChanges, sessionEvents, approvalRequests } from "../../infra/schema.js";
import type { GitService } from "../git/git-service.js";

export type ProjectRecord = {
  id: string;
  name: string;
  rootPath: string;
  isGitRepo: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  gitBranch: string | null;
  uncommittedChanges: number;
};

export type FileEntry = {
  name: string;
  type: "file" | "directory";
  size: number;
  modifiedAt: string;
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
  constructor(
    private readonly db: AppDatabase,
    private readonly gitService?: GitService,
  ) {}

  private async enrichWithGit(record: typeof projects.$inferSelect): Promise<ProjectRecord> {
    if (!this.gitService || !record.isGitRepo) {
      return {
        ...record,
        gitBranch: null,
        uncommittedChanges: 0,
      };
    }
    try {
      const status = await this.gitService.getStatus(record.rootPath);
      return {
        ...record,
        gitBranch: status.branch,
        uncommittedChanges: status.staged + status.unstaged + status.untracked,
      };
    } catch {
      return {
        ...record,
        gitBranch: null,
        uncommittedChanges: 0,
      };
    }
  }

  async list(): Promise<ProjectRecord[]> {
    const rows = this.db.select().from(projects).all();
    return Promise.all(rows.map((r) => this.enrichWithGit(r)));
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

    let realPath: string;
    try {
      realPath = fs.realpathSync(rootPath);
    } catch {
      throw new ProjectServiceError("项目路径无效。", "INVALID_PATH");
    }

    if (realPath !== rootPath) {
      throw new ProjectServiceError("项目路径不能是符号链接。", "INVALID_PATH");
    }

    const home = os.homedir();
    const sensitiveDirs = [".ssh", ".aws", ".gnupg", ".kube", ".config"];
    for (const dir of sensitiveDirs) {
      if (realPath.startsWith(path.join(home, dir))) {
        throw new ProjectServiceError("不允许将敏感目录注册为项目。", "INVALID_PATH");
      }
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

    const record = {
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

    return this.enrichWithGit(record as typeof projects.$inferSelect);
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

    return {
      ...project,
      gitBranch: null,
      uncommittedChanges: 0,
    };
  }

  async enrichById(projectId: string): Promise<ProjectRecord> {
    const project = this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      throw new ProjectServiceError("项目不存在。", "PROJECT_NOT_FOUND");
    }

    return this.enrichWithGit(project);
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

    return this.enrichById(projectId);
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

  async listFiles(projectId: string, relativePath = "."): Promise<{ entries: FileEntry[]; currentPath: string }> {
    const project = this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      throw new ProjectServiceError("项目不存在。", "PROJECT_NOT_FOUND");
    }

    const targetPath = path.join(project.rootPath, relativePath);
    const resolved = path.resolve(targetPath);
    const rootResolved = path.resolve(project.rootPath);

    if (!resolved.startsWith(rootResolved)) {
      throw new ProjectServiceError("非法路径。", "INVALID_PATH");
    }

    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      throw new ProjectServiceError("路径不存在。", "PATH_NOT_FOUND");
    }

    const entries = await readdir(resolved, { withFileTypes: true });
    const result: FileEntry[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(resolved, entry.name);
      const s = await stat(fullPath);
      result.push({
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file",
        size: s.size,
        modifiedAt: s.mtime.toISOString(),
      });
    }

    result.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "directory" ? -1 : 1;
    });

    return {
      entries: result,
      currentPath: relativePath,
    };
  }
}
