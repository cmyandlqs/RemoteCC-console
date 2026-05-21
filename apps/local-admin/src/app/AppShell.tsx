import { Link, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { path: "/", label: "概览", icon: DashboardIcon },
  { path: "/projects", label: "项目", icon: FolderIcon },
  { path: "/approvals", label: "审批", icon: ShieldIcon },
  { path: "/pairing", label: "配对", icon: LinkIcon },
];

export function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-base)]">
      {/* Sidebar */}
      <aside className="w-[var(--sidebar-width)] flex-shrink-0 flex flex-col border-r border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
        {/* Brand */}
        <div className="h-[var(--header-height)] flex items-center px-4 border-b border-[var(--color-border-subtle)]">
          <span className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
            Agent Console
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={[
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-[var(--duration-fast)]",
                  isActive
                    ? "bg-[var(--color-bg-surface-hover)] text-[var(--color-text-primary)] font-medium"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]",
                ].join(" ")}
              >
                <item.icon className={isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-tertiary)]"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom status */}
        <div className="p-3 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-status-online-bg)] border border-[var(--color-status-online-border)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-status-online)] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-status-online)]" />
            </span>
            <span className="text-xs font-medium text-[var(--color-status-online)]">Online</span>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/* Minimal inline SVG icons */
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
