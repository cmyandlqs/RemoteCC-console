import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api.js";
import {
  Card,
  Button,
  SectionHeader,
  EmptyState,
  LoadingState,
  ErrorState,
} from "@agent-console/shared-ui";

export function ApprovalsPage() {
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: apiClient.listPendingApprovals,
  });

  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "rejected" | "dismissed" }) =>
      apiClient.respondApproval(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals", "pending"] }),
  });

  const approvals = data?.data ?? [];

  return (
    <section className="px-4 pt-4 pb-2">
      <SectionHeader
        title="审批中心"
        description={`${approvals.length} 个待处理`}
      />

      {isLoading && <LoadingState rows={3} />}
      {error && <ErrorState message={String(error)} retry={() => void refetch()} />}

      {!isLoading && !error && approvals.length === 0 && (
        <EmptyState
          title="暂无待处理审批"
          description="所有审批请求已处理完毕"
        />
      )}

      <div className="space-y-3">
        {approvals.map((approval) => (
          <Card
            key={approval.id}
            padding="md"
            className="relative overflow-hidden border-l-4 border-l-[var(--color-status-warning)]"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-medium text-[var(--color-status-warning)] bg-[var(--color-status-warning-bg)] px-1.5 py-0.5 rounded">
                {approval.toolName}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {approval.sessionId.slice(0, 8)}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {approval.description ?? "无描述"}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {new Date(approval.createdAt).toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="danger"
                size="sm"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: approval.id, action: "rejected" })}
              >
                拒绝
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: approval.id, action: "dismissed" })}
              >
                忽略
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
