import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api";

export function PairingPage() {
  const qc = useQueryClient();

  const { data: devicesData, isLoading: loadingDevices } = useQuery({
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

  return (
    <section className="panel">
      <h2>配对与访问</h2>
      <div className="pairing-grid">
        <div className="qr-section">
          <div className="qr-placeholder">
            {createToken.data ? (
              <div className="pairing-token">
                <p>配对码</p>
                <code>{createToken.data.data.token}</code>
              </div>
            ) : (
              <p>生成配对码以绑定设备</p>
            )}
          </div>
          <button
            type="button"
            className="btn-generate"
            onClick={() => createToken.mutate(undefined)}
            disabled={createToken.isPending}
          >
            {createToken.isPending ? "生成中..." : "生成配对码"}
          </button>
        </div>

        <div className="stack">
          <div className="row-card">
            <strong>当前访问地址</strong>
            <p className="access-url">{window.location.origin}</p>
          </div>

          <div className="row-card">
            <strong>已连接设备</strong>
            {loadingDevices ? (
              <p>加载中...</p>
            ) : devicesData?.data?.length === 0 ? (
              <p>暂无已连接设备</p>
            ) : (
              <ul className="device-list">
                {devicesData?.data?.map((d) => (
                  <li key={d.id}>
                    <span>{d.deviceName ?? "未命名设备"}</span>
                    <span className="device-meta">
                      {d.status} · {d.lastUsedAt ? new Date(d.lastUsedAt).toLocaleString() : "从未使用"}
                    </span>
                    <button
                      type="button"
                      className="btn-small-danger"
                      onClick={() => revoke.mutate(d.id)}
                      disabled={revoke.isPending}
                    >
                      移除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}