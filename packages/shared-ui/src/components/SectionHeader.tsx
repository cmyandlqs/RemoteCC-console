import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, description, action, className = "" }: Props) {
  return (
    <div className={["flex items-start justify-between gap-4 mb-5", className].join(" ")}>
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
