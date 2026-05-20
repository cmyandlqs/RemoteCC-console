import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";

export function ProjectSessionsPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["project-sessions", projectId],
    queryFn: () => apiClient.listSessions(projectId!),
    enabled: !!projectId,
  });

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <Link to="/projects" className="back-link">← 返回项目</Link>
          <h2>项目会话</h2>
        </div>
      </div>

      {isLoading && <p className="loading-hint">加载中...</p>}
      {error && <p className="error-hint">加载失败：{String(error)}</p>}

      {data?.data?.length === 0 && (
        <p className="empty-hint">暂无会话</p>
      )}

      <div className="stack">
        {data?.data?.map((session) => (
          <div key={session.id} className="row-card">
            <div>
              <strong>{session.name ?? "未命名会话"}</strong>
              <p className="project-meta">
                状态：{session.status} · 模型：{session.model ?? "—"}
              </p>
              {session.lastError && (
                <p className="error-hint">错误：{session.lastError}</p>
              )}
            </div>
            <div className="actions">
              {session.status === "running" && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => apiClient.stopSession(session.id)}
                >
                  停止
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}