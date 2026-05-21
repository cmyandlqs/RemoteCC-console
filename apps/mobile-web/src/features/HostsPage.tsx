import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api";
import { Card, StatusDot, StatusBadge, EmptyState, LoadingState, ErrorState } from "@agent-console/shared-ui";

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
    <section className="px-4 pt-5 pb-2">
      <div className="mb-7">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
            {summary?.name ?? "主机"}
          </h1>
          <StatusDot
            variant={summary?.status === "online" ? "online" : "idle"}
            label={summary?.status === "online" ? "在线" : "离线"}
            size="md"
          />
        </div>

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

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] tracking-tight">
          Workspaces
        </h2>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {projects.length} 个项目
        </span>
      </div>

      {projects.length === 0 && !isLoading && (
        <EmptyState
          title="暂无已注册项目"
          description="请在主机管理页面添加项目"
        />
      )}

      <div className="space-y-3">
        {projects.map((project) => {
          const hasChanges = project.uncommittedChanges > 0;
          return (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card
                padding="md"
                hover
                className={[
                  "flex items-center justify-between gap-3",
                  hasChanges ? "border-l-2 border-l-[var(--color-status-warning)]" : "",
                ].join(" ")}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-0.5 text-[var(--color-text-muted)]">
                    <FolderIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-[var(--color-text-primary)] truncate">
                        {project.name}
                      </span>
                      {project.gitBranch && (
                        <span className="text-[11px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-bg-inset)] px-1.5 py-0.5 rounded flex-shrink-0">
                          {project.gitBranch}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {hasChanges
                        ? `${project.uncommittedChanges} 个未提交文件`
                        : "工作区干净"}
                    </p>
                    {project.lastActiveAt && (
                      <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                        {formatRelativeTime(project.lastActiveAt)}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRightIcon />
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "刚刚活跃";
  if (mins < 60) return `${mins} 分钟前活跃`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} 小时前活跃`;
  return `${Math.round(hours / 24)} 天前活跃`;
}

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-muted)] flex-shrink-0">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
