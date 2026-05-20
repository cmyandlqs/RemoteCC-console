import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api";

export function HostsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["host-info"],
    queryFn: apiClient.getHostInfo,
    refetchInterval: 30_000,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: apiClient.listProjects,
  });

  const summary = data?.data;
  const projects = projectsData?.data ?? [];

  return (
    <section className="mobile-panel">
      <header className="section-header">
        <div>
          <h2>我的主机</h2>
          <p>
            {summary?.status === "online"
              ? `${summary.name} · 在线`
              : "主机离线"}
          </p>
        </div>
        <span className={`status-dot ${summary?.status === "online" ? "online" : "offline"}`}>
          {summary?.status === "online" ? "在线" : "离线"}
        </span>
      </header>

      {isLoading && <p className="loading-hint">加载中...</p>}
      {error && <p className="error-hint">加载失败</p>}

      {projects.length === 0 && !isLoading && (
        <div className="empty-state">
          <p>暂无已注册项目</p>
          <p className="empty-sub">请在主机管理页面添加项目</p>
        </div>
      )}

      <div className="stack">
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="list-card">
            <div className="project-card-header">
              <strong>{project.name}</strong>
              <span className="project-branch">{project.gitBranch ?? "—"}</span>
            </div>
            <span className="project-meta">
              {project.uncommittedChanges > 0
                ? `${project.uncommittedChanges} 个未提交文件`
                : "工作区干净"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}