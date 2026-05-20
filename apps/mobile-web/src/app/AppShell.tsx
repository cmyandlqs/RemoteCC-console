import { Link, Outlet, useLocation } from "react-router-dom";

export function AppShell() {
  const location = useLocation();
  const isSessionPage = location.pathname.startsWith("/sessions/");

  return (
    <div className="mobile-app">
      {!isSessionPage && (
        <nav className="bottom-nav">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            主机
          </Link>
        </nav>
      )}
      <div className={!isSessionPage ? "page-content" : ""}>
        <Outlet />
      </div>
    </div>
  );
}