import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { Card, StatusBadge, MetricRow, MetricGrid, LoadingState, ErrorState } from "@agent-console/shared-ui";

export function OverviewPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["host-info"],
    queryFn: apiClient.getHostInfo,
    refetchInterval: 30_000,
  });

  const summary = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight mb-5">概览</h1>
        <LoadingState rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight mb-5">概览</h1>
        <ErrorState message={`加载失败：${String(error)}`} retry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">概览</h1>
        <StatusBadge variant={summary?.status === "online" ? "online" : "error"}>
          {summary?.status === "online" ? "在线" : "离线"}
        </StatusBadge>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <StatusBadge variant={summary?.claudeAuthState === "available" ? "online" : "warning"}>
          Claude {summary?.claudeAuthState === "available" ? "已认证" : "未认证"}
        </StatusBadge>
        <StatusBadge variant={summary?.tailscaleState === "online" ? "online" : summary?.tailscaleState === "offline" ? "warning" : "neutral"}>
          Tailscale {summary?.tailscaleState === "online" ? "在线" : summary?.tailscaleState === "offline" ? "离线" : "未安装"}
        </StatusBadge>
        <StatusBadge variant="info">
          v{summary?.daemonVersion ?? "—"}
        </StatusBadge>
      </div>

      {/* Metrics */}
      <MetricGrid columns={3}>
        <Card padding="md" hover>
          <MetricRow label="Host 名称" value={summary?.name ?? "—"} />
        </Card>
        <Card padding="md" hover>
          <MetricRow label="操作系统" value={summary?.os ?? "—"} />
        </Card>
        <Card padding="md" hover>
          <MetricRow label="活跃会话" value={`${summary?.activeSessionCount ?? 0}`} mono />
        </Card>
      </MetricGrid>
    </div>
  );
}
