import { useState } from "react";
import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
};

export function ShellOutput({ title = "Output", children, className = "", collapsible = true }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={[
        "rounded-md bg-[var(--color-bg-inset)] border border-[var(--color-border-default)] overflow-hidden",
        className,
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-surface-alt)] border-b border-[var(--color-border-subtle)]">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-tertiary)]">
          {title}
        </span>
        {collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            {collapsed ? "+" : "−"}
          </button>
        )}
      </div>

      {!collapsed && (
        <pre className="px-3 py-2.5 text-xs font-mono text-[var(--color-text-secondary)] leading-relaxed overflow-x-auto">
          {children}
        </pre>
      )}
    </div>
  );
}
