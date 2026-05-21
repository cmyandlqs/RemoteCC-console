import type { ReactNode } from "react";

export type StatusVariant = "online" | "idle" | "warning" | "error" | "info" | "neutral";

const variantMap: Record<StatusVariant, { bg: string; border: string; text: string; pulse?: boolean }> = {
  online: { bg: "bg-[var(--color-status-online-bg)]", border: "border-[var(--color-status-online-border)]", text: "text-[var(--color-status-online)]", pulse: true },
  idle: { bg: "bg-[var(--color-status-idle-bg)]", border: "border-[var(--color-status-idle-border)]", text: "text-[var(--color-status-idle)]" },
  warning: { bg: "bg-[var(--color-status-warning-bg)]", border: "border-[var(--color-status-warning-border)]", text: "text-[var(--color-status-warning)]", pulse: true },
  error: { bg: "bg-[var(--color-status-error-bg)]", border: "border-[var(--color-status-error-border)]", text: "text-[var(--color-status-error)]", pulse: true },
  info: { bg: "bg-[var(--color-status-info-bg)]", border: "border-[var(--color-status-info-border)]", text: "text-[var(--color-status-info)]" },
  neutral: { bg: "bg-[var(--color-bg-surface-alt)]", border: "border-[var(--color-border-default)]", text: "text-[var(--color-text-tertiary)]" },
};

type Props = {
  variant: StatusVariant;
  label?: ReactNode;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
};

export function StatusDot({ variant, label, size = "sm", pulse, className = "" }: Props) {
  const style = variantMap[variant];
  const shouldPulse = pulse ?? style.pulse;
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        style.bg,
        style.border,
        style.text,
        className,
      ].join(" ")}
    >
      <span
        className={[
          "rounded-full",
          dotSize,
          shouldPulse ? "animate-pulse" : "",
        ].join(" ")}
        style={{ backgroundColor: "currentColor" }}
      />
      {label}
    </span>
  );
}
