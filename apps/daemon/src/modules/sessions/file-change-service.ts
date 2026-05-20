import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import type { AppDatabase } from "../../infra/database.js";
import { fileChanges } from "../../infra/schema.js";
import type { EventBus } from "../../infra/event-bus.js";

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

export class FileChangeService {
  constructor(
    private readonly db: AppDatabase,
    private readonly eventBus: EventBus,
  ) {}

  async track(input: {
    sessionId: string;
    projectId: string;
    path: string;
    changeType: FileChangeRecord["changeType"];
    additions?: number;
    deletions?: number;
    diffExcerpt?: string;
  }): Promise<FileChangeRecord> {
    const now = new Date().toISOString();
    const id = uuidv7();

    const record: FileChangeRecord = {
      id,
      sessionId: input.sessionId,
      projectId: input.projectId,
      path: input.path,
      changeType: input.changeType,
      additions: input.additions ?? null,
      deletions: input.deletions ?? null,
      diffExcerpt: input.diffExcerpt ?? null,
      createdAt: now,
    };

    await this.db.insert(fileChanges).values({
      id: record.id,
      sessionId: record.sessionId,
      projectId: record.projectId,
      path: record.path,
      changeType: record.changeType,
      additions: record.additions,
      deletions: record.deletions,
      diffExcerpt: record.diffExcerpt,
      createdAt: record.createdAt,
    });

    this.eventBus.publish(
      "session.file_change.updated",
      {
        id: record.id,
        path: record.path,
        changeType: record.changeType,
      },
      { sessionId: input.sessionId, projectId: input.projectId },
    );

    return record;
  }

  listBySession(sessionId: string): FileChangeRecord[] {
    return this.db
      .select()
      .from(fileChanges)
      .where(eq(fileChanges.sessionId, sessionId))
      .all();
  }

  listByProject(projectId: string): FileChangeRecord[] {
    return this.db
      .select()
      .from(fileChanges)
      .where(eq(fileChanges.projectId, projectId))
      .all();
  }
}
