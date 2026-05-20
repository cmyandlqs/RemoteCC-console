import { Link, Route, Routes } from "react-router-dom";
import { create } from "zustand";

type MobileStore = {
  pendingApprovals: number;
};

const useMobileStore = create<MobileStore>(() => ({
  pendingApprovals: 1,
}));

function HostsPage() {
  return (
    <section className="mobile-panel">
      <header className="section-header">
        <div>
          <h2>我的主机</h2>
          <p>选择在线主机并进入项目列表。</p>
        </div>
        <span className="status-dot">在线</span>
      </header>
      <div className="stack">
        <Link className="list-card" to="/projects/demo-project">
          <strong>Linux Host</strong>
          <span>3 个项目 · 2 个活跃会话</span>
        </Link>
      </div>
    </section>
  );
}

function ProjectsPage() {
  return (
    <section className="mobile-panel">
      <header className="section-header">
        <div>
          <h2>项目与会话</h2>
          <p>查看项目下的 Claude Code 会话。</p>
        </div>
        <button type="button">新建会话</button>
      </header>
      <div className="stack">
        <div className="list-card">
          <strong>RemoteCC-console</strong>
          <span>main · 工作区干净</span>
        </div>
        <Link className="list-card" to="/sessions/sess-demo">
          <strong>会话：MVP 骨架搭建</strong>
          <span>空闲 · 最近更新 1 分钟前</span>
        </Link>
      </div>
    </section>
  );
}

function SessionPage() {
  const pendingApprovals = useMobileStore((state) => state.pendingApprovals);

  return (
    <section className="session-shell">
      <header className="session-header">
        <div>
          <h2>会话详情</h2>
          <p>RemoteCC-console / MVP 骨架搭建</p>
        </div>
        <span className="status-dot">流式输出</span>
      </header>

      <div className="metric-strip">
        <span>模型：Claude Code</span>
        <span>Token：待接入</span>
        <span>Cost：待接入</span>
        <span>Context Window：待接入</span>
      </div>

      <div className="timeline">
        <article className="bubble assistant">
          <strong>系统事件</strong>
          <p>这里将显示结构化输出流、工具结果和错误信息。</p>
        </article>
        <article className="approval-card">
          <strong>审批请求</strong>
          <p>当前待处理审批 {pendingApprovals} 条，骨架阶段仅展示卡片与拒绝操作入口。</p>
          <div className="actions">
            <button type="button">拒绝</button>
            <button type="button" disabled>
              回到主机处理
            </button>
          </div>
        </article>
      </div>

      <footer className="composer">
        <input type="text" placeholder="输入要发送给 Claude Code 的内容" />
        <button type="button">发送</button>
      </footer>
    </section>
  );
}

export function App() {
  return (
    <div className="mobile-app">
      <Routes>
        <Route path="/" element={<HostsPage />} />
        <Route path="/projects/:projectId" element={<ProjectsPage />} />
        <Route path="/sessions/:sessionId" element={<SessionPage />} />
      </Routes>
    </div>
  );
}
