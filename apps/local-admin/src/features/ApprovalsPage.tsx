import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
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
    <div className="max-w-3xl">
      <SectionHeader
        title="审批中心"
        description={`待处理审批 · ${approvals.length} 个`}
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
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
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
