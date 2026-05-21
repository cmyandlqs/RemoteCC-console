import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import {
  Card,
  Button,
  Input,
  SectionHeader,
  EmptyState,
  LoadingState,
  ErrorState,
  IconButton,
} from "@agent-console/shared-ui";

export function ProjectsPage() {
  const qc = useQueryClient();
  const [pathInput, setPathInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: apiClient.listProjects,
  });

  const create = useMutation({
    mutationFn: ({ name, rootPath }: { name: string; rootPath: string }) =>
      apiClient.createProject(name, rootPath),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setPathInput("");
      setNameInput("");
      setShowForm(false);
    },
  });

  const deletePrj = useMutation({
    mutationFn: (id: string) => apiClient.deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const handleAdd = () => {
    const path = pathInput.trim();
    const name = (nameInput.trim() || path.split("/").pop()) ?? "未命名项目";
    if (!path) return;
    create.mutate({ name, rootPath: path });
  };

  const projects = data?.data ?? [];

  return (
    <div className="max-w-3xl">
      <SectionHeader
        title="Workspaces"
        description="管理已注册的项目目录"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "取消" : "添加项目"}
          </Button>
        }
      />

      {/* Inline add form */}
      {showForm && (
        <Card padding="md" className="mb-4 animate-in fade-in slide-in-from-top-2 duration-[var(--duration-normal)]">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="/home/user/projects/my-project"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              className="flex-1 min-w-[200px]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <Input
              placeholder="项目名称（可选）"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-48"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <Button
              variant="primary"
              size="md"
              disabled={create.isPending || !pathInput.trim()}
              onClick={handleAdd}
            >
              {create.isPending ? "添加中..." : "添加"}
            </Button>
          </div>
          {create.error && (
            <p className="mt-2 text-xs text-[var(--color-status-error)]">
              {String(create.error)}
            </p>
          )}
        </Card>
      )}

      {isLoading && <LoadingState rows={3} />}
      {error && <ErrorState message={String(error)} retry={() => void refetch()} />}

      {!isLoading && !error && projects.length === 0 && (
        <EmptyState
          title="暂无已注册项目"
          description="请添加项目目录以开始使用"
        />
      )}

      <div className="space-y-2">
        {projects.map((project) => (
          <Card
            key={project.id}
            padding="md"
            hover
            className="flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {project.name}
                </span>
                {project.gitBranch && (
                  <span className="text-xs font-mono text-[var(--color-text-tertiary)] bg-[var(--color-bg-inset)] px-1.5 py-0.5 rounded">
                    {project.gitBranch}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)] font-mono truncate">
                {project.rootPath}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {project.uncommittedChanges > 0
                  ? `${project.uncommittedChanges} 个未提交文件`
                  : "工作区干净"}
                {project.lastActiveAt && (
                  <span className="ml-2">· {new Date(project.lastActiveAt).toLocaleDateString()}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Link to={`/projects/${project.id}/sessions`}>
                <IconButton label="查看会话">
                  <ArrowRightIcon />
                </IconButton>
              </Link>
              <IconButton
                label="删除项目"
                className="hover:bg-[var(--color-status-error-bg)] hover:text-[var(--color-status-error)]"
                onClick={() => deletePrj.mutate(project.id)}
              >
                <TrashIcon />
              </IconButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
