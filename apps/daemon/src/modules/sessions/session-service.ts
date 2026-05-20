export type SessionRecord = {
  id: string;
  projectId: string;
  title: string;
  status: "idle" | "streaming" | "suspended";
  model: string;
};

export class SessionService {
  private readonly sessions: SessionRecord[] = [];

  listByProject(projectId: string): SessionRecord[] {
    return this.sessions.filter((session) => session.projectId === projectId);
  }

  create(projectId: string, title: string): SessionRecord {
    const session: SessionRecord = {
      id: `sess_${this.sessions.length + 1}`,
      projectId,
      title,
      status: "idle",
      model: "unknown",
    };
    this.sessions.push(session);
    return session;
  }
}
