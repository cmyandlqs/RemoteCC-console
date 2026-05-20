import { Link, Route, Routes } from "react-router-dom";
import { create } from "zustand";

type AdminStore = {
  connectedDevices: number;
};

const useAdminStore = create<AdminStore>(() => ({
  connectedDevices: 1,
}));

function OverviewPage() {
  return (
    <section className="panel">
      <h2>主机概览</h2>
      <div className="metric-grid">
        <div className="metric-card">
          <span className="metric-label">Host 状态</span>
          <strong>在线</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Claude 认证</span>
          <strong>待检查</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Tailscale</span>
          <strong>待检查</strong>
        </div>
      </div>
    </section>
  );
}

function ProjectsPage() {
  return (
    <section className="panel">
      <h2>项目管理</h2>
      <div className="stack">
        <div className="row-card">
          <div>
            <strong>新增项目</strong>
            <p>后续接入真实项目注册表和路径校验。</p>
          </div>
          <button type="button">添加项目</button>
        </div>
        <div className="row-card">
          <div>
            <strong>当前项目列表</strong>
            <p>当前骨架仅提供静态占位。</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PairingPage() {
  const connectedDevices = useAdminStore((state) => state.connectedDevices);

  return (
    <section className="panel">
      <h2>配对与访问</h2>
      <div className="pairing-grid">
        <div className="qr-placeholder">QR</div>
        <div className="stack">
          <div className="row-card">
            <strong>当前访问地址</strong>
            <p>https://host.tailnet.example</p>
          </div>
          <div className="row-card">
            <strong>配对码</strong>
            <p>ACM-2026</p>
          </div>
          <div className="row-card">
            <strong>已连接设备</strong>
            <p>{connectedDevices} 台</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Agent Console</h1>
        <nav className="nav">
          <Link to="/">概览</Link>
          <Link to="/projects">项目</Link>
          <Link to="/pairing">配对</Link>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/pairing" element={<PairingPage />} />
        </Routes>
      </main>
    </div>
  );
}
