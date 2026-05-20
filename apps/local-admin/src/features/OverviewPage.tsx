import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";

export function OverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["host-info"],
    queryFn: apiClient.getHostInfo,
    refetchInterval: 30_000,
  });

  const summary = data?.data;

  return (
    <section className="panel">
      <h2>主机概览</h2>
      {isLoading && <p className="loading-hint">加载中...</p>}
      {error && <p className="error-hint">加载失败：{String(error)}</p>}
      {summary && (
        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-label">Host 名称</span>
            <strong>{summary.name}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">操作系统</span>
            <strong>{summary.os}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Daemon 版本</span>
            <strong>{summary.daemonVersion}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">活跃会话</span>
            <strong>{summary.activeSessionCount} 个</strong>
          </div>
          <div className={`metric-card metric-card--${summary.claudeAuthState === "available" ? "success" : "error"}`}>
            <span className="metric-label">Claude 认证</span>
            <strong>
              {summary.claudeAuthState === "available"
                ? "已登录"
                : summary.claudeAuthState === "unavailable"
                  ? "未登录"
                  : "检查失败"}
            </strong>
          </div>
          <div className={`metric-card metric-card--${summary.tailscaleState === "online" ? "success" : "warning"}`}>
            <span className="metric-label">Tailscale</span>
            <strong>
              {summary.tailscaleState === "online"
                ? "在线"
                : summary.tailscaleState === "offline"
                  ? "离线"
                  : "未安装"}
            </strong>
          </div>
        </div>
      )}
    </section>
  );
}