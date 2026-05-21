import { Link, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { path: "/", label: "主机", icon: HomeIcon },
  { path: "/approvals", label: "审批", icon: ShieldIcon, badge: true },
];

export function AppShell() {
  const location = useLocation();
  const isSessionPage = location.pathname.startsWith("/sessions/");

  // Only show bottom nav on non-session pages
  const showNav = !isSessionPage;

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      <main className={showNav ? "page-safe" : ""}>
        <Outlet />
      </main>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-[var(--z-fixed)] bg-[var(--color-bg-surface)]/80 backdrop-blur-md border-t border-[var(--color-border-subtle)] safe-bottom">
          <div className="flex items-center justify-around h-[var(--bottom-nav-height)]">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={[
                    "flex flex-col items-center justify-center gap-0.5 flex-1 h-full",
                    "text-xs font-medium transition-colors duration-[var(--duration-fast)]",
                    isActive
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-text-tertiary)]",
                  ].join(" ")}
                >
                  <item.icon
                    className={isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
