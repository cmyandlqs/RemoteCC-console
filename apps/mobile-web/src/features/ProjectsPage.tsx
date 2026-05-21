import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api.js";
import {
  Card,
  Button,
  StatusBadge,
  EmptyState,
  LoadingState,
  ErrorState,
} from "@agent-console/shared-ui";

export function ProjectsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [promptInput, setPromptInput] = useState("");
  const [showFileDrawer, setShowFileDrawer] = useState(false);
  const [filePath, setFilePath] = useState(".");

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

  const { data: filesData, isLoading: loadingFiles } = useQuery({
    queryKey: ["project-files", projectId, filePath],
    queryFn: () => apiClient.listProjectFiles(projectId!, filePath),
    enabled: !!projectId && showFileDrawer,
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
  const fileEntries = filesData?.data?.entries ?? [];
  const currentFilePath = filesData?.data?.currentPath ?? ".";

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

  const navigateDir = (name: string) => {
    if (currentFilePath === ".") {
      setFilePath(name);
    } else {
      setFilePath(`${currentFilePath}/${name}`);
    }
  };

  const goUp = () => {
    if (currentFilePath === ".") return;
    const parts = currentFilePath.split("/");
    parts.pop();
    setFilePath(parts.length === 0 ? "." : parts.join("/"));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section className="px-4 pt-5 pb-2">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Link to="/" className="text-[var(--color-text-tertiary)]">
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
            {project.name}
          </h1>
        </div>
        <div className="ml-7">
          <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">
            {project.rootPath}
          </p>
          {project.gitBranch && (
            <div className="flex items-center gap-2 mt-1.5">
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
          <button
            type="button"
            onClick={() => { setShowFileDrawer(true); setFilePath("."); }}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            <FolderOpenIcon />
            查看文件
          </button>
        </div>
      </div>

      <Card padding="lg" className="mb-6 border-[var(--color-accent)]/20">
        <div className="flex items-center gap-2 mb-3">
          <SparkleIcon />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">新建会话</h3>
        </div>
        <textarea
          placeholder="描述你想让 Claude Code 做什么..."
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && promptInput.trim()) {
              e.preventDefault();
              createSession.mutate(promptInput.trim());
            }
          }}
          disabled={createSession.isPending}
          rows={3}
          className={[
            "w-full resize-none rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-inset)] shadow-inner",
            "px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]",
            "transition-colors duration-[var(--duration-fast)]",
          ].join(" ")}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Enter 发送 · Shift+Enter 换行
          </span>
          <Button
            variant="primary"
            size="md"
            disabled={createSession.isPending || !promptInput.trim()}
            onClick={() => promptInput.trim() && createSession.mutate(promptInput.trim())}
          >
            {createSession.isPending ? "启动中..." : "启动会话"}
          </Button>
        </div>
        {createSession.error && (
          <p className="mt-2 text-xs text-[var(--color-status-error)]">
            {String(createSession.error)}
          </p>
        )}
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] tracking-tight">
          会话历史
        </h2>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {sessions.length} 个会话
        </span>
      </div>

      {loadingSessions && <LoadingState rows={3} />}

      {sessions.length === 0 && !loadingSessions && (
        <EmptyState title="暂无会话" description="创建新会话以开始" />
      )}

      <div className="space-y-3">
        {sessions.map((session) => {
          const isActive = session.status === "running" || session.status === "waiting_approval";
          return (
            <Link key={session.id} to={`/sessions/${session.id}`}>
              <Card
                padding="md"
                hover
                className={[
                  "flex items-center justify-between gap-3",
                  isActive ? "border-l-2 border-l-[var(--color-status-online)]" : "",
                  session.status === "error" ? "border-l-2 border-l-[var(--color-status-error)]" : "",
                ].join(" ")}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-0.5 text-[var(--color-text-muted)]">
                    <TerminalIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[15px] font-medium text-[var(--color-text-primary)] truncate">
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
                          {formatRelativeTime(session.lastActiveAt)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <ChevronRightIcon />
              </Card>
            </Link>
          );
        })}
      </div>

      {/* File Browser Drawer */}
      {showFileDrawer && (
        <div
          className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/20 backdrop-blur-sm"
          onClick={() => setShowFileDrawer(false)}
        />
      )}
      {showFileDrawer && (
        <div className="fixed bottom-0 left-0 right-0 z-[var(--z-modal)] bg-[var(--color-bg-surface)] rounded-t-2xl border-t border-[var(--color-border-subtle)] shadow-lg max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 min-w-0">
              {currentFilePath !== "." && (
                <button
                  type="button"
                  onClick={goUp}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-surface-hover)] transition-colors"
                >
                  <ChevronLeftIcon />
                </button>
              )}
              <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {currentFilePath === "." ? "文件" : currentFilePath}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowFileDrawer(false)}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-surface-hover)] transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-1">
            {loadingFiles && (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">加载中...</div>
            )}

            {fileEntries.length === 0 && !loadingFiles && (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">空文件夹</div>
            )}

            <div className="space-y-0.5">
              {fileEntries.map((entry) => (
                <button
                  key={entry.name}
                  type="button"
                  onClick={() => entry.type === "directory" ? navigateDir(entry.name) : undefined}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-[var(--color-bg-inset)] transition-colors"
                >
                  <span className="flex-shrink-0 text-[var(--color-text-muted)]">
                    {entry.type === "directory" ? <FolderIcon /> : <FileIcon />}
                  </span>
                  <span className="flex-1 min-w-0 text-sm text-[var(--color-text-primary)] truncate">
                    {entry.name}
                  </span>
                  <span className="flex-shrink-0 text-[11px] text-[var(--color-text-muted)] tabular-nums">
                    {entry.type === "file" ? formatFileSize(entry.size) : "—"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
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

function TerminalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-accent)]">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z" />
    </svg>
  );
}

function FolderOpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 17h12M6 17l3-6h6l3 6M6 17l-2-9h16l-2 9" />
      <path d="M4 8h16" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-status-warning)]">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
