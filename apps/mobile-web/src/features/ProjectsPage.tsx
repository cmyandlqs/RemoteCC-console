import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api";

export function ProjectsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [promptInput, setPromptInput] = useState("");

  const { data: projectData, isLoading: loadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => apiClient.listProjects().then((r) => r.data.find((p) => p.id === projectId)),
    enabled: !!projectId,
  });

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions", projectId],
    queryFn: () => apiClient.listSessions(projectId!),
    enabled: !!projectId,
  });

  const createSession = useMutation({
    mutationFn: (prompt: string) => apiClient.createSession(projectId!, prompt),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["sessions", projectId] });
      setPromptInput("");
      navigate(`/sessions/${result.data.sessionId}`);
    },
  });

  const project = projectData;
  const sessions = sessionsData?.data ?? [];

  if (loadingProject && !project) {
    return <p className="loading-hint">加载中...</p>;
  }

  if (!project) {
    return <p className="error-hint">项目不存在</p>;
  }

  return (
    <section className="mobile-panel">
      <header className="section-header">
        <div>
          <h2>{project.name}</h2>
          <p className="project-path">{project.rootPath}</p>
          <p className="project-meta">
            分支：{project.gitBranch ?? "—"}
          </p>
        </div>
      </header>

      <div className="composer">
        <input
          type="text"
          placeholder="输入任务描述，启动 Claude Code"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && promptInput.trim()) {
              createSession.mutate(promptInput.trim());
            }
          }}
        />
        <button
          type="button"
          onClick={() => promptInput.trim() && createSession.mutate(promptInput.trim())}
          disabled={createSession.isPending || !promptInput.trim()}
        >
          {createSession.isPending ? "..." : "启动"}
        </button>
      </div>

      {createSession.error && (
        <p className="error-hint">{String(createSession.error)}</p>
      )}

      <h3 className="section-subtitle">会话历史</h3>

      {loadingSessions && <p className="loading-hint">加载中...</p>}

      {sessions.length === 0 && !loadingSessions && (
        <p className="empty-hint">暂无会话</p>
      )}

      <div className="stack">
        {sessions.map((session) => (
          <Link
            key={session.id}
            to={`/sessions/${session.id}`}
            className="list-card"
          >
            <div className="session-card-header">
              <strong>{session.name ?? "未命名会话"}</strong>
              <span className={`status-badge status-${session.status}`}>
                {session.status === "running"
                  ? "运行中"
                  : session.status === "idle"
                    ? "空闲"
                    : session.status === "waiting_approval"
                      ? "待审批"
                      : session.status === "error"
                        ? "错误"
                        : session.status === "completed"
                          ? "已完成"
                          : session.status === "stopped"
                            ? "已停止"
                            : "离线"}
              </span>
            </div>
            <span className="project-meta">
              {session.model ?? "—"} ·{" "}
              {session.lastActiveAt
                ? `${Math.round((Date.now() - new Date(session.lastActiveAt).getTime()) / 60000)} 分钟前`
                : "—"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}