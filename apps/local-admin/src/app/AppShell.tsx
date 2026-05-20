import { Link, Outlet } from "react-router-dom";

export function AppShell() {
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
        <Outlet />
      </main>
    </div>
  );
}