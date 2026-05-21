import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className = "" }: Props) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center",
        "py-10 px-4",
        className,
      ].join(" ")}
    >
      {icon && (
        <div className="mb-3 text-[var(--color-text-muted)]">
          {icon}
        </div>
      )}
      {title && (
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          {title}
        </p>
      )}
      {description && (
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
