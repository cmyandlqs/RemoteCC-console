import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api";

export function ProjectsPage() {
  const qc = useQueryClient();
  const [pathInput, setPathInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: apiClient.listProjects,
  });

  const create = useMutation({
    mutationFn: ({ name, rootPath }: { name: string; rootPath: string }) =>
      apiClient.createProject(name, rootPath),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
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
    setPathInput("");
    setNameInput("");
  };

  return (
    <section className="panel">
      <h2>项目管理</h2>
      <div className="stack">
        <div className="row-card">
          <div className="form-row">
            <input
              type="text"
              placeholder="/home/user/projects/my-project"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
            />
            <input
              type="text"
              placeholder="项目名称（可选）"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <button type="button" onClick={handleAdd} disabled={create.isPending}>
              {create.isPending ? "添加中..." : "添加项目"}
            </button>
          </div>
          {create.error && (
            <p className="error-hint">{String(create.error)}</p>
          )}
        </div>

        {isLoading && <p className="loading-hint">加载中...</p>}
        {error && <p className="error-hint">{String(error)}</p>}

        {data?.data?.length === 0 && (
          <p className="empty-hint">暂无已注册项目，请添加。</p>
        )}

        {data?.data?.map((project) => (
          <div key={project.id} className="row-card project-row">
            <div>
              <strong>{project.name}</strong>
              <p className="project-path">{project.rootPath}</p>
              <p className="project-meta">
                分支：{project.gitBranch ?? "—"}&nbsp;
                · 未提交：{project.uncommittedChanges} 个文件
              </p>
            </div>
            <button
              type="button"
              className="btn-danger"
              onClick={() => deletePrj.mutate(project.id)}
              disabled={deletePrj.isPending}
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}