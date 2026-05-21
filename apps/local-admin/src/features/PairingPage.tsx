import { useEffect } from "react";
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

export function PairingPage() {
  const qc = useQueryClient();

  const { data: devicesData, isLoading: loadingDevices, refetch: refetchDevices } = useQuery({
    queryKey: ["devices"],
    queryFn: apiClient.listDevices,
  });

  const createToken = useMutation({
    mutationFn: (deviceName?: string) => apiClient.createPairingToken(deviceName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => apiClient.revokeDevice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });

  useEffect(() => {
    const url = window.location.origin;
    const link = document.createElement("a");
    link.href = url;
    document.querySelector<HTMLDivElement>(".access-url")?.setAttribute("data-url", link.href);
  }, []);

  const devices = devicesData?.data ?? [];

  return (
    <div className="max-w-3xl">
      <SectionHeader
        title="配对与访问"
        description="管理设备绑定与配对码"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Pairing */}
        <div className="space-y-3">
          <Card padding="md" className="flex flex-col items-center text-center">
            <div className="w-full h-48 rounded-lg bg-[var(--color-bg-inset)] border border-dashed border-[var(--color-border-strong)] flex items-center justify-center">
              {createToken.data ? (
                <div className="text-center px-4">
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-2">配对码</p>
                  <code className="font-mono text-sm bg-[var(--color-bg-base)] px-3 py-2 rounded-md break-all">
                    {createToken.data.data.token}
                  </code>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">生成配对码以绑定设备</p>
              )}
            </div>
            <Button
              variant="primary"
              size="md"
              fullWidth
              className="mt-3"
              onClick={() => createToken.mutate(undefined)}
              disabled={createToken.isPending}
            >
              {createToken.isPending ? "生成中..." : "生成配对码"}
            </Button>
          </Card>

          <Card padding="md">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">当前访问地址</p>
            <div className="access-url font-mono text-sm text-[var(--color-text-secondary)] break-all" />
          </Card>
        </div>

        {/* Right: Devices */}
        <div>
          <Card padding="md">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3 font-medium">已连接设备</p>

            {loadingDevices && <LoadingState rows={2} />}
            {devices.length === 0 && !loadingDevices && (
              <EmptyState
                title="暂无已连接设备"
                description="生成配对码后绑定设备"
              />
            )}

            <div className="space-y-2">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 py-2 px-3 rounded-md hover:bg-[var(--color-bg-surface-hover)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {d.deviceName ?? "未命名设备"}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {d.status}
                      {d.lastUsedAt && (
                        <span className="ml-1">· {new Date(d.lastUsedAt).toLocaleString()}</span>
                      )}
                    </p>
                  </div>
                  <IconButton
                    label="移除设备"
                    className="hover:bg-[var(--color-status-error-bg)] hover:text-[var(--color-status-error)]"
                    onClick={() => revoke.mutate(d.id)}
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
