import type { ReactNode } from "react";

export type BadgeVariant = "default" | "online" | "idle" | "warning" | "error" | "info" | "neutral";

const variantMap: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: { bg: "bg-[var(--color-bg-surface-alt)]", text: "text-[var(--color-text-secondary)]", border: "border-[var(--color-border-default)]" },
  online: { bg: "bg-[var(--color-status-online-bg)]", text: "text-[var(--color-status-online)]", border: "border-[var(--color-status-online-border)]" },
  idle: { bg: "bg-[var(--color-status-idle-bg)]", text: "text-[var(--color-status-idle)]", border: "border-[var(--color-status-idle-border)]" },
  warning: { bg: "bg-[var(--color-status-warning-bg)]", text: "text-[var(--color-status-warning)]", border: "border-[var(--color-status-warning-border)]" },
  error: { bg: "bg-[var(--color-status-error-bg)]", text: "text-[var(--color-status-error)]", border: "border-[var(--color-status-error-border)]" },
  info: { bg: "bg-[var(--color-status-info-bg)]", text: "text-[var(--color-status-info)]", border: "border-[var(--color-status-info-border)]" },
  neutral: { bg: "bg-[var(--color-bg-surface-alt)]", text: "text-[var(--color-text-tertiary)]", border: "border-[var(--color-border-default)]" },
};

type Props = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function StatusBadge({ children, variant = "default", className = "" }: Props) {
  const style = variantMap[variant];
  return (
    <span
      className={[
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        style.border,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
