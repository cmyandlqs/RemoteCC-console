import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api.js";
import {
  Card,
  Button,
  Input,
  StatusBadge,
  SectionHeader,
  EmptyState,
  LoadingState,
  ErrorState,
} from "@agent-console/shared-ui";

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

  const { data: sessionsData, isLoading: loadingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ["sessions", projectId],
    queryFn: () => apiClient.listSessions(projectId!),
    enabled: !!projectId,
  });

  const createSession = useMutation({
    mutationFn: (prompt: string) => apiClient.createSession(projectId!, prompt),
    onSuccess: (result, prompt) => {
      qc.invalidateQueries({ queryKey: ["sessions", projectId] });
      setPromptInput("");
      navigate(`/sessions/${result.data.sessionId}`, { state: { prompt } });
    },
  });

  const project = projectData;
  const sessions = sessionsData?.data ?? [];

  if (loadingProject && !project) {
    return <LoadingState rows={3} />;
  }

  if (!project) {
    return <ErrorState message="项目不存在" />;
  }

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
    <section className="px-4 pt-4 pb-2">
      {/* Project header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Link to="/" className="text-[var(--color-text-tertiary)]">
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">
            {project.name}
          </h1>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] font-mono truncate ml-6">
          {project.rootPath}
        </p>
        {project.gitBranch && (
          <div className="flex items-center gap-2 mt-1.5 ml-6">
            <span className="text-[11px] font-mono text-[var(--color-text-tertiary)] bg-[var(--color-bg-inset)] px-1.5 py-0.5 rounded">
              {project.gitBranch}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              {project.uncommittedChanges > 0
                ? `${project.uncommittedChanges} 个未提交`
                : "工作区干净"}
            </span>
          </div>
        )}
      </div>

      {/* New session composer */}
      <Card padding="md" className="mb-5">
        <p className="text-xs text-[var(--color-text-muted)] mb-2">输入任务，启动 Claude Code</p>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="例如：修复登录页面的响应式布局"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && promptInput.trim()) {
                createSession.mutate(promptInput.trim());
              }
            }}
            disabled={createSession.isPending}
            className="flex-1"
          />
          <Button
            variant="primary"
            size="md"
            disabled={createSession.isPending || !promptInput.trim()}
            onClick={() => promptInput.trim() && createSession.mutate(promptInput.trim())}
          >
            {createSession.isPending ? "..." : "启动"}
          </Button>
        </div>
        {createSession.error && (
          <p className="mt-2 text-xs text-[var(--color-status-error)]">
            {String(createSession.error)}
          </p>
        )}
      </Card>

      {/* Session list */}
      <SectionHeader
        title="会话历史"
        description={`${sessions.length} 个会话`}
        className="!mb-3"
      />

      {loadingSessions && <LoadingState rows={3} />}

      {sessions.length === 0 && !loadingSessions && (
        <EmptyState title="暂无会话" description="创建新会话以开始" />
      )}

      <div className="space-y-2">
        {sessions.map((session) => (
          <Link key={session.id} to={`/sessions/${session.id}`}>
            <Card padding="md" hover className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {session.name ?? "未命名会话"}
                  </span>
                  <StatusBadge variant={statusVariantMap[session.status] as any ?? "neutral"}>
                    {statusLabelMap[session.status] ?? session.status}
                  </StatusBadge>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {session.model ?? "—"}
                  {session.lastActiveAt && (
                    <span className="ml-2">
                      {Math.round((Date.now() - new Date(session.lastActiveAt).getTime()) / 60000)} 分钟前
                    </span>
                  )}
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

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
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
