import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api";
import { Card, StatusDot, StatusBadge, SectionHeader, EmptyState, LoadingState, ErrorState } from "@agent-console/shared-ui";

export function HostsPage() {
  const { data, isLoading, error, refetch } = useQuery({
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
    <section className="px-4 pt-4 pb-2">
      {/* Host status header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">
            {summary?.name ?? "主机"}
          </h1>
          <StatusDot
            variant={summary?.status === "online" ? "online" : "idle"}
            label={summary?.status === "online" ? "在线" : "离线"}
            size="md"
          />
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          <StatusBadge variant={summary?.claudeAuthState === "available" ? "online" : "warning"}>
            Claude {summary?.claudeAuthState === "available" ? "已认证" : "未认证"}
          </StatusBadge>
          <StatusBadge variant={summary?.tailscaleState === "online" ? "online" : "neutral"}>
            Tailscale
          </StatusBadge>
          {summary?.activeSessionCount != null && summary.activeSessionCount > 0 && (
            <StatusBadge variant="info">
              {summary.activeSessionCount} 个活跃会话
            </StatusBadge>
          )}
        </div>
      </div>

      {isLoading && <LoadingState rows={3} />}
      {error && <ErrorState message={String(error)} retry={() => void refetch()} />}

      {/* Projects */}
      <SectionHeader
        title="Workspaces"
        description={`${projects.length} 个项目`}
        className="!mb-3"
      />

      {projects.length === 0 && !isLoading && (
        <EmptyState
          title="暂无已注册项目"
          description="请在主机管理页面添加项目"
        />
      )}

      <div className="space-y-2">
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`}>
            <Card padding="md" hover className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {project.name}
                  </span>
                  {project.gitBranch && (
                    <span className="text-[11px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-bg-inset)] px-1 py-0.5 rounded flex-shrink-0">
                      {project.gitBranch}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {project.uncommittedChanges > 0
                    ? `${project.uncommittedChanges} 个未提交文件`
                    : "工作区干净"}
                </p>
              </div>
              <ChevronRightIcon />
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-muted)] flex-shrink-0">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
