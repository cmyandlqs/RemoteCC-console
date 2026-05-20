import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api";

export function ApprovalsPage() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: apiClient.listPendingApprovals,
  });

  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "rejected" | "dismissed" }) =>
      apiClient.respondApproval(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals", "pending"] }),
  });

  return (
    <section className="panel">
      <h2>审批管理</h2>
      {isLoading && <p className="loading-hint">加载中...</p>}
      {error && <p className="error-hint">加载失败：{String(error)}</p>}

      {data?.data?.length === 0 && (
        <p className="empty-hint">暂无待处理审批</p>
      )}

      <div className="stack">
        {data?.data?.map((approval) => (
          <div key={approval.id} className="row-card">
            <div>
              <strong>⚠ {approval.toolName}</strong>
              <p className="approval-desc">{approval.description ?? "无描述"}</p>
              <p className="project-meta">
                会话：{approval.sessionId.slice(0, 8)}... ·{" "}
                {new Date(approval.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="actions">
              <button
                type="button"
                className="btn-danger"
                onClick={() => respond.mutate({ id: approval.id, action: "rejected" })}
                disabled={respond.isPending}
              >
                拒绝
              </button>
              <button
                type="button"
                onClick={() => respond.mutate({ id: approval.id, action: "dismissed" })}
                disabled={respond.isPending}
              >
                忽略
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}