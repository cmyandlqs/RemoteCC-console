import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import {
  Card,
  Button,
  StatusBadge,
  SectionHeader,
  EmptyState,
  LoadingState,
  ErrorState,
} from "@agent-console/shared-ui";

export function ProjectSessionsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["project-sessions", projectId],
    queryFn: () => apiClient.listSessions(projectId!),
    enabled: !!projectId,
  });

  const stopSession = useMutation({
    mutationFn: (sid: string) => apiClient.stopSession(sid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-sessions", projectId] }),
  });

  const sessions = data?.data ?? [];

  const statusVariantMap: Record<string, string> = {
    running: "online",
    idle: "idle",
    waiting_approval: "warning",
    error: "error",
    completed: "info",
    stopped: "neutral",
    disconnected: "neutral",
  };

  const statusLabelMap: Record<string, string> = {
    running: "运行中",
    idle: "空闲",
    waiting_approval: "待审批",
    error: "错误",
    completed: "已完成",
    stopped: "已停止",
    disconnected: "离线",
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <Link to="/projects" className="back-link">
          <ChevronLeftIcon />
          返回项目
        </Link>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight mt-2">
          项目会话
        </h1>
      </div>

      {isLoading && <LoadingState rows={3} />}
      {error && <ErrorState message={String(error)} retry={() => void refetch()} />}

      {!isLoading && !error && sessions.length === 0 && (
        <EmptyState title="暂无会话" description="此项目下没有活跃或历史会话" />
      )}

      <div className="space-y-2">
        {sessions.map((session) => (
          <Card
            key={session.id}
            padding="md"
            hover
            className="flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {session.name ?? "未命名会话"}
                </span>
                <StatusBadge variant={statusVariantMap[session.status] as any ?? "neutral"}>
                  {statusLabelMap[session.status] ?? session.status}
                </StatusBadge>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {session.model ?? "—"}
                {session.lastActiveAt && (
                  <span className="ml-2">· {new Date(session.lastActiveAt).toLocaleString()}</span>
                )}
              </p>
              {session.lastError && (
                <p className="mt-1 text-xs text-[var(--color-status-error)]">
                  {session.lastError}
                </p>
              )}
            </div>
            {session.status === "running" && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => stopSession.mutate(session.id)}
                disabled={stopSession.isPending}
              >
                停止
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
